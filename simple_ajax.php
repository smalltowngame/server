<?php

//action manager request:

$GLOBALS['ROOT'] = dirname(__FILE__);
session_start();

//PING resquest
$content = file_get_contents("php://input");
$obj = json_decode($content);

if (is_object($obj) && $obj->action) {

    include_once 'php/DB.php';
    include_once 'php/functions.php';

    if (isset($_COOKIE["smltown_userId"])) { //reload user
        $obj->userId = $_COOKIE["smltown_userId"];
    }

    $action = $obj->action;
    $action($obj);
    //
} else {
    $error = "error request data.";
    if (empty($content)) {
        $error .= " EMPTY CALL";
    } else {
        $error .= " isset:" . isset($obj) . ", is_object:" . is_object($obj) . " with ' " . $content . " '";
    }
    echo $error;
}
