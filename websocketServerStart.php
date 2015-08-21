<?php

//try start websocket
$websocketCount = 'ps aux | grep "[s]mltown_websocket.php" | wc -l';

$res = shell_exec($websocketCount);
if ($res == 0) {
    $output = exec('nohup php smltown_websocket.php > /dev/null 2>&1 &');
    $count = shell_exec($websocketCount);
    if (isset($count)) {
        echo $count;
    } else { //any return?
        echo -2;
    }
} else { //it seems started
    echo -1;
}
