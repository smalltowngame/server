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
        }
        $values = array('userName' => $userName, 'userId' => $userId, 'lang' => $lang);
        sql("INSERT INTO smltown_players (id, name, lang) VALUES (:userId, :userName, :lang) ON DUPLICATE KEY UPDATE name=VALUES(name), lang=VALUES(lang)", $values);

        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            global $users;
            $users[$userId] = $this->requestValue['socket'];
            $this->requestValue['socket']->userId = $userId;
        }

        setcookie('smltown_userId', $userId);
        return $userId;
    }

    //special userId but playId
    public function addUserInGame() { //and create game        
        if (!isset($this->gameId)) {
            $gameId = $this->gameId();
        } else {
            $gameId = $this->gameId;
        }

        //$userId
        if (isset($this->userId)) {
            $userId = $this->userId;

            if ("null" == $userId || empty($userId) || !isset($userId)) {
                //echo "error user id: $userId";
                $userId = $this->addUser();
            }
        } else {
            $userId = $this->addUser();
        }

        //prevent sql injection on gameId
        $values = array('gameId' => $gameId);
        $game = petition("SELECT password FROM smltown_games WHERE id = :gameId", $values)[0]; //game checked in Ping-Request

        if ($game->password && !isset($_SESSION["game$gameId"])) {
            if (!isset($this->requestValue->password)) {
                echo "SMLTOWN.Game.askPassword();";
                return;
            }

            $values = array('password' => $this->requestValue->password);
            $count = petition("SELECT count(*) as count FROM smltown_games WHERE id = $gameId AND password = :password", $values)[0]->count;
            if ($count == 0) {
                echo "SMLTOWN.Game.askPassword('wrong passord');";
                return;
            }
        }

        //if password done
        sql("UPDATE smltown_players SET gameId = $gameId WHERE id = '$userId'");
        $_SESSION["game$gameId"] = 1;

        // if not exists
        $values = array('userId' => $userId, 'gameId' => $gameId);
        $sth = sql("INSERT INTO smltown_plays (userId, gameId, admin) SELECT :userId, :gameId,"
                . " CASE WHEN (SELECT count(*) FROM smltown_plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE 0 END" //admin
                . " FROM DUAL" //from ANY TABLE (read table only 1 time)
                . " WHERE (SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) = 0", $values);

        //update playId
        $playId = petition("SELECT id FROM smltown_plays WHERE userId = :userId AND gameId = :gameId", $values)[0]->id;
        $_SESSION['playId'] = $this->playId = $playId;
        //
        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            echo " add playId to socket = $playId; \n";
            $this->requestValue['socket']->val->$playId = true;
            $this->requestValue['socket']->val->gameId = $gameId;
        }

        $this->loadGame($sth->rowCount());
    }

    public function loadGame($rowCount) {
        $playId = $this->playId;

        //UPDATE
        $this->updateRules($playId);
        $this->updateUsers($playId);
        if ($rowCount == 0) { //nothing changes on insert: player is not new
            $this->updatePlayers($playId);
        } else {
            $this->updatePlayers(); //way to update new players to others
        }
        //updateRules($gameId, $userId); //THIS position admin / playing cards
        $this->updateGame($playId);

        $this->checkGameErrors();
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
        $text = $this->requestValue['text'];

        $res = array(
            'type' => "chat",
            'text' => $text
        );

        $sqlId = "";
        if (isset($this->playId)) {
            $res['playId'] = $this->playId;
            $sqlId = "AND smltown_plays.id <> $this->playId";
        }
        $plays = petition("SELECT smltown_plays.id, name FROM smltown_plays "
                //add players name table
                . "LEFT OUTER JOIN smltown_players "
                . "ON smltown_plays.userId = smltown_players.id "
                //    
                . "WHERE smltown_plays.gameId = $gameId $sqlId");

        for ($i = 0; $i < count($plays); $i++) {
            $res['name'] = $plays[$i]->name;
            $this->send_response($res, $plays[$i]->id, true); //to player
        }
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

    public function setMessage() {
        $message = $this->message;
        $id = $this->id;
        $this->saveMessage($message, $id);
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

}
