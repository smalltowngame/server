<?php

$gameLoaded = false;

function loadMainClass($gameType) { //once?
    //adminGame, game, normal
    global $gameLoaded;
    if (null != $gameType && !$gameLoaded) {
        $gameLoaded = true;
        include_once 'games/' . $gameType . '/backEnd.php';

        class Game extends PingRequest {

            use BackEnd;
        }

        class GameAdmin extends AdminRequest {

            use BackEnd;
        }

    }
}
