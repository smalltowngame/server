<?php

include_once "config.php";
if (!isset($websocket_autoload) || !$websocket_autoload) {
    echo -3;
    return;
}

//try start websocket
$websocketCount = 'ps aux | grep "[s]mltown_websocket.php" | wc -l';

$res = shell_exec($websocketCount);
if ($res == 0) {
    $output = exec('nohup php smltown_websocket.php > utils/websocket.log 2> utils/websocket.err </dev/null &');
    $count = shell_exec($websocketCount);
    if (isset($count)) {
        echo $count;
    } else { //any return?
        echo -2;
    }
} else { //it seems started
    echo -1;
}
