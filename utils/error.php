<?php

function error($text) {
    if (empty($text)) {
        return;
    }
    echo "warn: $text";
    
    //get info from session and cookies
    $text .= " (";
    if (isset($_COOKIE["smltown_userId"])) {
        $text .= "userId: " . $_COOKIE["smltown_userId"] . ";";
    }
    if (isset($_SESSION['playId'])) {
        $text .= " play id: " . $_SESSION['playId'] . ";";
    }
    if (isset($_SESSION['onlyAjax'])) {
        $text .= " ajax client: " . $_SESSION['onlyAjax'] . ";";
    }
    $text .= ")";

    //$errorText = date('[d-m-Y H:i:s]') . $text . " \n";
    $errorText = $text . " \n";

    $length = file_put_contents(dirname(__FILE__) . "/smltown.log", $errorText, FILE_APPEND | LOCK_EX);
    
    //if not writable log
    if (0 == $length) {
        $warn = "file log in utils/smltown.log file SEEMS NOT WRITABLE";
        echo "warn: $warn";
        mail('gamesmalltown@gmail.com', $warn, $errorText);
    }
}
