<?php

chdir('../');

$content = file_get_contents("php://input");
$obj = json_decode($content);

$action = $obj->action;
$action($obj);

function findFriends($obj) {
    include_once "DB.php";
    
    $array = json_decode($obj->friends);
    //echo $obj->friends;
    
    $coincidences = petition("SELECT * FROM smltown_players WHERE socialId "
            . "IN (" . implode(',', $array) . ")");
        
    echo json_encode($coincidences);
}
