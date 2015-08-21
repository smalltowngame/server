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
        //$this->send($user, $message);
        data_received($user, $message);
    }

    protected function connected($user) {
        echo "\n";

        //read cookies
        $cookiesParts = explode('; ', $user->headers['cookie']);
        foreach ($cookiesParts as $cookieParts) {
            $interimCookie = explode('=', $cookieParts);
            $cookies[$interimCookie[0]] = urldecode($interimCookie[1]);
        }

        //recover lost socket
        if (isset($cookies["smltown_userId"])) {
            $userId = $cookies["smltown_userId"];
            echo " userId = $userId; \n";

            global $users;

            foreach ($users as $id => $u) {
                if ($userId == $id) { //recover!
                    $user->val = $u->val;

                    $this->disconnect($u->socket);
                    unset($users[$id]);

                    $users[$userId] = $user;
                    return;
                }
            }
        }

        $user->val = (object) array();
        // If we did care about the users, we would probably have a cookie to
        // parse at this step, would be looking them up in permanent storage, etc.
    }

    protected function closed($user) {
        // Do nothing: This is where cleanup would go, in case the user had any sort of
        // open files or other objects associated with them.  This runs after the socket 
        // has been closed, so there is no need to clean up the socket itself here.
    }

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
    $obj = json_decode($message);

    if (is_object($obj) && $obj->action) {

        global $users;

        //WEBSOCKET
        echo " looking for $user->id... ";
        foreach ($users as $userId => $u) {
            //echo "; id = $u->id; ";
            if ($u->id == $user->id) {
                $obj->userId = $userId;
                echo " FOUND: $userId;";
                break;
            }
        }
        echo "\n";

        //check playId and store
        if (isset($obj->playId)) {
            $playId = $obj->playId;
            if (!isset($user->val->$playId) && null != $obj->userId) {//validate
                $count = petition("SELECT count(*) as count FROM smltown_plays WHERE userId = '$obj->userId' AND id = $obj->playId");
                if ($count > 0) {
                    $user->val->$playId = true;
                } else {
                    echo " not valid play ID; \n";
                }
            }
        }

        //to check and pass socket
        $obj->socket = $user;

        if (isset($obj->gameType)) {
            loadMainClass($obj->gameType);

            if (true) {
                $request = new GameAdmin($obj);
            } else {
                //$request = new Game($obj);
            }
        } else {
            $request = new PingRequest($obj);
        }

        $action = $obj->action;
        $request->$action();
        //
    } else {
        echo "error request data. isset:" . isset($obj) . ", is_object:" . is_object($obj);
    }
}

trait Connection {

    function send_response($json, $playId = null) {
        global $users, $echo;
        
        if (isset($playId)) {
            $userId = petition("SELECT userId FROM smltown_plays WHERE id = $playId")[0]->userId;
            $user = $users[$userId];
            $echo->public_send($user, $json);
            //
        } else {
            $gameId = $this->gameId;
            $plays = petition("SELECT userId FROM smltown_plays WHERE gameId = $gameId");
            for ($i = 0; $i < count($plays); $i++) {
                $user = $users[$plays[$i]->userId];
                $echo->public_send($user, $json);
            }
        }
    }

}
