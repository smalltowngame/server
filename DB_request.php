<?php

//USER REQUESTS

function addUser($obj) { //insert user to game
    $gameId = $obj->id;
    $userId = $obj->userId;
    $userName = $obj->userName;

    //prevent sql injection on gameId
    $values = array('gameId' => $gameId);
    if (petition("SELECT count(*) as count FROM games WHERE id = :gameId", $values)[0]->count == 0) {
        echo "DB_request error gameId = $gameId.";
        return;
    }

    if (!$userId) {
        if (isset($_SESSION['userId'])) {
            $userId = $_SESSION['userId'];
        }
    }
    if (!$userName) {
        if (isset($_SESSION['userName'])) {
            $userName = $_SESSION['userName'];
        } else if (isset($_COOKIE['smalltown_userName'])) {
            $userName = $_COOKIE['smalltown_userName'];
        }
    }

    //add user
    if (null == $userId) {
        $userId = getRandomUserId();
    }
    $values = array('userName' => $userName, 'userId' => $userId);
    sql("INSERT IGNORE INTO players (id, name) VALUES (:userId, :userName)", $values);

    $_SESSION['userId'] = $userId;
    $_SESSION['userName'] = $userName;
    setcookie("smalltown_userName", $userName, time() + 864000); //10 days
    //
    //admin check
    $admin = null;
    if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1'))) {
        $admin = 1;
    } else if (strpos($_SERVER['REMOTE_ADDR'], '192.168.') !== false) {
        $admin = 0;
    }

    $values = array('userId' => $userId, 'gameId' => $gameId);

    $sql = "INSERT INTO plays (userId, gameId, admin) SELECT :userId, :gameId,";
    if (null == $admin) {
        $sql = "$sql CASE WHEN (SELECT count(*) FROM plays WHERE admin = 1 AND gameId = :gameId) = 0 THEN 1 ELSE 0 END";
    } else {
        $sql = "$sql $admin";
    }
    $sql = "$sql FROM DUAL" //from nothing  (only 1 time)
            . " WHERE (SELECT count(*) FROM plays WHERE userId = :userId AND gameId = :gameId) = 0";

    $sth = sql($sql, $values);

    //UPDATE    
    updateUsers($gameId, $userId);
    if ($sth->rowCount() == 0) { //nothing changes
        updatePlayers($gameId, $userId);
    } else {
        updatePlayers($gameId); //way to update new players to others
    }
    updateRules($gameId, $userId); //THIS position admin / playing cards
    updateGame($gameId, $userId);
}

function setName($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    $userName = $obj->name;
    $values = array('name' => $userName);

    //duplicated names works on js, isn't a real security issue
    sql("UPDATE players SET name = :name WHERE id = '$userId'", $values);

    $_SESSION['userName'] = $userName;
    updatePlayers($gameId, null, "name"); //way to update new players to other people
    //
    //rewrite header to name game
    if ("127.0.0.1" == $_SERVER['REMOTE_ADDR']) {
        $file = file("index.php");
        $newLines = array();
        foreach ($file as $line)
            if (preg_match("/^(header\(\'name)/", $line) === 0) {
                $newLines[] = chop($line);
            } else {
                $newLines[] = chop("header('name:$userName');");
            }
        $newFile = implode("\n", $newLines);
        file_put_contents("index.php", $newFile);
    }
}

function chat($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    $text = "$userId~$obj->text";
    $res = array(
        'type' => "chat",
        'userId' => $userId,
        'text' => $text
    );

    $plays = petition("SELECT userId FROM plays WHERE gameId = $gameId AND userId <> $userId");
    for ($i = 0; $i < count($plays); $i++) {
        send_response(json_encode($res), 
        $gameId, 
        $plays[$i]->userId);
    }

    $values = array(
        'chat' => $text
    );
    sql("UPDATE games SET chat = CONCAT(chat , '·', :chat) WHERE id = $gameId", $values);
}

////////////////////////////////////////////////////////////////////////////////
//AUTO GAME REQUESTS
//on error request
function getAll($obj) {
    $gameId = $obj->gameId;
    $userId = $obj->userId;
    updateAll($gameId, $userId);
}

function checkPassword($obj) {
    $values = array('gameId' => $obj->gameId, 'password' => $obj->password);
    echo petition("SELECT count(*) as count FROM games WHERE id = :gameId AND password = :password", $values)[0]->count;
}

function setMessage($obj) {
    saveMessage($obj->message, $obj->gameId, $obj->id);
}

//function suicide($obj) {
//    $gameId = $obj->gameId;
//    $userId = $obj->userId;
//    killPlayer($gameId, $userId);
//    $name = petition("SELECT name FROM players WHERE id = '$userId'")[0]->name;
//    if (isset($obj->message)) {
//        $str = $obj->message;
//    } else {
//        $str = "message.suicide('$name')";
//    }
//    $res = array(
//        'type' => "chat",
//        'text' => $str
//    );
//    updatePlayers($gameId);
//    send_response(json_encode($res), $gameId);
//}
//
//
// OUT OF GAME SOCKET
function createGame($obj = null) {

    $cards = array(
        "werewolf_classic_werewolf" => 0,
        "werewolf_classic_seer" => 0,
        "werewolf_classic_witch" => 0,
        "werewolf_classic_hunter" => 0,
        "werewolf_classic_cupid" => 0
    );
    $values = array(
        'cards' => json_encode($cards),
        'name' => ""
    );
    if (null != $obj) {
        $values['name'] = $obj->name;
    }

    //check
    $sth = sql('INSERT IGNORE INTO games (name, cards) VALUES (:name, :cards)', $values);
    global $pdo;
    $id = $pdo->lastInsertId();
    if ($sth->rowCount() == 0) { //nothing changes
        echo "game name already exists";
        return false;
    }

    //remove unstarted games where admin create this other game
    if (isset($_SESSION['userId'])) {
        $userId = $_SESSION['userName'];
        $value = array(
            'name' => $values['name']
        );
        sql("DELETE FROM games WHERE 0 < "
                . "(SELECT count(*) FROM plays WHERE 1 = "
                . "(SELECT admin FROM plays WHERE plays.gameId = games.id LIMIT 0,1)) "
                . "AND (games.status <> 1 AND games.status <> 2 AND games.name <> :name)", $value);
    }

    //return
    echo $id; //echo return!
    return $id;
}
