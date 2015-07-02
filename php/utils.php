<?php

//$cards = array(); //stored ???
//CARD WORKS

function loadCards($gameId = null) { //GAME ID FUTURE ERRORS
    $cards = array();

    if (isset($gameId)) { // if specific game
        $string = petition("SELECT cards FROM smltown_games WHERE id = $gameId")[0]->cards;

        //IF CARDS EMPTY OR CURRUPTED
        if (empty($string)) {
            echo "SMLTOWN.Message.flash('no cards selected')";
            die();
        }
        try {
            $playingCards = json_decode($string);
        } catch (Exception $e) {
            echo "selected game cards are corrupted, please change some card";
            die();
        }

        // GET CARDS NUMBER
        foreach ($playingCards as $filename => $number) {
            $card = getCardFile("cards/$filename.php");
            if (empty($card)) { //DB error;
                continue;
            }
            if ($number > 0) {
                $card['min'] = $number;
                $card['max'] = $number;
            }
            $cards[$filename] = $card;
        }
        return $cards;
    }

    foreach (glob("cards/*.php") as $filename) {
        $card = getCardFile($filename);
        $name = basename($filename, '.php');
        $cards[$name] = $card;
    }
    return $cards;
}

function getCardFile($filename) {
    global $card;
    $card = array();
    ob_start(); //prevent cards content return
    $echo = ob_get_contents(); //store all previous echo
    include $filename; //not once??
    ob_end_clean(); //stop prevent cards content return
    echo $echo; //acho all previous echo
    return $card;
}

function getCards($cards, $playerCount) {
    $minCards = array();
    $maxCards = array();

    foreach ($cards as $cardName => $card) { //important
        $min = 0;
        if (isset($card['min'])) {
            $min = $card['min'];
            if (is_callable($min)) {
                $min = $card['min']($playerCount);
            }
        }
        for ($i = 0; $i < $min; $i++) {
            array_push($minCards, $cardName);
        }

        $max = $card['max'];
        if (is_callable($max)) {
            $max = $card['max']($playerCount);
        }
        $rest = intval($max - $min);
        for ($i = 0; $i < $rest; $i++) {
            array_push($maxCards, $cardName);
        }
    }

    return array($minCards, $maxCards);
}

function getCard($obj, $callback) { //only night
    return petition("SELECT card FROM smltown_plays WHERE gameId = $obj->gameId AND userId = '$obj->userId'")[0]->card;
//    $obj->card = $card[0]->card;
//    $callback($obj);
}

//function getCardRules($gameId) {
//    $playerCards = petition("SELECT card FROM smltown_plays WHERE gameId = $gameId");
//    for ($i = 0; $i < count($playerCards); $i++) {
//        $card = $playerCards[$i]->card;
//    }
////    return $nightRules;
//}

//////////////////////////////////////////////////////////////////////////////////
//MESSAGES WORK
//flash
function setFlash($gameId, $message, $wheres = null) {
    $players = getPlayers($gameId, $wheres);
    for ($i = 0; $i < count($players); $i++) {
        $player = $players[$i]->userId;
        send_response(json_encode(array('type' => 'flash', 'data' => $message)), $gameId, $player);
    }
}

//notification
function setNotifications($gameId, $message, $wheres = null) {
    $players = getPlayers($gameId, $wheres);
    for ($i = 0; $i < count($players); $i++) {
        $player = $players[$i]->userId;
        send_response(json_encode(array('type' => 'notify', 'data' => $message)), $gameId, $player);
    }
}

function setError($gameId, $log){
    send_response(json_encode(array('type' => 'smltown_error(\'' . $log . '\')')), $gameId);
}

//static message (updates from ping)
function saveMessage($message, $gameId, $userId = null) {
    $values = array('message' => $message);
    $sql = "UPDATE smltown_plays SET message = :message WHERE gameId = $gameId AND status > -1 AND admin > -1 AND";
    if (null != $userId) {
        $sql .= " userId = '$userId'";
    } else {
        $sql .= " (";
        $players = petition("SELECT userId FROM smltown_plays WHERE gameId = $gameId");
        for ($i = 0; $i < count($players); $i++) {
            $playerId = $players[$i]->userId;
            $sql .= " userId = '$playerId'";
            if ($i < count($players) - 1) {
                $sql .= " OR";
            }
        }
        $sql .= ")";
    }
    sql($sql, $values);


    if (null != $userId) {
        updateUsers($gameId, $userId, "message");
    } else {
        updateUsers($gameId, null, "message");
    }
}

//////////////////////////////////////////////////////////////////////////////////
//DB RQUESTS

function getPlayers($gameId, $wheres) {
    $values = array();
    $sql = "SELECT userId FROM smltown_plays WHERE gameId = $gameId " . whereArray($wheres, $values);
    return petition($sql, $values);
}

function playersAlive($gameId, $onlyRealPlayers = false) {
    $sql = "SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId AND status > 0";
//    if ($onlyRealPlayers) {
//        $sql = "$sql AND admin > -1";
//    }
    return petition($sql)[0]->count;
}

function getRandomUserId() {
    $id = mt_rand();
    $count = petition("SELECT count(*) as count FROM smltown_players, smltown_plays WHERE smltown_players.id = '$id' OR smltown_plays.userId = '$id'")[0]->count;
    if ($count > 0) { //repeated id
        return getRandomUserId();
    }
    return $id;
}

function checkGameOver($gameId) {
    if (playersAlive($gameId) < 2) {
        sql("UPDATE smltown_games SET status = 3 WHERE id = $gameId");
        sql("UPDATE smltown_plays SET status = -1 WHERE gameId = $gameId AND status < 1");
        updatePlayers($gameId, null, array("status", "card", "sel"));
        updateGame($gameId, null, "status");
        return true;
    }
    return false;
}

function getDiscusTime($gameId, $now) {
    $dayTime = petition("SELECT dayTime FROM smltown_games WHERE id = $gameId")[0]->dayTime;
    if (!$dayTime) {
        $dayTime = 60;
    }
    $onlyRealPlayers = true;
    $total = playersAlive($gameId, $onlyRealPlayers);
    $playersCount = intval($total);
    return $now + $playersCount * $dayTime; //players * dayTime
}

//////////////////////////////////////////////////////////////////////////////////
//GAME INTERACTION

function hurtPlayer($gameId, $userId) {
    sql("UPDATE smltown_plays SET status = 0 WHERE status < 2 AND gameId = $gameId AND userId = '$userId'");
}

function killPlayer($gameId, $userId) {
    sql("UPDATE smltown_plays SET status = -1, rulesJS = null WHERE gameId = $gameId AND userId = '$userId'");
    updateUsers($gameId, $userId, "rules"); // necessary?
    return checkGameOver($gameId);
}

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

function selectArray($select) { //for responses and cadUtils
    $sql = "";
    if (is_array($select)) {
        for ($i = 0; $i < count($select); $i++) {
            $sql = "$sql $select[$i]";
            if (count($select) > $i + 1) {
                $sql = "$sql,";
            }
        }
    } else {
        $sql = "$sql $select";
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

function checkGameErrors($gameId) {
    //night stuck
    $count = petition("SELECT count(*) as count FROM smltown_games "
                    . "WHERE status = 2 AND night IS NULL "
                    . "AND (SELECT count(*) as count FROM smltown_plays WHERE message > '') = 0 "
                    . "AND id = $gameId")[0]->count;
    if (1 == $count) {
        setError($gameId, "error: night turn was lost");
    }

    //bots error
    $sth = sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND userId = '' and admin > -1");
    if ($sth->rowCount() > 0) {
        setError($gameId, "warn: fixed bot error");
        
    }
}
