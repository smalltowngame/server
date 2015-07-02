<?php

// DAY ACTIONS

function startDay($gameId) {
    if (checkGameOver($gameId)) { //first (status = 3)
        die();
    }

    if (playersAlive($gameId) == 2) {
        //night = null: becomes night on message received
        killDying($gameId);
        sql("UPDATE smltown_games SET status = 1, night = null WHERE id = $gameId");
        updateGame($gameId, null, "status");

        $message = "Only 2 players are alive. No kill could happen at day";
        saveMessage($message, $gameId); //alive users       
        setNotifications($gameId, $message, array('status' => -1)); //dead users
        die();
    }

    $now = round(microtime(true));
    $time = getDiscusTime($gameId, $now); //seconds
    sql("UPDATE smltown_games SET night = null, timeStart = $now, time = $time WHERE id = $gameId");
    updateGame($gameId, null, array("timeStart", "time")); //updates game
    //before playersAlive to request well 2 players alive to all!
    setGameStatus($gameId, 1);
}

function openVotingEnd($obj) { //only as openVoting admin option, or openVoting on finish
    $gameId = $obj->gameId;

    //if !open Voting
    $count = petition("SELECT count(*) as count FROM smltown_games WHERE "
                    . "id = $gameId AND openVoting = 1 "
                    . "AND (SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId AND message > '') = 0 "
                    . "AND time < " . microtime(true))[0]->count;
    if (1 == $count) {
        townVotations($obj);
    }
}

function townVotations($obj) { //day end
    $gameId = $obj->gameId;

    $sth = sql("UPDATE smltown_games SET timeStart = null, time = null WHERE id = $gameId "
            . " AND (time < " . microtime(true)
            //or endTurn is enabled
            . " OR (endTurn = 1 AND (SELECT admin FROM smltown_plays WHERE gameId = $gameId AND userId = '$obj->userId')))");
    if ($sth->rowCount() == 0) {
        return; //prevent multiple dayEnd requests
    }

    $players = petition("SELECT sel FROM smltown_plays WHERE gameId = $gameId AND status > 0");
    $deadId = votations($players);

    if ($deadId != null) {
        $gameIsOver = hurtPlayer($gameId, $deadId);
        if ($gameIsOver) {
            return;
        }
    }
        
    $message = "votations:$deadId";
    
    saveMessage($message, $gameId);
    setNotifications($gameId, $message, array('status' => -1)); //killed players
}

////////////////////////////////////////////////////////////////////////////////
// NIGHT ACTIONS
function endNightTurn($obj, $initiative = null) { //here requests also statuschange player cards!
    $gameId = $obj->gameId;
    $outstandMessages = petition("SELECT count(*) as count FROM smltown_plays WHERE message <> '' AND gameId = $gameId")[0]->count;
    if ($outstandMessages > 0) { //wait for messages
        return false;
    }
    if (!$initiative) {
//        $cards = loadCards($gameId); //slower first?
        //if comes from statuschange card action 

        $nightTurn = petition("SELECT night FROM smltown_games WHERE id = $gameId")[0]->night;
        if (!$nightTurn) {
            setGameStatus($gameId, 2); //night
            $initiative = -1;
        } else {
            $cards = loadCards($gameId);
            if (!isset($cards[$nightTurn]['initiative'])) { //if last turn was a statuschange action
                startDay($gameId);
            }
            $initiative = $cards[$nightTurn]['initiative'];
        }
    }
    nextNightTurn($gameId, $initiative);
}

function nextNightTurn($gameId, $initiative) { //numeric $initiative
    $play = getNextNightTurn($gameId, $initiative);

    if ($play) { //if found night turn
        sql("UPDATE smltown_games SET night = '$play->card' WHERE id = $gameId");

        //saveMessage($gameId, $play->userId, "Is your turn (from server)");
        //
        //updates
        updateGame($gameId, $play->userId, array("status", "night"));
        //end night
    } else {
        if ($initiative < 0) { //prevent dayEnd bucles if no night cards error
            setGameStatus($gameId, 0);
            echo "error: no night cards?";
            die();
        }
        startDay($gameId);
    }
}

function getNextNightTurn($gameId, $turn) {
    $cards = loadCards($gameId); //slow first 
    //alive only
    $plays = petition("SELECT userId, card FROM smltown_plays WHERE gameId = $gameId AND status > -1");

    $lowestInitiative = 100;
    $next = null;
    for ($i = 0; $i < count($plays); $i++) {
        $card = $plays[$i]->card;
        if (!isset($cards[$card]['initiative'])) {
            continue;
        }
        $initiative = $cards[$card]['initiative'];
        if ($initiative > $turn && $initiative < $lowestInitiative) {
            $lowestInitiative = $initiative;
            $next = $plays[$i];
        }
    }

    if (isset($next)) {
        return $next;
    }
    return false;
}

////////////////////////////////////////////////////////////////////////////////
//UTILS

function setGameStatus($gameId, $status, $updated = null) {
    if ($status > 0) { // 1, 2 or 3
        include_once "CardUtils.php";
        $cards = loadCards($gameId);
        $players = petition("SELECT userId, card FROM smltown_plays WHERE gameId = $gameId");

        //STATUS GAME CHANGE
        for ($i = 0; $i < count($players); $i++) {
            $player = $players[$i];
            $cardName = $player->card;
            if (!isset($cards[$cardName]) || !isset($cards[$cardName]['statusGameChange'])) {
                continue;
            }
            $card = $cards[$cardName];
            $obj = (object) array('gameId' => $gameId, 'userId' => $player->userId);
            $overrideStatus = $card['statusGameChange'](new CardUtils($obj));
            if (isset($overrideStatus)) {
                if (false == $overrideStatus) {
                    sql("UPDATE smltown_games SET night = '$cardName' WHERE id = $gameId");
                    //update night turn to this players make stop
                    $thisNightPlayers = petition("SELECT userId FROM smltown_plays WHERE card = '$cardName' AND gameId = $gameId");
                    for ($i = 0; $i < count($thisNightPlayers); $i++) {
                        $userId = $thisNightPlayers[$i]->userId;
                        updateGame($gameId, $userId, "night");
                    }
                    die(); //STOP!
                }
            }
        }
    }

    killDying($gameId);

    if (!$updated) {
        $sth = sql("UPDATE smltown_games SET status = $status WHERE status <> $status AND id = $gameId");
        if ($sth->rowCount() == 0) { //nothing changes
            return false;
        }
    }
    updateGame($gameId, null, "status");
    return true;
}

function killDying($gameId) {
    //kill dying players
    sql("UPDATE smltown_plays SET sel = null, "
            . "status = (CASE status WHEN 0 THEN -1 WHEN 2 THEN 1 ELSE status END)"
            . "WHERE gameId = $gameId");
    updatePlayers($gameId);
}

////////////////////////////////////////////////////////////////////////////////
//AUTOMATIC REQUESTS

function messageReceived($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;

    $sth = sql("UPDATE smltown_plays SET message = '' WHERE message <> '' AND userId = '$userId' AND gameId = $gameId");
    if ($sth->rowCount() == 0) {
        setError($gameId, "error: no message to recieve.");
        return; //any message to recibe, prevent posible hack
    }
    endNightTurn($obj);
}

function nightExtra($obj) {
    $card = getCard($obj);
//    getCard($obj, function($obj) {
        $gameId = $obj->gameId;
//        $card = $obj->card;
        $cards = loadCards($gameId);
        if (!isset($cards[$card]['extra'])) {
            return false;
        }

        include_once "CardUtils.php";
        $data = $cards[$card]['extra'](new CardUtils($obj));
//        if (!isset($data)) {
//            endNightTurn($obj);
//            return;
//        }
        if (isset($data)) {
            if (false == $data) {
                nextNightTurn($gameId, $cards[$card]['initiative']);
                return;
            }
            $userId = $obj->userId;
            send_response(json_encode(array('type' => 'extra', 'data' => $data)), $gameId, $userId);
        }
//    });
}

////////////////////////////////////////////////////////////////////////////////
//SELECTS

function selectPlayer($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    $values = array('selectedId' => $obj->id);
    sql("UPDATE smltown_plays SET sel = :selectedId WHERE gameId = $gameId AND userId = '$userId'", $values);
    selectPlayerResponse($obj);
}

function unSelectPlayer($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    sql("UPDATE smltown_plays SET sel = null WHERE gameId = $gameId AND userId = '$userId'");
    selectPlayerResponse($obj);
}

function selectPlayerResponse($obj) {
    $gameId = $obj->gameId;
    //players out of vote rules
    $openVoting = petition("SELECT smltown_games.openVoting FROM smltown_games, smltown_plays WHERE "
            //gameId
            . "smltown_games.id = $gameId AND smltown_plays.gameId = $gameId "
            //if some alive is not selecting
            . "AND smltown_plays.status > 0 AND smltown_plays.sel IS NULL AND smltown_plays.admin <> -1 "
            //if games.time is NOT over
            . "OR smltown_games.time > " . microtime(true));
    if (count($openVoting) == 0) { //day end
        townVotations($obj);
    } else { //only if case openVoting update
        if (1 == $openVoting[0]->openVoting) {
            updatePlayers($gameId, null, "sel");
        }
    }
}

function nightSelect($obj) {
    $card = getCard($obj);
//    getCard($obj, function($obj) {
        $gameId = $obj->gameId;
        $userId = $obj->userId;
//        $card = $obj->card;

        $cards = loadCards($gameId);
        include_once "CardUtils.php";        
        $data = $cards[$card]['nightSelect'](new CardUtils($obj));
        
        if ($data == false) { //not ended turn, update "sel"
            updatePlayers($gameId, $userId, "sel");
        } else if ($data) { //end turn			
            sql("UPDATE smltown_plays SET sel = NULL WHERE gameId = $gameId");
            if ($data === true) { // === not string!
                $ini = null;
                if (isset($cards[$card]['initiative'])) { // if "statuschange" card
                    $ini = $cards[$card]['initiative'];
                }
                endNightTurn($obj, $ini);
            } else { // end of turn with auto-message
                saveMessage($data, $gameId, $userId);
            }
        }
//    });
}

function nightUnselect($obj) {
    $card = getCard($obj);
//    getCard($obj, function($obj) {
        $gameId = $obj->gameId;
//        $card = $obj->card;
        include_once "CardUtils.php";
        $cards = loadCards($gameId);
        $data = $cards[$card]['nightUnselect'](new CardUtils($obj));
        if ($data) {
            send_response(json_encode(array('type' => 'night', 'data' => $data)), $gameId, $obj->userId);
        }
//    });
}
