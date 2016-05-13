<?php

$GLOBALS['ROOT'] = dirname(__FILE__);

// prevent the server from timing out
set_time_limit(0);
$users = array();

require_once('websocket/websockets.php');

include_once 'php/requestAdmin.php';
include_once 'php/PingRequest.php';
include_once 'smltown_functions.php';

class echoServer extends WebSocketServer {

    //protected $maxBufferSize = 1048576; //1MB... overkill for an echo server, but potentially plausible for other applications.

    protected function process($user, $message) {
        echo "data received: \n";
        data_received($user, $message);
    }

    protected function connected($user) {
        global $users;
        echo "connected: \n";
        //$this->send($user, "websocket connected");

        $user->val = (object) array();

        //read cookies
        if (isset($user->headers['cookie'])) {

            $cookiesParts = explode('; ', $user->headers['cookie']);
            foreach ($cookiesParts as $cookieParts) {
                $interimCookie = explode('=', $cookieParts);
                $cookies[$interimCookie[0]] = urldecode($interimCookie[1]);
            }

            //recover lost socket with userId
            if (isset($cookies["smltown_userId"])) {

                $userId = $cookies["smltown_userId"];

                if (isset($users[$userId])) { //recover!                    
                    echo "recover oldest user socket; ";
                    $u = $users[$userId];
                    $user->val = $u->val; //copy stored values
//                    echo "disconnect id: $user->userId; ";
//                    $this->disconnect($u->socket); //disconnect old
                }

                //$user->userId = $userId; //important
                //$users[$userId] = $user;

                sql("UPDATE smltown_players SET websocket = 1 WHERE id = '$userId'");
                $user->userId = $userId;

                echo "stored userId: $userId \n";
                $users[$userId] = $user;

                //TODO: get reply (maybe in smltown_player?)
                //$this->send($user, $json);
            } else {
                //echo '!isset($cookies["smltown_userId"])';
            }
        } else {
            //echo '!isset($user->headers["cookie"])';
        }
    }

    protected function closed($user) {
        //this will close on every web refresh

        global $users;
        if (isset($user->userId)) {
            $userId = $user->userId;
            unset($users[$userId]);
//            sql("UPDATE smltown_players SET websocket = 0 WHERE id = '$userId'");
        }
    }

    //method to do protected functions PUBLIC
    public function public_send($user, $json) {
        $this->send($user, $json);
    }

}

$echo = new echoServer("0.0.0.0", "9000");

try {
    $echo->run();
} catch (Exception $e) {
    $echo->stdout($e->getMessage());
}

////////////////////////////////////////////////////////////////////////////////

function data_received($user, $message) {
    //echo $message;
    $obj = json_decode($message);

    if (!is_object($obj) || !$obj->action) {
        echo "error request data. isset:" . isset($obj) . ", is_object:" . is_object($obj);
        return;
    }

    $action = $obj->action;

    //get socket stored userId if exists
    if (isset($user->userId)) {
        $obj->userId = $user->userId;
        echo "socket userId: $user->userId; ";
    } else {
        echo "not userId on $action action; ";
    }

    //check playId and store
    if (isset($obj->playId)) {
        $playId = $obj->playId;
        if (!isset($user->val->$playId) && isset($obj->userId)) {//validate this user is this playId
            $count = petition("SELECT count(*) as count FROM smltown_plays WHERE userId = '$obj->userId' AND id = $obj->playId")[0]->count;
            if ($count > 0) {
                $user->val->$playId = true; //store
            } else {
                echo " not valid play ID; \n";
            }
        }
    }

    //to check and pass socket
    if ($action == "addUser") {
        $obj->socket = $user;
    }
    if ($action == "addUserInGame") {
        $obj->socket = $user;
//        if (!isset($user->val->gameId)) {
//            $obj->pre = true;
//            $request = new PingRequest($obj);
//            $request->$action();            
//        }
    }

    // from AJAX request case (1 request client)
    if ("ajax" == $action) {
        global $users, $echo;
        $userId = $obj->userId;

        if (isset($users[$userId])) {
            echo "user id = $userId";
            $echo->public_send($users[$userId], json_encode($obj));
        }
        return;
    }

    if (isset($obj->gameType)) {
        loadMainClass($obj->gameType); //load especific game CLASS
        //TODO: if admin or not
        if (true) {
            $request = new GameAdmin($obj);
        } else {
            //$request = new Game($obj);
        }
    } else {
        $request = new PingRequest($obj);
    }

    $request->$action();
}

trait Connection {

    function send_social_response($obj, $socialId) {
        //check
        $values = array(
            'socialId' => $socialId
        );
        $players = petition("SELECT id FROM smltown_players WHERE socialId = :socialId", $values);
        if (count($players) == 0) {
            return;
        }

        global $users, $echo;
        $gameId = $this->gameId;
        $obj['gameId'] = $gameId;
        $json = json_encode($obj);

        $userId = $players[0]->userId;
        if (isset($users[$userId])) {
            // instant websocket
            $user = $users[$userId];
            $echo->public_send($user, $json);
            //
        } else if ($users[$userId]->val->gameId != $gameId) { //4 ajax petition, store on reply
            $values['reply'] = $json; //escape \ from utf-8 special chars
            sql("UPDATE smltown_players SET reply = CONCAT(reply , '|' , :reply) WHERE socialId = :socialId", $values);
        }
    }

    // TODO: reduce mysql calls..
    function send_response($obj, $playId = null, $playerReply = false) {
        global $users, $echo;

//        echo json_encode($obj);
//        if (!isset($obj['gameId'])) {
        $gameId = $this->gameId;
        $obj['gameId'] = $gameId;
//        }

        $json = json_encode($obj);

        if (isset($playId)) {
            $plays = petition("SELECT userId FROM smltown_plays WHERE id = $playId AND admin != -2");
            if (0 < count($plays)) {
                $userId = $plays[0]->userId;
                if (isset($users[$userId])) {
                    // instant websocket
                    $user = $users[$userId];
                    $echo->public_send($user, $json);
                    //
                }
                if (!isset($users[$userId]) || $users[$userId]->val->gameId != $gameId) { //4 ajax petition, store on reply
                    $values = array('reply' => $json); //escape \ from utf-8 special chars
                    sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE id = $playId", $values);
                }
            }
            //
        } else {
            $plays = petition("SELECT id, userId FROM smltown_plays WHERE gameId = $gameId AND admin != -2");
            for ($i = 0; $i < count($plays); $i++) {
                $userId = $plays[$i]->userId;
                if (isset($users[$userId])) {
                    // instant websocket
                    $user = $users[$userId];
                    $echo->public_send($user, $json);
                    //
                }
                if (!isset($users[$userId]) || $users[$userId]->val->gameId != $gameId) { //4 ajax petition, store on reply
                    $values = array('reply' => $json); //escape \ from utf-8 special chars
                    $playId = $plays[$i]->id;
                    sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE id = $playId", $values);
                }
            }
        }

        //echo "done; ";
    }

}
