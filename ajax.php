<?php

session_start();

//PING resquest
$content = file_get_contents("php://input");

$obj = json_decode($content);

if (is_object($obj) && $obj->action) {

    include_once 'php/DB.php';
    include_once 'php/functions.php';

    $action = $obj->action;
    $action($obj);
    //
} else {
    echo "error request data. isset:" . isset($obj) . ", is_object:" . is_object($obj);
}
