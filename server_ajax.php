<?php

session_start();
$userId = null;
if (isset($_SESSION["userId"])) {
    $userId = $_SESSION["userId"];
}
include_once 'DB.php';

//PING resquest
$content = file_get_contents("php://input");

if (empty($content)) {
    if (null != $userId) {
        if (isset($_GET["id"])) {
            $gameId = $_GET["id"];
        } else {
            $gameId = gameId();
        }

        $plays = petition("SELECT reply FROM smltown_plays WHERE userId = $userId AND gameId = $gameId");
        if (count($plays) == 0) {
            return;
        }
        echo $plays[0]->reply;
        sql("UPDATE smltown_plays SET reply = '' WHERE gameId = $gameId AND userId = $userId"); // '' for concat replys
    }
//Normal request, echo = error
} else {
    $obj = json_decode($content);
    if (is_object($obj) && $obj->action) {

        include_once 'DB_request.php';
        include_once 'DB_requestAdmin.php';
        include_once 'DB_engine.php';
        include_once 'DB_response.php';
        include_once 'DB_utils.php';

        $action = $obj->action;
        $obj->userId = $userId;
        if (!isset($obj->gameId)) {
            $obj->gameId = gameId($obj);
        }
        
        if (isset($queries['id'])) {
            if (petition("SELECT count(*) as count FROM smltown_games WHERE id = " . $queries['id'])[0]->count == 0) {
                echo "window.history.back()"; //prevent "ghost games" petitions 
                return;
            }
        }
        $action($obj);
    } else {
        echo "error request data. isset:" . isset($obj) .
        ", is_object:" . is_object($obj);
    }
}

function gameId() {
    $games = petition("SELECT id FROM smltown_games LIMIT 1");
    if (count($games)) {
        return $games[0]->id;
    } else {
        sql("INSERT INTO smltown_games (id) VALUES (1)");
        return 1;
    }
}

function send_response($json, $gameId, $userId = null) {
//    $json = str_replace("'", "\'", $json); //rules attr escape quote
    $values = array('reply' => $json); //escape \ from utf-8 special chars
    if (isset($gameId) && isset($userId)) {
        sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE gameId = $gameId AND userId = $userId AND admin > -1", $values);
    } else if (isset($gameId)) {
        sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE gameId = $gameId AND admin > -1", $values);
    } else {
        echo "server_ajax error";
    }
}
