<?php

include_once 'php/DB.php';
include_once 'php/engine.php';
include_once 'php/request.php';
include_once 'php/response.php';
include_once 'php/utils.php';
include_once 'php/functions.php';
include_once 'php/Card.php';

//to extend
class PingRequest {

    use Connection,
        Request,
        Response,
        Engine,
        Utils;
    
    var $admin = 0;

    function __construct($obj) {
        
        if (isset($obj->gameId)) {
            $this->gameId = $obj->gameId;

            //prevent "ghost games" petitions 
            $gameCount = petition("SELECT count(*) as count FROM smltown_games WHERE id = " . $this->gameId);
            if (0 == $gameCount && parseInt($this->gameId) != 1) { //1 == default game number
                echo "SMLTOWN.Load.showPage('gameList', '0 == game count');";
                echo "not valid game Id: " . $this->gameId;
                return;
            }
        } else {
            $this->gameId = $this->gameId();
        }

        if (isset($obj->playId)) {
            $this->playId = $obj->playId;
        }
        if (isset($obj->userId)) {
            $this->userId = $obj->userId;
        }

        //set  values
        $this->requestValue = array();
        foreach ($obj as $key => $value) {
            $this->requestValue[$key] = $value;
        }

        $this->admin = 1;
    }

    private function gameId() {
        $games = petition("SELECT id FROM smltown_games LIMIT 1");
        if (count($games)) {
            return $games[0]->id;
        } else {
            createGame(null, 1);
            return 1;
        }
    }

}
