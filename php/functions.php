<?php

//////////////////////////////////////////////////////////////////////////////////
//DB RQUESTS
//USER REQUESTS
function addUser($obj) {
    $userId = null;
    if (isset($obj->userId)) {
        $userId = $obj->userId;
    }
    $userName = "";
    if (isset($obj->name)) {
        $userName = $obj->name;
    }
    $lang = "en";
    if (isset($obj->lang)) {
        $lang = $obj->lang;
    }
    if (isset($obj->socialId)) {
        $socialId = $obj->socialId;
    }
    if (isset($obj->type)) {
        $type = $obj->type;
    }

    //add user
    $exists = false;

    if (null == $userId) {
        $userId = getRandomUserId();
    }
    $values = array('id' => $userId, 'name' => $userName, 'lang' => $lang);
    $sqlRows = "id, name, lang, socialId";
    $sqlValues = ":id, :name, :lang, :socialId";

    if (isset($socialId)) {
        //check socialId exists
        $value = array('socialId' => $socialId);
        $players = petition("SELECT id FROM smltown_players WHERE socialId = :socialId", $value);
        if (count($players) > 0) {
            $exists = true;
            $userId = $players[0]->id;
        }
    } else {
        $socialId = md5($userId);
    }
    $values['socialId'] = $socialId;

    if (isset($type)) {
        $values['type'] = $type;
        $sqlRows .= ",type";
        $sqlValues .= ",:type";
    }

    if (!$exists) {
        //echo json_encode($values);
        sql("INSERT INTO smltown_players ($sqlRows) VALUES ($sqlValues) "
                . "ON DUPLICATE KEY UPDATE name=VALUES(name), lang=VALUES(lang), "
                . "type=VALUES(type), socialId=VALUES(socialId)", $values);
    }

    //if not exists
    setcookie('smltown_userId', $userId);

    $players = petition("SELECT name, facebook, type, socialId, lang, websocket, friends FROM smltown_players WHERE id = '$userId'");
    if (count($players)) {
        $user = $players[0];

        if (isset($user->friends) && !empty($user->friends)) {
            $coincidences = petition("SELECT socialId, name, picture FROM smltown_players WHERE socialId "
                    . "IN (" . $user->friends . ")");
            $user->friends = json_encode($coincidences);
            //IF ERROR
            //sql("UPDATE smltown_players SET friends = '' WHERE id = '$userId'");
        }

        echo json_encode($user);
    } else {
        echo "user error";
    }
}

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

////////////////////////////////////////////////////////////////////////////////
// RESPONSE UTILS
function nullFilter($var) { //NULL and none filter to responses
    return ($var !== NULL && $var !== FALSE && $var !== '');
}

//public
function getGamesInfo($obj, $reload = false) { //all game selector page
    if (isset($obj->userId)) {
        $userId = $obj->userId;
    } else {
        echo "can't get games without user";
        return;
    }
    if (isset($obj->name)) {
        $name = $obj->name;
    }

    $start = 0;
    if (isset($obj->offset)) {
        $start = $obj->offset;
    }

    $values = array();
    $sql = "SELECT id, name, status, dayTime, openVoting, endTurn"
            . ", CASE WHEN password IS NOT NULL THEN 1 END AS password"
            . ", (SELECT name FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE gameId = smltown_games.id AND admin = 1 LIMIT 1)  LIMIT 1) AS admin"
            . ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AS players";

    $sql .= ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId') AS playing";
    $sql .= ", (SELECT message FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId' LIMIT 1) AS message";
    $sql .= ", (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id AND userId = '$userId' AND admin = 1) AS own";

    $sql .= " FROM smltown_games ";

    $where = false;
    if (!isset($name) || empty($name)) {
        //$sql .= " WHERE name like :name";
        //remove plays without game
        sql("DELETE FROM smltown_plays WHERE 0 = (SELECT count(*) FROM smltown_games WHERE id = smltown_plays.gameId)");

//        //remove players without plays
//        sql("DELETE FROM smltown_players WHERE 0 = (SELECT count(*) FROM smltown_plays WHERE userId = smltown_players.id)"
//                . " AND lastConnection < (NOW() - INTERVAL 1 HOUR)"
//                . " AND NULL = socialId");
        //remove games
//        sql("DELETE FROM smltown_games WHERE "
//                //default local game
//                . " 1 != id "
//                //public
//                . " AND public = 1"
//                //remove empty games
//                . " AND ( (0 = (SELECT count(*) FROM smltown_plays WHERE gameId = smltown_games.id) AND lastConnection < (NOW() - INTERVAL 10 SECOND))"
//                //remove 36h inactivity
//                . " OR lastConnection < (NOW() - INTERVAL 36 HOUR) )");
    } else {
        $values["name"] = $name;
        $sql .= " WHERE LOWER(name) like :name";
        $where = true;
    }

    //IF ARE PUBLIC GAMES
    require_once "config.php";
    global $publicGames;
    if (0 == $publicGames) {
        if ($where) {
            $sql .= " AND ";
        } else {
            $sql .= " WHERE ";
        }
        $values["userId"] = $userId;
        $sql .= " ((SELECT count(*) FROM smltown_plays WHERE userId = :userId AND gameId = smltown_games.id) > 0 OR 1 = public)";
    }

    $sql .= " ORDER BY playing DESC, message DESC, status LIMIT $start, 15";

    $games = petition($sql, $values);

    if (!$reload && (!isset($name) || empty($name)) && (0 == count($games) && "::1" == $_SERVER['REMOTE_ADDR'])) {
        sql("INSERT INTO smltown_games (id) VALUES (1)");
        getGamesInfo($obj, true);
    }

    echo json_encode($games);
}

function createGame($obj = null, $id = null) {

    $cards = array(
        "werewolf_classic_werewolf" => 0,
        "werewolf_classic_seer" => 0,
        "werewolf_classic_witch" => 0
    );

    $values = array(
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
        $res = petition("SELECT (SELECT id FROM smltown_games WHERE name = :name) as idGame,"
                . " (SELECT count(*) FROM smltown_plays WHERE gameId = idGame) as count", $values);
        $countGames = $res[0]->count;

        if ($countGames > 0) {
            echo -1;
            return;
        }

        if (isset($res[0]->idGame)) {
            $id = $res[0]->idGame;
            
        } else {
            $values['cards'] = json_encode($cards);
            sql('INSERT IGNORE INTO smltown_games (name, cards) VALUES (:name, :cards)', $values);

            global $pdo;
            $id = $pdo->lastInsertId();
        }
    } else {
        $values['cards'] = json_encode($cards);
        sql("INSERT INTO smltown_games (id, name, cards) VALUES ($id, :name, :cards)", $values);
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

function exitGame($obj) {
    $userId = $obj->user_id;
    $gameId = $obj->game_id;
    sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND userId = '$userId'");
}
