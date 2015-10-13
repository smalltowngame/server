<?php

header('Access-Control-Allow-Origin: *');

$GLOBALS['ROOT'] = dirname(__FILE__);
session_start();

//PING resquest
$content = file_get_contents("php://input");

if (empty($content)) { //reply petition
    if (!isset($_GET["id"])) { //id in url request
        echo ";SMLTOWN.Load.showPage('gameList', '!isset id');";
        die();
    }

    if (!isset($_COOKIE["smltown_userId"])) { //reload user
        echo ";smltown_debug('reload game on smltown_ajax');";
        echo ";SMLTOWN.Load.reloadGame();";
        die();
    }
    $userId = $_COOKIE["smltown_userId"];

    include_once 'php/DB.php';

    $plays = petition("(SELECT reply FROM smltown_players WHERE id = '$userId')"
            . " UNION "
            . "(SELECT reply FROM smltown_plays WHERE userId = '$userId' AND gameId = " . $_GET["id"] . ")");

    if (!count($plays)) {
        //echo "SMLTOWN.Load.showPage('gameList', 'not play found')";
        die();
    }
    if (empty($plays[0]->reply) && empty($plays[1]->reply)) {
        die();
    }

    //do real request after check: this echo's will fire few times
    //do transaction: prevents remove recents reply's on multiple requests
    echo transaction(array(
        // save '' for concat replys
        "SET @reply1 := NULL, @reply2 := NULL"
        , " UPDATE smltown_plays SET reply = @reply1 := reply, reply = '' WHERE userId = '$userId' AND gameId = " . $_GET["id"]
        . " LIMIT 1" // LIMIT 1 to prevent collapse on duplicate plays
        , " UPDATE smltown_players SET reply = @reply2 := reply, reply = '' WHERE id = '$userId'"
        , " SELECT CONCAT(@reply1 , '|' , @reply2) AS reply"
    ));

//Normal request, echo = debug
} else {
    $obj = json_decode($content);

    if (is_object($obj) && $obj->action) {

        //userId
        if (isset($_COOKIE["smltown_userId"])) { //user-id session needed
            $obj->userId = $_COOKIE["smltown_userId"];
        }

        if (isset($obj->gameType)) {
            include_once 'games/' . $obj->gameType . '/backEnd.php';
        }

        include_once 'php/requestAdmin.php';
        include_once 'php/PingRequest.php';
        include_once 'smltown_functions.php';

        if (isset($obj->gameType)) {
            loadMainClass($obj->gameType);

            if (true) {
                $request = new GameAdmin($obj);
            } else {
                //$request = new Game($obj);
            }
        } else {
            $request = new PingRequest($obj);
        }

        $action = $obj->action;
        $request->$action();
        //
    } else {
        echo "error request data. isset:" . isset($obj) . ", is_object:" . is_object($obj);
    }
}

trait Connection {

    function send_social_response($obj, $socialId) {
        global $websocket_server;

        $gameId = $this->gameId;
        $obj['gameId'] = $gameId;
        $json = json_encode($obj);

        $values = array(
            'socialId' => $socialId,
            'reply' => $json //escape \ from utf-8 special chars
        );
        $sth = sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE "
                . "socialId = :socialId AND websocket = 0", $values);

        if ($sth->rowCount() > 0) {
            return;
        }

        if (!$websocket_server || isset($_SESSION['onlyAjax'])) {
            return;
        }

        // WEBSOCKET call ///////////////////////////////////////////
        $values = array(
            'socialId' => $socialId
        );
        $players = petition("SELECT id FROM smltown_players WHERE socialId = :socialId", $values);
        if (count($players) == 0) {
            die("some player not found");
        }

        include_once 'websocket/client/Base.php';
        include_once 'websocket/client/Client.php';

        $client = new Client("ws://localhost:9000/smalltown/smalltown/smltown_websocket.php");
        $obj['action'] = "ajax";
        $obj['userId'] = $players[0]->userId;
        $client->send(json_encode($obj));
        $client->__destruct();
    }

    function send_response($obj, $playId = null, $playerReply = false) {
        global $websocket_server;
        $gameId = $this->gameId;

        if (isset($playId)) {
            $json = json_encode($obj);
            
            //MYSELF
            if ($this->playId == $playId) {
                echo "|$json";
                return;
            }

            //warning: cant echo here. every individual messages will arrive before game updates. like 1st night before update
            //only in playing game            
            $values = array('reply' => $json); //escape \ from utf-8 special chars
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply)"
                    . " WHERE smltown_plays.id = $playId AND smltown_plays.admin != -2 AND"
                    . " (SELECT gameId FROM smltown_players WHERE id = smltown_plays.userId) = $gameId ", $values);

            //anywhere (all games)
            if ($playerReply && $sth->rowCount() == 0) {
                $obj['gameId'] = $gameId;
                $json = json_encode($obj);
                $values = array('reply' => $json); //escape \ from utf-8 special chars

                sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE "
                        . "id = (SELECT userId FROM smltown_plays WHERE id = $playId) "
                        . "AND websocket = 0", $values);
            }

            if (!$websocket_server || isset($_SESSION['onlyAjax'])) {
                return;
            }

            // WEBSOCKET calls ///////////////////////////////////////////
            include_once 'websocket/client/Base.php';
            include_once 'websocket/client/Client.php';

            //TODO: get on any url
            $client = new Client("ws://localhost:9000/smalltown/smalltown/smltown_websocket.php");
            $obj['action'] = "ajax";
            $userId = petition("SELECT userId FROM smltown_plays WHERE id = $playId")[0]->userId;
            $obj['userId'] = $userId;

            if (false == $client->send(json_encode($obj))) {
                $_SESSION['onlyAjax'] = true;
            }
            $client->__destruct();

            //
        } else { //ALL GAME PLAYERS
            //
            //only in game
            $json = json_encode($obj);
            $values = array('reply' => $json); //escape \ from utf-8 special chars
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE"
                    . " gameId = $gameId AND gameId = $gameId AND admin != -2", $values);

            //anywhere
            if ($playerReply && $sth->rowCount() == 0) {
                $obj['gameId'] = $gameId;
                $json = json_encode($obj);
                $values = array('reply' => $json); //escape \ from utf-8 special chars

                sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE"
                        . " id = (SELECT userId FROM smltown_plays WHERE gameId = $gameId)"
                        . " AND playId != $this->playId"
                        . " AND websocket = 0", $values);
                
                //MYSELF
                if ($this->gameId == $gameId) {
                    echo $json;
                    return;
                }
            }

            if (!$websocket_server || isset($_SESSION['onlyAjax'])) {
                return;
            }

            // WEBSOCKET calls ///////////////////////////////////////////
            include_once 'websocket/client/Base.php';
            include_once 'websocket/client/Client.php';

            $plays = petition("SELECT userId FROM smltown_plays WHERE gameId = $gameId");
            $client = new Client("ws://localhost:9000/smalltown/smalltown/smltown_websocket.php");
            for ($i = 0; $i < count($plays); $i++) {
                //TODO: get on any url
                $obj['action'] = "ajax";
                $obj['userId'] = $plays[$i]->userId;

                $client->send(json_encode($obj));
            }
            $client->__destruct();
        }
    }

}
