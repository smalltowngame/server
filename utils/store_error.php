<?php

if (isset($_POST["error"])) {
    $error = $_POST["error"];
    
    include_once 'error.php';
    error($error);
}
