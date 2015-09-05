<?php

//////////////////////////////////////////////////////////////////////////////////
//DB RQUESTS

function getRandomUserId() {
    $id = mt_rand();
    $count = petition("SELECT count(*) as count FROM smltown_players, smltown_plays WHERE smltown_players.id = '$id' OR smltown_plays.userId = '$id'")[0]->count;
    if ($count > 0) { //repeated id
        return getRandomUserId();
    }
    return $id;
}

//////////////////////////////////////////////////////////////////////////////////
//GAME INTERACTION

function votations($players) {
    $array = array();
    for ($i = 0; $i < count($players); $i++) {
        $sel = $players[$i]->sel;
        if (null == $sel) {
            continue;
        }
        if (isset($array[$sel])) {
            $array[$sel] = $array[$sel] + 1;
        } else {
            $array[$sel] = 1;
        }
    }

    //get max votes player
    $deadId = null;
    $maxVotes = 0;
    foreach ($array as $sel => $votes) {
        if ($votes == $maxVotes) { //draw
            $deadId = null;
        } else if ($votes > $maxVotes) {
            $maxVotes = $votes;
            $deadId = $sel;
        }
    }
    return $deadId;
}

//////////////////////////////////////////////////////////////////////////////////
//DB REQUESTS UTILS

function is_assoc(array $array) {
    return (bool) count(array_filter(array_keys($array), 'is_string'));
}

function selectArray($select) { //for responses and cardUtils
    $sql = "";
    if (is_array($select)) {
        if (is_assoc($select)) {
            foreach ($select as $key => $value) {
                $sql .= " CASE WHEN $key = '$value' THEN '$value' END AS $key ";
                if (end($select) !== $value) {
                    $sql .= ",";
                }
            }
        } else {
            for ($i = 0; $i < count($select); $i++) {
                $sql .= " $select[$i]";
                if (count($select) > $i + 1) {
                    $sql .= ",";
                }
            }
        }
    } else {
        $sql .= " $select";
    }
    return $sql;
}

function whereArray($array, &$values) { //for responses and cadUtils
    $sql = "";
    if (!is_array($array)) {
        return "$sql $array";
    }
    foreach ($array as $name => $value) {
        $sql = "$sql AND $name = :$name";
        $values[$name] = $value;
    }
    return $sql;
}

//function setCookieValue($key, $value) {
//    setcookie($key, $value, time() + 864000, "/"); //10 days
//}
//
////////////////////////////////////////////////////////////////////////////////
// RESPONSE UTILS
function nullFilter($var) { //NULL and none filter to responses
    return ($var !== NULL && $var !== FALSE && $var !== '');
}

//public
function getGamesInfo($obj) { //all game selector page
    if (isset($obj->userId)) {
        $userId = $obj->userId;
    }
    if (isset($obj->name)) {
        $name = $obj->name;
    }

    $start = 0;
    if (isset($obj->offset)) {
        $start = $obj->offset;
//        if("0" != $start){
//            echo $start;
//        }
    }

    $values = array();
    $sql = "SELECT id, name, status, dayTime, openVoting, endTurn"
            . ", CASE WHEN password IS NOT NULL THEN 1 END AS password"
            . ", (SELECT name FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE gameId = smltown_games.id AND admin = 1 LIMIT 1) ) AS admin"
            . ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AS players";

    if (isset($userId)) { //if is playing game
        $sql .= ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId') AS playing";
        $sql .= ", (SELECT message FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId') AS message";
        $sql .= ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId' AND admin = 1) AS own";
    } else {
        $sql .= ", '0' AS playing";
        $sql .= ", '' AS message";
    }

    $sql .= " FROM smltown_games ";

    if (!isset($name) || empty($name)) {
        //$sql .= " WHERE name like :name";
        //remove plays without game
        sql("DELETE FROM smltown_plays WHERE 0 = (SELECT count(*) FROM smltown_games WHERE id = smltown_plays.gameId)");

        //remove players without plays
        sql("DELETE FROM smltown_players WHERE 0 = (SELECT count(*) FROM smltown_plays WHERE userId = smltown_players.id) AND lastConnection < (NOW() - INTERVAL 1 HOUR)");

        //remove games
        sql("DELETE FROM smltown_games WHERE "
                //remove empty games
                . "(0 = (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AND lastConnection < (NOW() - INTERVAL 10 SECOND))"
                //remove 36h inactivity
                . "OR lastConnection < (NOW() - INTERVAL 36 HOUR)");
    } else {
        $values["name"] = $name;
        $sql .= " WHERE LOWER(name) like :name";
    }
    $sql .= " ORDER BY playing DESC, message DESC, status LIMIT $start, 15";
    $games = json_encode(petition($sql, $values));

    echo $games;
}

function createGame($obj = null, $id = null) {

    $cards = array(
        "werewolf_classic_werewolf" => 0,
        "werewolf_classic_seer" => 0,
        "werewolf_classic_witch" => 0
    );

    //echo "; cards = " . json_encode($cards) . "; ";
    $values = array(
        'cards' => json_encode($cards),
        'name' => ""
    );
    if (null != $obj) {
        $values['name'] = $obj->name;
    }

//    //remove unstarted games where admin create this other game
//    if (isset($_SESSION['playId'])) {
//        $value = array(
//            'name' => $values['name']
//        );
////        sql("DELETE FROM smltown_games WHERE 0 < "
////                . "(SELECT count(*) FROM smltown_plays WHERE 1 = "
////                . "(SELECT admin FROM smltown_plays WHERE smltown_plays.gameId = smltown_games.id LIMIT 0,1)) "
////                . "AND (smltown_games.status <> 1 AND smltown_games.status <> 2 AND smltown_games.name <> :name)", $value);
//    }
    //check
    if (!isset($id)) {
        $sth = sql('INSERT IGNORE INTO smltown_games (name, cards) VALUES (:name, :cards)', $values);
        global $pdo;
        $id = $pdo->lastInsertId();
        if ($sth->rowCount() == 0) { //nothing changes
            return false;
        }
    } else {
        sql('INSERT INTO smltown_games (id, name, cards) VALUES (1, :name, :cards)', $values);
    }

    //return
    echo $id; //echo return!
    return $id;
}

function removeGame($obj) {
    $userId = $obj->userId;
    $gameId = $obj->id;
    $sth = sql("DELETE FROM smltown_games WHERE id = $gameId AND "
            . "(SELECT count(*) FROM smltown_plays WHERE admin = 1 AND userId = '$userId') > 0");
    if ($sth->rowCount() > 0) { //nothing changes
        sql("DELETE FROM smltown_plays WHERE gameId = $gameId");
    }
}
