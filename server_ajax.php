<?php

session_start();

//PING resquest
$content = file_get_contents("php://input");

if (empty($content)) { //reply petition
        
    if(!isset($_GET["id"])){
        echo "SMLTOWN.Load.showPage('gameList')";
        die();
    }    
    if(!isset($_SESSION["userId"])){ //reload user
        echo "SMLTOWN.Load.reloadGame()";
        die();
    }
    $userId = $_SESSION["userId"];
    
    include_once 'php/DB.php';
    $plays = petition("SELECT reply FROM smltown_plays WHERE userId = '$userId' AND gameId = " . $_GET["id"]);
    if (count($plays)) {
        if (empty($plays[0]->reply)) {
            die();
        }
    } else { //not play found
        echo "SMLTOWN.Load.showPage('gameList')";
        die();
    }
    
    //make transaction to prevents remove recents reply's on multiple requests
    echo transaction(array(
        // save '' for concat replys
        "SET @reply := NULL"
        , "UPDATE smltown_plays SET reply = @reply := reply, reply = '' WHERE userId = '$userId' AND gameId = " . $_GET["id"]
        , "SELECT @reply AS reply"
    ));

//Normal request, echo = error
} else {
    include_once 'php/server_ajax_utils.php';    
    serverRequest($content);
}
