<?php

$host = '5.39.13.210';
//$host = 'oscargardiazabal.com';
//$host = 'localhost'; //host
$port = '9000'; //port
$null = NULL; //null var
//Create TCP/IP sream socket
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
//reuseable port
socket_set_option($socket, SOL_SOCKET, SO_REUSEADDR, 1);

//bind socket to specified host
socket_bind($socket, 0, $port);
//listen to port
socket_listen($socket);

set_time_limit(0);
//create & add listning socket to the list
$clients = array($socket);

try {
    include_once 'DB.php';
    include_once 'DB_request.php';
    include_once 'DB_requestAdmin.php';
    include_once 'DB_response.php';
    include_once 'DB_utils.php';
} catch (Exception $e) {
    send_response("includes error", null);
}

//start endless loop, so that our script doesn't stop
while (true) {
    //manage multipal connections
    $changed = $clients;
    //returns the socket resources in $changed array
    socket_select($changed, $null, $null, 0, 10);

    //check for new socket
    if (in_array($socket, $changed)) {
        $socket_new = socket_accept($socket); //accpet new socket
        $clients[] = $socket_new; //add socket to client array

        $header = socket_read($socket_new, 1024); //read data sent by the socket
        perform_handshaking($header, $socket_new, $host, $port); //perform websocket handshake
        //make room for new socket
        $found_socket = array_search($socket, $changed);
        unset($changed[$found_socket]);
    }

    //loop through all connected sockets
    foreach ($changed as $changed_socket) {

        //check for any incomming data
        while (socket_recv($changed_socket, $buf, 1024, 0) >= 1) {
            $received_text = unmask($buf); //unmask data

            if ($received_text == "stop") {
                send_response("socket closed by stop", null);
                socket_close($socket);
            }

            $found_socket = array_search($changed_socket, $clients);
            $clientSocket = $clients[$found_socket];

            // CUSTOM ////////////////////////////////////////////////////////////////////
            try {

                $obj = json_decode($received_text);
                if (is_object($obj) && $obj->action) {

                    //$this->sessID = $matches[1];
                    //session_id($this->sessID);
                    //@session_start();
                    $session = $_SESSION['session_id'];
                    $userResult = petition("SELECT id FROM players WHERE session = '$session'");
                    $userId = NULL;
                    if (count($userResult) > 0) {
                        $userId = $userResult[0]->id;
                    }

                    $gameId = NULL;
                    $gameResult = petition("SELECT game FROM players WHERE id = $userId");
                    if (count($gameResult) > 0) {
                        $gameId = $gameResult[0]->game;
                    }

                    $action = $obj->action;
                    $obj->userId = $userId;
                    $obj->gameId = $gameId;
                    $action($obj);
                }
            } catch (Exception $e) {
                send_response("error = " + $e, null);
            }

            break 2; //exist this loop
        }

        $buf = @socket_read($changed_socket, 1024, PHP_NORMAL_READ);
        if ($buf === false) { // check disconnected client
            // remove client for $clients array
            $found_socket = array_search($changed_socket, $clients); // error witth the custom function
            socket_getpeername($changed_socket, $ip);
            unset($clients[$found_socket]);

            //notify all users about disconnected connection
            $response = json_encode(array('type' => 'system', 'message' => $ip . ' disconnected'));
            send_response($response, null);
        }
    }
}

// close the listening socket
send_response("socket closed out of while", null);
set_time_limit(30);

socket_close($socket);

function send_response($json, $userId) {
    if (isset($userId)) {
        $msg = mask($json);
        @socket_write($userId, $msg, strlen($msg));
    } else {
        $msg = mask($json);
        global $clients;
        foreach ($clients as $changed_socket) {
            @socket_write($changed_socket, $msg, strlen($msg));
        }
    }
}

//Unmask incoming framed message
function unmask($text) {
    $length = ord($text[1]) & 127;
    if ($length == 126) {
        $masks = substr($text, 4, 4);
        $data = substr($text, 8);
    } elseif ($length == 127) {
        $masks = substr($text, 10, 4);
        $data = substr($text, 14);
    } else {
        $masks = substr($text, 2, 4);
        $data = substr($text, 6);
    } $text = "";
    for ($i = 0; $i < strlen($data); ++$i) {
        $text .= $data[$i] ^ $masks[$i % 4];
    }
    return $text;
}

//Encode message for transfer to client.
function mask($text) {
    $b1 = 0x80 | (0x1 & 0x0f);
    $length = strlen($text);

    if
    ($length <= 125)
        $header = pack('CC', $b1, $length);
    elseif ($length > 125 &&
            $length < 65536)
        $header = pack('CCn', $b1, 126, $length);
    elseif (
            $length >= 65536)
        $header = pack('CCNN', $b1, 127, $length);

    return $header . $text;
}

//handshake new client.

function perform_handshaking($receved_header, $client_conn, $host, $port) {
    $headers = array();
    $lines = preg_split("/\r\n/", $receved_header);
    foreach ($lines as $line) {
        $line = chop($line);
        if (preg_match('/\A(\S+): (.*)\z/', $line, $matches)) {
            $headers[$matches[1]] = $matches[2];
        }
    }

    $secKey = $headers['Sec-WebSocket-Key'];
    $secAccept = base64_encode(pack('H*', sha1($secKey . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')));
//hand shaking header
    $upgrade = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" .
            "Upgrade: websocket\r\n" .
            "Connection: Upgrade\r\n" .
            "WebSocket-Origin: $host\r\n" .
            "WebSocket-Location: ws://$host:$port/socket/shout.php\r\n" .
            "Sec-WebSocket-Accept:$secAccept\r\n\r\n";
    socket_write($client_conn, $upgrade, strlen($upgrade));
}
