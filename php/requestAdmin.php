<?php

//functions only for admin
// GAME ENGINE
function startGame($obj) {
    $gameId = $obj->gameId;

    //add villagers bots
    $countPlayers = petition("SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId")[0]->count;
    if (4 > $countPlayers) {
        saveMessage("There's not suficient players in smltown_game, some bots have been added.", $gameId);
        $sql = "INSERT INTO smltown_plays (gameId, userId, status, card, admin) VALUES";
        $minPlayers = 4;
        for ($i = $countPlayers; $i < $minPlayers; $i++) {
            $userId = getRandomUserId();
            $sql = "$sql ($gameId, $userId, 1, 'villager', -1)";
            if ($i + 1 < $minPlayers) {
                $sql = "$sql,";
            }
        }
        sql($sql);
    }

    //start normal game with night
    setGameStatus($gameId, 2);
    nextNightTurn($gameId, -100);
}

function restartGame($obj) {
    $gameId = $obj->gameId;

    //clean
    sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND admin < 0");
    sql("UPDATE smltown_plays SET status = 1, sel = null, rulesJS = '', rulesPHP = '', reply = '', message = null WHERE gameId = $gameId");
    sql("UPDATE smltown_games SET status = 0, night = null, timeStart = null, time = null WHERE id =  $gameId");

    $players = petition("SELECT * FROM smltown_plays WHERE admin > -1 AND gameId = $gameId");

    $cards = loadCards($gameId);
    $playerCount = count($players);

    $quantityCards = getCards($cards, $playerCount);

    $minCards = $quantityCards[0];
    $maxCards = $quantityCards[1];

    $playerKeys = range(0, $playerCount - 1);
    shuffle($playerKeys);

    //set min cards
    for ($i = 0; $i < count($minCards); $i++) {
        if (!isset($playerKeys[$i])) {
            echo "error: more cards than players";
            break;
        }
        $players[$playerKeys[$i]]->card = $minCards[$i];
    }
//    $maxCardKeys = range(0, count($maxCards) - 1);
    $maxCardKeys = range(0, count($minCards) - 1);
    shuffle($maxCardKeys);

    $n = count($minCards);
//    //set max cards
    //set min cards
    for ($i = 0; $i < count($maxCardKeys); $i++) { //by CARDS!
        if (rand(0, 1) == 1) {
            if (count($playerKeys) - $n < 1) {
                break;
            }
            $card = $maxCardKeys[$i];
            $playerId = $playerKeys[$n];
//            $players[$playerId]->card = $maxCards[$card];
            $players[$playerId]->card = $minCards[$card];
            $n++;
        }
    }

    $playersLeft = count($playerKeys) - $n;
    for ($i = 0; $i < $playersLeft; $i++) {
        $playerId = $playerKeys[$n++];
        $players[$playerId]->card = "_villager";
    }

    //prepare "sqlUpdateCol" array
    $cardArray = array();
    for ($i = 0; $i < $playerCount; $i++) {
        $id = $players[$i]->userId;
        $cardArray[$id] = $players[$i]->card;
    }

    //save user cards on DB
    $sql1 = $sql2 = "";
    foreach ($cardArray as $id => $value) {
        $sql1 = "$sql1 WHEN '$id' THEN '$value'";
        $sql2 = "$sql2 '$id'";
        end($cardArray); //http://stackoverflow.com/questions/1070244/how-to-determine-the-first-and-last-iteration-in-a-foreach-loop
        if ($id !== key($cardArray)) {
            $sql2 = "$sql2,";
        }
    }
    sql("UPDATE smltown_plays SET card = CASE userId $sql1 END WHERE userId IN ($sql2)");

    updateUsers($gameId, null, "card");
    updatePlayers($gameId, null, array("status", "sel"));
    updateGame($gameId, null, "status");
}

function endTurn($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    sql("UPDATE smltown_games SET time = 0 WHERE id = $gameId"
            . " AND (SELECT admin FROM smltown_plays WHERE gameId = $gameId AND userId = $userId) = 1");
    updateGame($gameId, null, "time");
}

////////////////////////////////////////////////////////////////////////////////
// SET MENU OPTIONS GAME

function setDayTime($obj) {
    $gameId = $obj->gameId;
    $values = array('dayTime' => $obj->time);
    sql("UPDATE smltown_games SET dayTime = :dayTime WHERE id = $gameId", $values);
    updateGame($gameId, null, "dayTime");
    setFlash($gameId, "updated day time");
}

function setOpenVoting($obj) {
    $gameId = $obj->gameId;
    $openVotations = $obj->value;
    $values = array('openVoting' => $openVotations);
    sql("UPDATE smltown_games SET openVoting = :openVoting WHERE id = $gameId", $values);
    updateGame($gameId, null, "openVoting");
    if ($openVotations == 1) {
        setFlash($gameId, "open voting mode enabled");
    } else {
        setFlash($gameId, "open voting votes mode disabled");
    }
}

function setEndTurnRule($obj) {
    $gameId = $obj->gameId;
    $endTurn = $obj->value;
    $values = array('endTurn' => $endTurn);
    sql("UPDATE smltown_games SET endTurn = :endTurn WHERE id = $gameId", $values);
    updateGame($gameId, null, "endTurn");
    if ($endTurn == 1) {
        setFlash($gameId, "admin can end day turn");
    } else {
        setFlash($gameId, "admin can not end day turn");
    }
}

function setPassword($obj) {
    $gameId = $obj->gameId;
    if (1 == $gameId) {
        echo "You can't set password on main server game for security reasons";
        return;
    }
    $password = $obj->password;
    $values = array('password' => $password);
    sql("UPDATE smltown_games SET password = :password WHERE id = $gameId", $values);
    updateGame($gameId, null, "password");
    if (empty($password)) {
        setFlash($gameId, "password game was removed");
    } else {
        setFlash($gameId, "updated password game");
    }
}

function saveCards($obj) {
    $gameId = $obj->gameId;
    $cards = $obj->cards;
    $values = array(
        'cards' => $cards
    );
    sql("UPDATE smltown_games SET cards = :cards WHERE id = $gameId", $values);
    updateGame($gameId, null, "cards");
}

////////////////////////////////////////////////////////////////////////////////
//OTHER ACTIONS

function deletePlayer($obj) { //at specific game
    $gameId = $obj->gameId;
    $values = array(
        'id' => $obj->id
    );
    sql("UPDATE smltown_plays SET card = null WHERE gameId = $gameId", $values); //prevent important card removes from game
    updateUsers($gameId, null, "card");
    sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND userId = :id", $values);
    updatePlayers($gameId, null, "userId");
}
