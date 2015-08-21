<?php

include_once 'php/PingRequest.php';

trait Request {

    //USER REQUESTS
    function addUser($lang = "en") {
        $userId = null;
        $userName = "";
        if (isset($this->requestValue['name'])) {
            $userName = $this->requestValue['name'];
        }
        if (isset($this->userId)) {
            $userId = $this->userId;
        }

        //WEBSOCKET
//        if (isset($this->requestValue['socket'])) {
//            //
//        } else {
//            if (isset($_COOKIE['smltown_userName'])) {
//                $userName = $_COOKIE['smltown_userName'];
//            }
//        }
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
        }

        $_SESSION['userId'] = $userId;
        return $userId;
        //setCookieValue("smltown_userName", $userName);
        //    if (null != $obj && isset($obj->gameId)) {
        //        addUserInGame($obj);
        //    }
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
                //        echo "error user id: $userId";
                //        die();
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
                die();
            }

            $values = array('password' => $this->requestValue->password);
            $count = petition("SELECT count(*) as count FROM smltown_games WHERE id = $gameId AND password = :password", $values)[0]->count;
            if ($count == 0) {
                echo "SMLTOWN.Game.askPassword('wrong passord');";
                die();
            }
        }
        //password done
        $_SESSION["game$gameId"] = 1;

        //admin check
        $admin = null;

        $values = array('userId' => $userId, 'gameId' => $gameId);

        //add if not exists
        $sql = "INSERT INTO smltown_plays (userId, gameId, admin) SELECT :userId, :gameId,";
        if (null == $admin) {
            $sql .= " CASE WHEN (SELECT count(*) FROM smltown_plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE 0 END";
        } else {
            $sql .= " $admin";
        }
        $sql .= " FROM DUAL" //from ANY TABLE (read table only 1 time)
                . " WHERE (SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = :gameId) = 0";
        $sth = sql($sql, $values);

        //update playId
        $playId = petition("SELECT id FROM smltown_plays WHERE userId = :userId AND gameId = :gameId", $values)[0]->id;
        $_SESSION['playId'] = $this->playId = $playId;
        //$this->playId = $playId;
        //remove as websocket test
        //$_COOKIE['smltown_userId'] = $userId;
        //WEBSOCKET
        if (isset($this->requestValue['socket'])) {
            echo " add playId to socket = $playId; \n";
            $this->requestValue['socket']->val->$playId = true;
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
                        . "WHERE name = '$userName' AND gameId = $gameId")[0]->count;

        if ($duplicateName > 0) {
            $res = array(
                'type' => "SMLTOWN.Message.login",
                "log" => "duplicatedName"
            );
            $this->send_response(json_encode($res), $playId);
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
        $this->reloadClientGame($playId);
    }

    public function chat() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $text = $this->requestValue['text'];

        $res = array(
            'type' => "chat",
            'playId' => $playId,
            'text' => $text
        );

        $plays = petition("SELECT id FROM smltown_plays WHERE gameId = $gameId AND id <> $playId");
        for ($i = 0; $i < count($plays); $i++) {
            $this->send_response(json_encode($res), $plays[$i]->id);
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
        $this->send_response(json_encode(array('type' => 'extra', 'data' => $data)), $playId);
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
