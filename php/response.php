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
        $players = petition("SELECT userId as id FROM smltown_plays WHERE gameId = $gameId"); //get all players
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
        $sql = "$sql userId, admin, card, rulesJS, message";
    }
    return petition("$sql FROM smltown_plays WHERE gameId = $gameId AND userId = '$userId'")[0];
}

function getInfoPlayers($gameId, $select = null, $userId = null) {
    $sql = "SELECT DISTINCT";
    if ($select) { //array values function
        $sql = "$sql userId as id, " . selectArray($select);
        //
        //full request
    } else {
        $sql = "$sql smltown_plays.userId as id, smltown_plays.admin"
                //plays.sel when openVoting
                . ", CASE WHEN 1 = (SELECT openVoting FROM smltown_games WHERE id = $gameId) THEN smltown_plays.sel END AS sel"
                //name from players.name
                . ", CASE WHEN smltown_players.id = smltown_plays.userId THEN smltown_players.name ELSE '' END AS name"
                //status 1 when is 0
                . ", CASE WHEN smltown_plays.status > -1 THEN 1 ELSE smltown_plays.status END AS status"
                //card if dead or end game
                . ", CASE WHEN smltown_plays.status = -1 OR (SELECT status FROM smltown_games WHERE id = $gameId) = 3 ";
        if (null != $userId && !is_array($userId)) { //same user cards
            //card if is night and same player
            $sql = "$sql OR smltown_plays.card = (SELECT card FROM smltown_plays WHERE status = 2 AND userId = '$userId' AND gameId = $gameId)";
        }
        $sql = "$sql THEN card ELSE NULL END AS card";
    }
    $sql = "$sql FROM smltown_plays, smltown_players WHERE (smltown_plays.gameId = $gameId AND smltown_players.id = smltown_plays.userId) "
            //or from bots
            . "OR (smltown_plays.gameId = $gameId AND smltown_plays.admin < 0)";
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
        $sql = "$sql id,name,password,status,timeStart,time,dayTime,openVoting,endTurn,cards";
        if ($userId) {
            $sql = "$sql ,"
                    . " CASE WHEN (SELECT card FROM smltown_plays WHERE userId = '$userId' AND gameId = $gameId) = night"
                    . " OR status = 1 AND"
                    . " (SELECT count(*) FROM smltown_plays WHERE message IS NOT NULL) = 0"
                    . "	THEN night END AS night";
        }
    }

    $games = petition("$sql FROM smltown_games WHERE id = $gameId");

    if (count($games) > 0) { //exists
        $game = $games[0];
        if (isset($game->time) && !empty($game->time)) { //let 0 time
            $game->time -= microtime(true); //unify time users
        }
//        if (isset($game->timeStart)) {
//            $game->timeStart -= microtime(true); //unify time users
//        }
        return (object) array_filter((array) $game, "nullFilter"); //remove nulls but not 0
    }
    return false;
}

function getGamesInfo($obj = null) { //all game selector page
    $values = array();
    $sql = "SELECT id,name,status,dayTime,openVoting"
            . ", CASE WHEN password IS NOT NULL THEN 1 END AS password"
            . ", (SELECT name FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE gameId = smltown_games.id AND admin = 1 LIMIT 1) ) AS admin"
            . ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AS players";

    if (isset($obj) && isset($obj->userId)) { //is playing game
        $sql .= ", (SELECT count(*) FROM smltown_plays WHERE userId = '$obj->userId' AND gameId = smltown_games.id) AS playing";
    }

    $sql .= " FROM smltown_games";
    if (!isset($obj) || !isset($obj->name) || empty($obj->name)) {

        //remove plays without game
        sql("DELETE FROM smltown_plays WHERE 0 = (SELECT count(*) FROM smltown_games WHERE id = smltown_plays.gameId)");

//    if (isset($_SESSION['userId'])) {
//        $userId = $_SESSION['userId'];
//        //remove plays user out of game
//        sql("DELETE FROM plays WHERE userId = '$userId' AND "
//                . "0 = (SELECT status FROM games WHERE id = gameId)"
//                . "OR 3 = (SELECT status FROM games WHERE id = gameId)"
//                . "OR status IS NULL");
//    }
        //remove players without plays
        sql("DELETE FROM smltown_players WHERE 0 = (SELECT count(*) FROM smltown_plays WHERE userId = smltown_players.id)");

        //remove games
        sql("DELETE FROM smltown_games WHERE "
                //remove empty games
                . "(0 = (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AND lastConnection < (NOW() - INTERVAL 10 SECOND))"
                //remove 36h inactivity
                . "OR lastConnection < (NOW() - INTERVAL 36 HOUR)");
    } else {
        $values["name"] = $obj->name;
        $sql .= " WHERE name like :name";
    }
    $games = json_encode(petition($sql, $values));

    if (isset($obj)) {
        echo $games;
    } else {
        return $games;
    }
}

// response utils
function nullFilter($var) { //NULL and none filter to responses
    return ($var !== NULL && $var !== FALSE && $var !== '');
}

function getRules($gameId) {
    $playerCount = petition("SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId")[0]->count;
    $cards = loadCards(); //all
    $returnCards = array();
    foreach ($cards as $cardName => $card) { //important
        $returnCard = array();
                
        //min
        $min = 0;
        if (isset($card['min'])) {
            $min = $card['min'];
            if (is_callable($card['min'])) {
                $min = $card['min']($playerCount);
            }
        }
        $returnCard['min'] = $min;

        //max
        $max = $card['max'];
        if (is_callable($card['max'])) {
            $max = $card['max']($playerCount);
        }
        if ($max < $min) {
            $max = $min;
        }
        $returnCard['max'] = $max;
        
        //texts
        $lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
        $text = $card['text'];
        if(isset($text[$lang])){
            $trans = $text[$lang];
        }else{
            $key = key($text);
            $trans = $text[$key];
        }
        $returnCard['name'] = $trans['name'];
        $returnCard['rules'] = $trans['rules'];
        
        $returnCards[$cardName] = $returnCard;
    }
    return $returnCards;
}
