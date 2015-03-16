<?php

// RESPONSE PETITIONS
function updateAll($gameId, $userId = null) {
    updateUsers($gameId, $userId);

    $game = getGameInfo($gameId);
    $players = getInfoPlayers($gameId);

    $res = array(
        'type' => "update",
        'players' => $players,
        'game' => $game,
        'cards' => getRules($gameId)
    );
    send_response(json_encode($res), $gameId, $userId);
}

function updateUsers($gameId, $userId = null, $select = null) { //way to update sensitive data for every player
    $res = array(
        'type' => "update"
    );

    if (!$userId) {
        $players = petition("SELECT userId as id FROM plays WHERE gameId = $gameId"); //get all players
        for ($i = 0; $i < count($players); $i++) {
            $uniqueRes = $res;
            $userId = $players[$i]->id;
            $uniqueRes['user'] = getUserInfo($gameId, $userId, $select);
            send_response(json_encode($uniqueRes), $gameId, $userId);
        }
        return;
    }

    $res['user'] = getUserInfo($gameId, $userId, $select);
    send_response(json_encode($res), $gameId, $userId);
}

function updatePlayers($gameId, $userId = null, $selects = null) {
    $res = array(
        'type' => "update",
        'players' => getInfoPlayers($gameId, $selects, $userId)
    );
    send_response(json_encode($res), $gameId, $userId);
}

function updateGame($gameId, $userId = null, $array = null) {
    $game = getGameInfo($gameId, $userId, $array);
    $res = array(
        'type' => "update",
        'game' => $game
    );
    send_response(json_encode($res), $gameId, $userId);
}

function updateRules($gameId, $userId = null) {
    $res = array(
        'type' => "update",
        'cards' => getRules($gameId)
    );
    send_response(json_encode($res), $gameId, $userId);
}

// SQL
function getUserInfo($gameId, $userId, $select = null) {
    $sql = "SELECT";
    if ($select) {
        $sql = "$sql " . selectArray($select);
    } else {
        $sql = "$sql userId, card, rulesJS, message";
    }
    return petition("$sql FROM plays WHERE gameId = $gameId AND userId = '$userId'")[0];
}

function getInfoPlayers($gameId, $select = null, $userId = null) {
    $sql = "SELECT DISTINCT";
    if ($select) { //array values function
        $sql = "$sql userId as id, " . selectArray($select);
        //full request
    } else {
        $sql = "$sql plays.userId as id, plays.admin"
                //plays.sel when openVoting
                . ", CASE WHEN 1 = (SELECT openVoting FROM games WHERE id = $gameId) THEN plays.sel END AS sel"
                //name from players.name
                . ", CASE WHEN players.id = plays.userId THEN players.name ELSE '' END AS name"
                //status 1 when is 0
                . ", CASE WHEN plays.status > -1 THEN 1 ELSE plays.status END AS status"
                //card if dead or end game
                . ", CASE WHEN plays.status = -1 OR (SELECT status FROM games WHERE id = $gameId) = 3 ";
        if (null != $userId && !is_array($userId)) { //same user cards
            //card if is night and same player
            $sql = "$sql OR plays.card = (SELECT card FROM plays WHERE status = 2 AND userId = $userId AND gameId = $gameId)";
        }
        $sql = "$sql THEN card END AS card";
    }
    $sql = "$sql FROM plays, players WHERE (plays.gameId = $gameId AND players.id = plays.userId) OR (plays.gameId = $gameId AND plays.admin < 0)";
    $values = array();
    if (is_array($userId)) {
        $wheres = $userId;
        foreach ($wheres as $name => $value) {
            $sql = "$sql AND $name = :$name";
            $values[$name] = $value;
        }
    }

    return petition($sql, $values);
}

function getGameInfo($gameId, $userId = null, $array = null) {
    $sql = "SELECT";
    if ($array) { //array values function
        $sql = "$sql " . selectArray($array);
        //full request
    } else {
        $sql = "$sql id,name,password,status,time,dayTime,openVoting,endTurn,cards,chat";
        if ($userId) {
            $sql = "$sql ,"
			. " CASE WHEN (SELECT card FROM plays WHERE userId = '$userId' AND gameId = $gameId) = night"
            . " OR status = 1 AND"
            . " (SELECT count(*) FROM plays WHERE message IS NOT NULL) = 0"
			. "	THEN night END AS night";
        }
    }

    $games = petition("$sql FROM games WHERE id = $gameId");

    if (count($games) > 0) { //exists
        $game = $games[0];
        if (isset($game->time)) {
            $game->time = $game->time - (microtime(true) * 1000); //unify time users
        }
        return (object) array_filter((array) $game, "nullFilter"); //remove nulls but not 0
    }
    return false;
}

function getGamesInfo() { //all game selector page
    //remove plays without game
    sql("DELETE FROM plays WHERE 0 = (SELECT count(*) FROM games WHERE id = plays.gameId)");

    session_start();
//    if (isset($_SESSION['userId'])) {
//        $userId = $_SESSION['userId'];
//        //remove plays user out of game
//        sql("DELETE FROM plays WHERE userId = $userId AND "
//                . "0 = (SELECT status FROM games WHERE id = gameId)"
//                . "OR 3 = (SELECT status FROM games WHERE id = gameId)"
//                . "OR status IS NULL");
//    }
    //remove players without plays
    sql("DELETE FROM players WHERE 0 = (SELECT count(*) FROM plays WHERE userId = players.id)");

    //remove games
    sql("DELETE FROM games WHERE "
            //remove empty games
            . "(0 = (SELECT count(*) FROM plays WHERE gameId = games.id) AND lastConnection < (NOW() - INTERVAL 10 SECOND))"
            //remove 36h inactivity
            . "OR lastConnection < (NOW() - INTERVAL 36 HOUR)");

    return petition("SELECT id,name,status,night,time,dayTime,openVoting"
            . ", CASE WHEN password IS NOT NULL THEN 1 END AS password"
            . ", (SELECT name FROM players WHERE id = (SELECT userId FROM plays WHERE gameId = games.id AND admin = 1 LIMIT 1) ) AS admin"
            . ", (SELECT count(*) FROM plays WHERE gameId = id) AS players"
            . " FROM games");
}

// response utils
function nullFilter($var) { //NULL and none filter to responses
    return ($var !== NULL && $var !== FALSE && $var !== '');
}

function getRules($gameId) {
    $playerCount = petition("SELECT count(*) as count FROM plays WHERE gameId = $gameId")[0]->count;
    $cards = loadCards(); //all
    foreach ($cards as $cardName => &$card) { //important
        $min = 0;
        if (isset($card['min'])) {
            $min = $card['min'];
            if (is_callable($card['min'])) {
                $min = $card['min']($playerCount);
            }
        }
        $card['min'] = $min;

        $max = $card['max'];
        if (is_callable($card['max'])) {
            $max = $card['max']($playerCount);
        }
        if ($max < $min) {
            $max = $min;
        }
        $card['max'] = $max;

        unset($card['nightSelect']);
        unset($card['nightUnselect']);
        unset($card['extra']);
        unset($card['statusGameChange']);
    }
    return $cards;
}
