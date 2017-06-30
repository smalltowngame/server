<?php

include_once 'php/PingRequest.php';

trait Request {

    //special userId but playId
    public function addUserInGame() { //and create game
//        if (!isset($this->userId)) {
//            echo '!isset($this->userId)';
//            return;
//        }
        if (!isset($this->gameId)) {
            $gameId = $this->gameId();
            $this->gameId = $gameId;
        } else {
            $gameId = $this->gameId;
        }

        //$userId
        if (isset($this->userId) && !empty($this->userId) && "null" != $this->userId) {
            $values = array('userId' => $this->userId);
            $count = petition("SELECT count(*) as count FROM smltown_players WHERE id = :userId", $values)[0]->count;
            if (0 == $count) {
                //$this->addUser();
                echo "addUser with userId = $this->userId; ";
                addUser(array(
                    'userId' => $this->userId
                ));
            }
        } else {
            echo "get new user id; ";
            //if old websocket stores userId
            if (isset($this->requestValue['socket']->userId)) {
                $id = $this->requestValue['socket']->userId;
                $this->userId = addUser($id);
                //
            } else {
                $this->userId = addUser();
            }
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
            if (!isset($this->requestValue['password'])) {
                //TODO: implement websocket
                echo "SMLTOWN.Game.askPassword();";
                return;
            }

            if ($select->password != $this->requestValue['password']) {
                //TODO: implement websocket
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

        sql("UPDATE smltown_players SET gameId = :gameId WHERE id = :userId", $values);

        $playerAlreadyInGame = isset($select->playId);
        if ($playerAlreadyInGame) {
            $this->playId = $select->playId;
            //
        } else {
            $sql = "INSERT INTO smltown_plays (userId, gameId, admin) SELECT :userId, :gameId,";
            if (isset($_COOKIE['smltown_spectator'])) {
                $sql .= "9";
            } else {
                $sql .= " CASE WHEN (SELECT count(*) FROM smltown_plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE -1 END"; //admin
            }
            $sql .= " FROM DUAL" //from ANY TABLE (read table only 1 time)
                    . " WHERE (SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) = 0";

            sql($sql, $values);

            //4 store in socket
            global $pdo;
            $this->playId = $pdo->lastInsertId();
            //echo "; lastInsertId = $this->playId; ";
            // update players in game -> only as INFO data
            $values = array(
                'gameId' => $gameId
            );
            sql("UPDATE smltown_games SET players = (SELECT count(*) FROM smltown_plays WHERE gameId = :gameId AND admin > -2) WHERE id = :gameId", $values);
        }

        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            $playId = $this->playId;
            echo " add playId to socket = $playId; \n";
            //store on OBJ->SOCKET ($playId, not playId)
            $this->requestValue['socket']->val->$playId = true;
            $this->requestValue['socket']->val->gameId = $gameId;

            //sort user socket with new userId
            global $users;
            $users[$userId] = $this->requestValue['socket'];

            //not:
        } else {
            //update playId (4 ajax)
            $_SESSION['playId'] = $this->playId;
            $_SESSION["game$gameId"] = 1;
        }

        //if 
        $this->loadGame($playerAlreadyInGame);
    }

    public function addFacebookUser() {
//        $userId = $this->userId;
//        $facebookId = $this->requestValue['facebookId'];
//        $values = array(
//            'facebookId' => $facebookId
//        );
//        sql("UPDATE IGNORE smltown_players SET facebook = :facebookId WHERE id = '$userId'", $values);
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

        //$this->checkGameErrors();
    }

    public function playGame() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        sql("UPDATE smltown_plays SET admin = 0 WHERE id = $playId AND 0 = (SELECT status FROM smltown_games WHERE id = $gameId)");
        $this->resetCards($playId);
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

        //reset rest of players
        if (isset($card)) {
            sql("UPDATE smltown_plays SET card = '', status = NULL WHERE gameId = $gameId", $values); //prevent important card removes from game
            $this->updatePlayers(null, "status");
        }

        //remove every own card
        $this->updateUsers(null, "card");
    }

    public function spectatorMode() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $status = petition("SELECT status FROM smltown_games WHERE id = $gameId")[0]->status;
        if ($status == null || $status == 0 || $status == 5) {
            sql("UPDATE smltown_plays SET admin = -1 WHERE id = $playId AND admin < 1");
            $this->resetCards($playId);
        } else {
            echo "error: can't make spectator in the middle of game";
        }
    }

    public function resetCards($playId = null) {
        $gameId = $this->gameId;
        $statusCount = count($this->TURNS);
        $sth = sql("UPDATE smltown_plays SET card = NULL WHERE gameId = $gameId "
                . "AND (SELECT status FROM smltown_games WHERE id = $gameId) IN (NULL, 0, 5)");

        $this->updatePlayers(null, "admin"); //way to update new players to other people
        $this->updateUsers(null, "card");
        $this->updateGame(null, "status"); //way to remove 'start game' button and maybe reset others

        if ($sth->rowCount() > 0) { //something changes
//            sql("UPDATE smltown_games SET status = $statusCount"); //if status = 0, auto-starts game on last message accept!            
            $this->setNotifications("gameRestartForPlayersChange", null, $playId);
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
//        $file = file("index.html");
//        $newLines = array();
//        foreach ($file as $line)
//            if (preg_match("/^(header\(\'name)/", $line) === 0) {
//                $newLines[] = chop($line);
//            } else {
//                $newLines[] = chop("header('name:$userName');");
//            }
//        $newFile = implode("\n", $newLines);
//        file_put_contents("index.html", $newFile);
//    }
    }

    public function setPicture() {
        $userId = $this->userId;
        $playId = $this->playId;
        $picture = $this->requestValue['picture'];

        $path = "pictures";
        $hash = md5($userId);
        $file = "$hash.png";
        if (!is_dir($path)) {
            mkdir($path);
        }
        file_put_contents("$path/$file", base64_decode($picture));

        $timestamp = (new DateTime())->getTimestamp();
        $lastmod = "lastmod=" + $timestamp;

        $values = array('picture' => "$path/$file?$lastmod");
        sql("UPDATE smltown_players SET picture = :picture WHERE id = '$userId'", $values);
        $this->updatePlayer($playId, "picture");
    }

    public function becomeAdmin() {
        $gameId = $this->gameId;
        $playId = $this->playId;

        sql("UPDATE smltown_plays SET admin = CASE WHEN admin = 1 THEN 0 WHEN id = $playId THEN 1 END WHERE gameId = $gameId");
        $this->setFlash("_adminRole", array("id" => $playId));
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

    public function nightChat() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $name = $this->requestValue['name'];
        $text = $this->requestValue['text'];

        $sqlId = "gameId = $gameId";
        if (isset($this->playId)) {
            $sqlId .= " AND id <> $this->playId";
        }
        $sqlId .= " AND card = (SELECT night FROM smltown_games WHERE id = $gameId)"
                . " AND card = (SELECT * FROM (SELECT card FROM smltown_plays WHERE id = $playId) as playCard)";

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
            'socialId' => "'$socialId'"
        );
        sql("UPDATE smltown_players SET friends = CONCAT_WS(',', "
                . "IF(LENGTH(friends), friends, NULL), "
                . ":socialId) WHERE id = '$userId'", $values);
    }

    public function checkTranslation() {
        $kind = $this->requestValue['kind'];
        $lang = $this->requestValue['lang'];
        $text = $this->requestValue['text'];

        include_once("utils/update_lang.php");
        if (isset($kind) && "help" == $kind) {
            $path = "games/mafia-werewolf/lang/";
        } else {
            $path = "lang/";
        }
        $path .= "$lang.js";
        updateFile($path, $text);
    }

    public function exitGame() {
//        $gameId = $this->gameId;
        $userId = $this->userId;
        $gameId = $this->requestValue['gameId'];

        sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND userId = '$userId'");
        $this->updatePlayers();
    }

}
