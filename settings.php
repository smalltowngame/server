<?php

//path files 4 plugins
$filePath = $_SERVER["REQUEST_URI"];
if(strpos($filePath, ".php")){
    $arr = explode("/", $filePath);
    array_pop($arr);
    $filePath = implode("/", $arr) . "/";
}
$smalltownURL = "http://$_SERVER[HTTP_HOST]$filePath";
//if (isset($_SESSION['smalltownURL']) && file_exists("/game_php.html") < 1) {
if (isset($_COOKIE['smalltownURL'])) {
    $smalltownURL = $_COOKIE['smalltownURL'] . "/";
}
$staticsURL = $smalltownURL;
if (isset($_GET["static"])) {
    $staticsURL = $_GET["static"];
}

//update config file externally
if (true === getenv("config_update")) {
    unlink('config.php');
    putenv("config_update=false");
}

//passing variables with heroku: heroku config:set MY_VAR=somevalue
$inc = 'config.php';
if (!file_exists($inc) || !is_readable($inc)) {

    $myfile = fopen($inc, "w") or die("Unable to open/create config.php file!");
    $length = fwrite($myfile, '<?php' . PHP_EOL);

    if (0 == $length) {
        $error = "warn: config.php file is not writable or not exists";
        echo $error;
        //file_put_contents("utils/smltown.log", date('[d-m-Y H:i:s]') . " $error \n", FILE_APPEND);
        file_put_contents("utils/smltown.log", " $error \n", FILE_APPEND);
        //unlink('config.php');
    }

    fwrite($myfile, PHP_EOL);

    $location = getenv("MYSQL_LOCATION");
    $database_location = false === $location ? "localhost" : $location;
    fwrite($myfile, '$database_location = "' . $database_location . '";' . PHP_EOL);

    $port = getenv("MYSQL_PORT");
    $database_port = false === $port ? "" : $port;
    fwrite($myfile, '$database_port = "' . $database_port . '";' . PHP_EOL);

    $name = getenv("DATA_NAME");
    $database_name = false === $name ? "smalltown" : $name;
    fwrite($myfile, '$database_name = "' . $database_name . '";' . PHP_EOL);

    $user = getenv("MYSQL_USERNAME");
    $database_user = false === $user ? "root" : $user;
    fwrite($myfile, '$database_user = "' . $database_user . '";' . PHP_EOL);

    $pass = getenv("MYSQL_ROOT_PASSWORD");
    $database_pass = false === $pass ? "" : $pass;
    fwrite($myfile, '$database_pass = "' . $database_pass . '";' . PHP_EOL);

    fwrite($myfile, PHP_EOL);

    $ajax = getenv("ajax_server");
    $ajax_server = false === $ajax ? 1 : $ajax;
    fwrite($myfile, '$ajax_server = ' . $ajax_server . ';' . PHP_EOL);

    $websocket = getenv("websocket_server");
    $websocket_server = false === $websocket ? 1 : $websocket;
    fwrite($myfile, '$websocket_server = ' . $websocket_server . ';' . PHP_EOL);

    $autoload = getenv("websocket_autoload");
    $websocket_autoload = false === $autoload ? 1 : $autoload;
    fwrite($myfile, '$websocket_autoload = ' . $websocket_autoload . ';' . PHP_EOL);

    $local = getenv("local_servers");
    $local_servers = false === $local ? 1 : $local;
    fwrite($myfile, '$local_servers = ' . $local_servers . ';' . PHP_EOL);

    $dbug = getenv("debug");
    $debug = false === $dbug ? 0 : $dbug;
    fwrite($myfile, '$debug = ' . $debug . ';' . PHP_EOL);

    fwrite($myfile, PHP_EOL);
    fwrite($myfile, '$admin_contact = 0;' . PHP_EOL);
    fclose($myfile);
}

//SERVER STATS
require_once 'php/DB.php';
$q_games = "SELECT count(*) as count FROM smltown_games WHERE lastConnection > DATE_SUB(NOW(), INTERVAL 5 MINUTE)";
$active_games = petition($q_games)[0]->count;
$q_players = "SELECT count(*) as count FROM smltown_players WHERE gameId IN (SELECT Id FROM smltown_games WHERE lastConnection > DATE_SUB(NOW(), INTERVAL 5 MINUTE))";
$active_players = petition($q_players)[0]->count;

//RESPONSE
include_once "config.php";

$config = array(
    'debug' => $debug,
    'websocket_server' => $websocket_server,
    'websocket_autoload' => $websocket_autoload,
    'local_servers' => $local_servers,
    'smalltownURL' => $smalltownURL,
    'staticsURL' => $staticsURL,
    'activeGames' => $active_games,
    'activePlayers' => $active_players
);

echo json_encode($config);

//https://coderwall.com/p/gdam2w/get-request-path-in-php-for-routing
function request_path() {
    $request_uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
    $script_name = explode('/', trim($_SERVER['SCRIPT_NAME'], '/'));
    $parts = array_diff_assoc($request_uri, $script_name);
    if (empty($parts)) {
        return '/';
    }
    $path = implode('/', $parts);
    if (($position = strpos($path, '?')) !== FALSE) {
        $path = substr($path, 0, $position);
    }
    return $path;
}
