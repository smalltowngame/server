<?php

session_start();

//PING resquest
$content = file_get_contents("php://input");

if (empty($content)) { //reply petition
    if (!isset($_GET["id"])) { //id in url request
        echo "SMLTOWN.Load.showPage('gameList', '!isset id')";
        die();
    }
    if (!isset($_SESSION["userId"])) { //reload user
        echo "SMLTOWN.Load.reloadGame()";
        die();
    }
    $userId = $_SESSION["userId"];

    include_once 'php/DB.php';
    $plays = petition("SELECT reply FROM smltown_plays WHERE userId = '$userId' AND gameId = " . $_GET["id"]);
    if (count($plays)) {
        if (empty($plays[0]->reply)) {
            die();
        }
    } else { // let time to create play on addUserInGame?
        //echo "SMLTOWN.Load.showPage('gameList', 'not play found')";
        die();
    }

    //do transaction to prevents remove recents reply's on multiple requests
    echo transaction(array(
        // save '' for concat replys
        "SET @reply := NULL"
        , "UPDATE smltown_plays SET reply = @reply := reply, reply = '' WHERE userId = '$userId' AND gameId = " . $_GET["id"]
        . " LIMIT 1" // LIMIT 1 to prevent collapse on duplicate plays
        , "SELECT @reply AS reply"
    ));

//Normal request, echo = debug
} else {
    $obj = json_decode($content);

    if (is_object($obj) && $obj->action) {

        //playId and userId
        if (isset($_SESSION["playId"])) {
            $obj->playId = $_SESSION["playId"];
        }
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

    function send_response($json, $playId = null) {
        $gameId = $this->gameId;
//        echo $json;
//    $json = str_replace("'", "\'", $json); //rules attr escape quote

        $values = array('reply' => $json); //escape \ from utf-8 special chars
        if (isset($playId)) {
//            echo "; play id = $playId; $json";
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE id = $playId AND admin > -1", $values);
        } else {
            $sth = sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE gameId = $gameId AND admin > -1", $values);
        }
//        if ($sth->rowCount() == 0) { //nothing changes on insert: player is not new
//            echo "ERROR: send_response: JSON = $json; PLAYID = $playId";
//        }
    }

}
