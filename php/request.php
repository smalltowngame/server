<?php

include_once 'php/PingRequest.php';

trait Request {

    //USER REQUESTS
    function addUser() {
        $userId = null;
        if (isset($this->userId)) {
            $userId = $this->userId;
        }
        $userName = "";
        if (isset($this->requestValue['name'])) {
            $userName = $this->requestValue['name'];
        }
        $lang = "en";
        if (isset($this->requestValue['lang'])) {
            $lang = $this->requestValue['lang'];
        }

        //add user
        if (null == $userId) {
            $userId = getRandomUserId();
            $this->userId = $userId;
        }
        $values = array('name' => $userName, 'userId' => $userId, 'lang' => $lang);
        $sqlRows = "id, name, lang";
        $sqlValues = ":userId, :name, :lang";
        if (isset($this->requestValue['type'])) {
            $values['type'] = $this->requestValue['type'];
            $sqlRows .= ",type";
            $sqlValues .= ",:type";
        }
        if (isset($this->requestValue['socialId'])) {
            $values['socialId'] = $this->requestValue['socialId'];
            $sqlRows .= ",socialId";
            $sqlValues .= ",:socialId";
        }
        sql("INSERT INTO smltown_players ($sqlRows) VALUES ($sqlValues) "
                . "ON DUPLICATE KEY UPDATE name=VALUES(name), lang=VALUES(lang), "
                . "type=VALUES(type), socialId=VALUES(socialId)", $values);

        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            global $users;
            $users[$userId] = $this->requestValue['socket'];
            $this->requestValue['socket']->userId = $userId;
        }

        //if not exists
        setcookie('smltown_userId', $userId);
    }

    //special userId but playId
    public function addUserInGame() { //and create game        
        if (!isset($this->gameId)) {
            $gameId = $this->gameId();
        } else {
            $gameId = $this->gameId;
        }

        //$userId
        if (isset($this->userId) && !empty($this->userId) && "null" != $this->userId) {
            $values = array('userId' => $this->userId);
            $count = petition("SELECT count(*) FROM smltown_players WHERE id = :userId", $values);
            if (count($count)) {
                $this->addUser();
            }
        } else {
            $this->addUser();
        }
        $userId = $this->userId;

        //prevent sql injection on gameId
        $values = array(
            'userId' => $userId,
            'gameId' => $gameId
        );

        $select = petition("SELECT password"
                        . ", (SELECT id FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) AS playId"
                        . " FROM smltown_games WHERE id = :gameId", $values)[0]; //game checked in Ping-Request
        //if password game (1st time for game)
        if (isset($select->password) && !isset($_SESSION["game$gameId"])) {
            if (!isset($this->requestValue->password)) {
                echo "SMLTOWN.Game.askPassword();";
                return;
            }

            if ($select->password != $this->requestValue->password) {
                echo "SMLTOWN.Game.askPassword('wrong passord');";
                return;
            }
        }

//        //if password done
//        sql("UPDATE smltown_players SET gameId = $gameId WHERE id = '$userId'");
//        $_SESSION["game$gameId"] = 1;
//
//        // if not exists
//        $values = array('userId' => $userId, 'gameId' => $gameId);
//        $sth = sql("INSERT INTO smltown_plays (userId, gameId, admin) SELECT :userId, :gameId,"
//                . " CASE WHEN (SELECT count(*) FROM smltown_plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE -1 END" //admin
//                . " FROM DUAL" //from ANY TABLE (read table only 1 time)
//                . " WHERE (SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) = 0", $values);

        $transactions = array(
            "UPDATE smltown_players SET gameId = :gameId WHERE id = :userId"
        );

        if (!isset($select->playId)) {
            array_push($transactions, "INSERT INTO smltown_plays (userId, gameId, admin) SELECT :userId, :gameId,"
                    . " CASE WHEN (SELECT count(*) FROM smltown_plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE -1 END" //admin
                    . " FROM DUAL" //from ANY TABLE (read table only 1 time)
                    . " WHERE (SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) = 0"
            );
        }

        transaction($transactions, $values);
        $this->playId = $select->playId;

        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            echo " add playId to socket = $this->playId; \n";
            $this->requestValue['socket']->val->playId = true;
            $this->requestValue['socket']->val->gameId = $gameId;
            //not:
        } else {
            //update playId (4 ajax)
            $_SESSION['playId'] = $this->playId;
            $_SESSION["game$gameId"] = 1;
        }

        $this->loadGame(isset($select->playId));
    }

    public function loadGame($current) {
        $playId = $this->playId;

        //UPDATE
        $this->updateRules($playId);
        $this->updateUsers($playId);
        if ($current) { //nothing changes on insert: player is not new
            $this->updatePlayers($playId);
        } else {
            $this->updatePlayers(); //way to update new players to others
        }
        //updateRules($gameId, $userId); //THIS position admin / playing cards
        $this->updateGame($playId);

        $this->checkGameErrors();
    }

    public function playGame() {
        $userId = $this->userId;
        $playId = $this->requestValue['id'];

        $sth = sql("UPDATE smltown_plays SET admin = 0 WHERE id = $playId AND userId = '$userId'");
        if ($sth->rowCount() == 0) {
            echo "error: can't playGame with this credentials";
        } else {
            $this->updatePlayer($playId, "admin"); //way to update new players to other people
        }
    }

    public function deletePlayer() { //at specific game
        $gameId = $this->gameId;
        $playId = $this->playId;
        $id = $this->requestValue['id'];

        $values = array(
            'id' => $id
        );

        $card = null;
        $plays = petition("SELECT card FROM smltown_plays WHERE id = $playId");
        if (count($plays) > 0) {
            $card = $plays[0]->card;
        }

        $sth = sql("DELETE FROM smltown_plays WHERE ("
                . " 1 = (SELECT * FROM (SELECT admin FROM smltown_plays WHERE id = $playId) AS a)"
                . " OR id = $playId) "
                . " AND id = :id", $values);

        if ($sth->rowCount() == 0) { //nothing changes
            echo "can't delete player of game.";
            return;
        }

        if (isset($card)) {
            sql("UPDATE smltown_plays SET card = '', status = NULL WHERE gameId = $gameId", $values); //prevent important card removes from game
            $this->updatePlayers(null, "status");
        }

        $this->updateUsers(null, "card");
    }

    public function spectatorMode() {
        $userId = $this->userId;
        $playId = $this->requestValue['id'];

        $sth = sql("UPDATE smltown_plays SET admin = -1 WHERE id = $playId AND userId = '$userId'");
        if ($sth->rowCount() == 0) {
            echo "error: can't spectatorMode with this credentials";
        } else {
            $this->updatePlayer($playId, "admin"); //way to update new players to other people
        }
    }

    public function setName() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $userName = $this->requestValue['name'];

        $values = array('name' => $userName);

        $duplicateName = petition("SELECT count(*) as count FROM smltown_players "
                        //add players name table
                        . "LEFT OUTER JOIN smltown_plays "
                        . "ON smltown_plays.userId = smltown_players.id "
                        //       
                        . "WHERE name = '$userName' AND smltown_plays.gameId = $gameId")[0]->count;

        if ($duplicateName > 0) {
            $res = array(
                'type' => "SMLTOWN.Message.login",
                "log" => "duplicatedName"
            );
            $this->send_response($res, $playId);
            return;
        }

        //insert if necessary
        sql("INSERT INTO smltown_players (id, name) SELECT userId, ':name' FROM smltown_plays WHERE id = $playId ON DUPLICATE KEY UPDATE name = :name", $values);

        //$_COOKIE['smltown_userName'] = $userName;
        $this->updatePlayer($playId, "name"); //way to update new players to other people
//
        //rewrite header to name game <TODO>
//    if ("127.0.0.1" == $_SERVER['REMOTE_ADDR']) {
//        $file = file("index.php");
//        $newLines = array();
//        foreach ($file as $line)
//            if (preg_match("/^(header\(\'name)/", $line) === 0) {
//                $newLines[] = chop($line);
//            } else {
//                $newLines[] = chop("header('name:$userName');");
//            }
//        $newFile = implode("\n", $newLines);
//        file_put_contents("index.php", $newFile);
//    }
    }

    public function becomeAdmin() {
        $gameId = $this->gameId;
        $playId = $this->playId;

        sql("UPDATE smltown_plays SET admin = CASE WHEN id = $playId THEN 1 ELSE 0 END WHERE gameId = $gameId");
        $this->setFlash("adminRole", array("id" => $playId));
//        $this->reloadClientGame($playId);
    }

    public function chat() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $name = $this->requestValue['name'];
        $text = $this->requestValue['text'];

        $sqlId = "gameId = $gameId";
        if (isset($this->playId)) {
            $sqlId .= " AND id <> $this->playId";
        }

        $this->setChat($text, $sqlId, $playId, $name);
    }

    ////////////////////////////////////////////////////////////////////////////////
    //AUTO GAME REQUESTS
    //on error request
    public function getAll() {
        if (isset($this->playId)) {
            $playId = $this->playId;
            $this->updateAll($playId);
        }
    }

    public function setPlayerNotifications() { //by socialId      
        $gameId = $this->gameId;
        $playId = $this->playId;

        $name = "";
        $players = petition("SELECT name FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE id = $playId)");
        if (count($players) > 0) {
            $name = $players[0]->name;
        }

        $json = $this->requestValue['friends'];
        $message = $this->requestValue['message'];

        $array = json_decode($json);
        for ($i = 0; $i < count($array); $i++) {
            $socialId = $array[$i];
            $res = array(
                'type' => "chat",
                'text' => $message,
                'gameId' => $gameId,
                'name' => $name
            );
            $this->send_social_response($res, $socialId);
        }
    }

    public function nightExtra() {
        $playId = $this->playId;

        $play = $this->getCard();
        if (!$play) {
            echo "bad extra card request";
            return;
        }

        $card = $this->getCardFileByName($play->card);

        $data = $card->extra();
        $this->send_response(array('type' => 'extra', 'data' => $data), $playId);
    }

    public function openVotingEnd() { //only as openVoting admin option, or openVoting on finish
        $this->townVotations();
    }

    public function dayEnd() {
        $gameId = $this->gameId;

        $count = petition("SELECT count(*) as count FROM smltown_games WHERE time = 0 AND id = $gameId")[0]->count;
        if ($count == 0) {
            return;
        }

        $this->pendingVotes();
    }

    public function setSocialStauts() {
        $playId = $this->playId;
        sql("UPDATE smltown_plays SET social = 'feeded' WHERE id = $playId");
    }

    public function addFriend() {
        $userId = $this->userId;
        $socialId = $this->requestValue['socialId'];
        $values = array(
            'socialId' => $socialId
        );
        sql("UPDATE smltown_players SET friends = CONCAT(friends , '|' , :socialId) WHERE id = '$userId'", $values);
    }

}
