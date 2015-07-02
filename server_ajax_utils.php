<?php

function serverRequest($content) {
    $obj = json_decode($content);
    
    if (is_object($obj) && $obj->action) {

        $userId = null;
        if (isset($_SESSION["userId"])) {
            $userId = $_SESSION["userId"];
        }

        include_once 'php/DB.php';
        include_once 'php/request.php';
        include_once 'php/requestAdmin.php';
        include_once 'php/engine.php';
        include_once 'php/response.php';
        include_once 'php/utils.php';

        $action = $obj->action;
        $obj->userId = $userId;
        if (!isset($obj->gameId)) {
            $obj->gameId = gameId();
        }

        if (isset($queries['id'])) {
            $gameCount = petition("SELECT count(*) as count FROM smltown_games WHERE id = " . $queries['id'])[0]->count;
            if (0 == $gameCount) {
                echo "SMLTOWN.Load.showPage('gameList')"; //prevent "ghost games" petitions 
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
        sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE gameId = $gameId AND userId = '$userId' AND admin > -1", $values);
    } else if (isset($gameId)) {
        sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE gameId = $gameId AND admin > -1", $values);
    } else {
        echo "server_ajax error";
    }
}
