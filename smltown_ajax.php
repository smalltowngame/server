<?php

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
            . "UNION"
            . "(SELECT reply FROM smltown_plays WHERE userId = '$userId' AND gameId = " . $_GET["id"] . ")");
    if (count($plays)) {
        if (empty($plays[0]->reply) && empty($plays[1]->reply)) {
            die();
        }
    } else { // let time to create play on addUserInGame?
        //echo "SMLTOWN.Load.showPage('gameList', 'not play found')";
        die();
    }

    //do real request after check: this echo will fire few times
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

    function send_response($obj, $playId = null, $playerReply = false) {
        global $websocket_server;
        $gameId = $this->gameId;

        if (isset($playId)) {
            //warning: cant echo here. every individual messages will arrive before game updates. like 1st night before update
            //only in game
            $json = json_encode($obj);
            $values = array('reply' => $json); //escape \ from utf-8 special chars
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply)"
                    . " WHERE smltown_plays.id = $playId AND smltown_plays.admin > -1 AND"
                    . " (SELECT gameId FROM smltown_players WHERE id = smltown_plays.userId) = $gameId ", $values);
            
            //anywhere
            if ($playerReply && $sth->rowCount() == 0) {
                $obj['gameId'] = $gameId;
                $json = json_encode($obj);
                $values = array('reply' => $json); //escape \ from utf-8 special chars

                sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE "
                        . "id = (SELECT userId FROM smltown_plays WHERE id = $playId) "
                        . "AND websocket = 0", $values);
            }

            if (!$websocket_server) {
                return;
            }

            //else WEBSOCKET calls ///////////////////////////////////////////
            include_once 'websocket/client/Base.php';
            include_once 'websocket/client/Client.php';

            //TODO: get on any url                
            $client = new Client("ws://localhost:9000/smalltown/smalltown/smltown_websocket.php");
            $obj['action'] = "ajax";
            $obj['to'] = $playId;

            $client->send(json_encode($obj));
            $client->__destruct();
            //
        } else { //ALL GAME PLAYERS
            //
            //only in game
            $json = json_encode($obj);
            $values = array('reply' => $json); //escape \ from utf-8 special chars
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE"
                    . " gameId = $gameId AND gameId = $gameId AND admin > -1", $values);

            //anywhere
            if ($playerReply && $sth->rowCount() == 0) {
                $obj['gameId'] = $gameId;
                $json = json_encode($obj);
                $values = array('reply' => $json); //escape \ from utf-8 special chars

                sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE"
                        . " id = (SELECT userId FROM smltown_plays WHERE gameId = $gameId)"
                        . " AND websocket = 0", $values);
            }

            if (!$websocket_server) {
                return;
            }

            //else WEBSOCKET calls ///////////////////////////////////////////
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

class ConnectionException extends Exception {
    
}
