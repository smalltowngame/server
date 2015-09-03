<?php

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
        //$this->send($user, "data received");
        data_received($user, $message);
    }

    protected function connected($user) {
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
                global $users;

                if (isset($users[$userId])) { //recover!
                    $u = $users[$userId];
                    $user->val = $u->val; //copy stored values
                    $this->disconnect($u->socket); //disconnect old
                }
                $user->userId = $userId; //important
                //$users[$userId] = $user;

                sql("UPDATE smltown_players SET websocket = 1 WHERE id = '$userId'");
            }
        }

        //TODO: get reply (maybe in smltown_player?)
        //$this->send($user, $json);
    }

    protected function closed($user) {
        global $users;
        echo "close: \n";
        $this->send($user, "websocket closed");
        if (isset($user->userId)) {
            unset($users[$user->userId]);
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

    //get socket stored userId if exists
    if (isset($user->userId)) {
        $obj->userId = $user->userId;
    }

    //check playId and store
    if (isset($obj->playId)) {
        $playId = $obj->playId;
        if (!isset($user->val->$playId) && isset($obj->userId)) {//validate this user is this playId
            $count = petition("SELECT count(*) as count FROM smltown_plays WHERE userId = '$obj->userId' AND id = $obj->playId");
            if ($count > 0) {
                $user->val->$playId = true; //store
            } else {
                echo " not valid play ID; \n";
            }
        }
    }

    $action = $obj->action;

    // from AJAX request case (1 request client)
    if ("ajax" == $action) {
        global $users, $echo;
        if (!isset($obj->userId)) {
            $userId = petition("SELECT userId FROM smltown_plays WHERE id = $obj->to")[0]->userId;
        } else {
            $userId = $obj->userId;
        }
        if (isset($users[$userId])) {
            echo "user id = $userId";
            $echo->public_send($users[$userId], json_encode($obj));
        }
        return;
    }
    /////////////////////////
    //
    //to check and pass socket
    if ($action == "addUser" || $action == "addUserInGame") {
        $obj->socket = $user;
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
            $plays = petition("SELECT userId FROM smltown_plays WHERE id = $playId AND admin > -1");
            if (0 < count($plays)) {
                $userId = $plays[0]->userId;
                if (isset($users[$userId])) {
                    // instant websocket
                    $user = $users[$userId];
                    $echo->public_send($user, $json);
                    //
                } 
                if(!isset($users[$userId]) || $users[$userId]->val->gameId != $gameId) { //4 ajax petition, store on reply
                    $values = array('reply' => $json); //escape \ from utf-8 special chars
                    sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE id = $playId", $values);
                }
            }
            //
        } else {
            $plays = petition("SELECT id, userId FROM smltown_plays WHERE gameId = $gameId AND admin > -1");
            for ($i = 0; $i < count($plays); $i++) {
                $userId = $plays[$i]->userId;
                if (isset($users[$userId])) {
                    // instant websocket
                    $user = $users[$userId];
                    $echo->public_send($user, $json);
                    //
                }
                if(!isset($users[$userId]) || $users[$userId]->val->gameId != $gameId) { //4 ajax petition, store on reply
                    $values = array('reply' => $json); //escape \ from utf-8 special chars
                    $playId = $plays[$i]->id;
                    sql("UPDATE smltown_plays SET reply = CONCAT(reply , '|' , :reply) WHERE id = $playId", $values);
                }
            }
        }
    }

}
