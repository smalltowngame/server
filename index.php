<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Expose-Headers: smalltown, smltown_name");
header('smalltown: 1');
//header('name:u');
//set cookie lifetime for 10 days (60sec * 60mins * 24hours * 100days)
ini_set('session.cookie_lifetime', 864000);
ini_set('session.gc_maxlifetime', 864000);
//maybe you want to precise the save path as well
//ini_set('session.save_path', "smalltown");
?>

<script>
    var SMLTOWN = {
        Games: {},
        Game: {
            info: {},
            wakeUpTime: 2000
        },
        Action: {},
        Server: {},
        user: {},
        Load: {},
        Local: {},
        players: {},
        temp: {},
        Update: {},
        config: {}
    };

</script>

<?php
session_start();

//path files 4 plugins
$smalltownURL = "";
//if (isset($_SESSION['smalltownURL']) && file_exists("/game.php") < 1) {
if (isset($_COOKIE['smalltownURL'])) {
    $smalltownURL = $_COOKIE['smalltownURL'] . "/";
}

global $lang;
$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}

//update config file externally
if(getenv(config_update)){
    unlink('config.php');
    putenv("config_update=false");
    echo "config.php update";
}

//passing variables with heroku: heroku config:set MY_VAR=somevalue
$inc = 'config.php';
echo "1";
if (!file_exists($inc) || !is_readable($inc)) {
    echo "2";
    $myfile = fopen($inc, "w") or die("Unable to open file!");
    fwrite($myfile, '<?php' . PHP_EOL);
    fwrite($myfile, PHP_EOL);
    
    $location = getenv($database_location);
    $database_location = !$location ? "localhost" : $database_location;
    fwrite($myfile, '$database_location = "' . $database_location . '";' . PHP_EOL);
    
    $port = getenv($database_port);
    $database_port = !$port ? "null" : $port;
    echo $database_port;
    fwrite($myfile, '$database_location = ' . $database_port . ';' . PHP_EOL);
    
    $name = getenv($database_name);
    $database_name = !$name ? "smalltown" : $name;
    fwrite($myfile, '$database_name = "' . $database_name . '";' . PHP_EOL);
    
    $user = getenv($database_user);
    $database_user = !$user ? "root" : $user;
    fwrite($myfile, '$database_user = "' . $database_user . '";' . PHP_EOL);
    
    $pass = getenv($database_pass);
    $database_pass = !$pass ? "" : $pass;
    fwrite($myfile, '$database_pass = "' . $database_pass . '";' . PHP_EOL);
    
    fwrite($myfile, PHP_EOL);
    
    $ajax = getenv($ajax_server);
    $ajax_server = !$ajax ? "true" : $ajax;
    fwrite($myfile, '$ajax_server = ' . $ajax_server . ';' . PHP_EOL);
    
    $websocket = getenv($websocket_server);
    $websocket_server = !$websocket ? "true" : $websocket;
    fwrite($myfile, '$websocket_server = ' . $websocket_server . ';' . PHP_EOL);
    
    $autoload = getenv($websocket_autoload);
    $websocket_autoload = !$autoload ? "true" : $autoload;
    fwrite($myfile, '$websocket_autoload = ' . $websocket_autoload . ';' . PHP_EOL);
    
    $dbug = getenv($debug);
    $debug = !$dbug ? "false" : $debug;
    fwrite($myfile, '$debug = ' . $debug . ';' . PHP_EOL);
    
    fwrite($myfile, PHP_EOL);
    fwrite($myfile, '$admin_contact = false;' . PHP_EOL);
    fclose($myfile);
}
include_once "config.php";

$script = "<script>;";
//if (isset($_SESSION['smltown_gameId'])) {
//    $script .= "SMLTOWN.Game.info.id = '" . $_SESSION['smltown_gameId'] . "';";
//}
if (isset($debug) && $debug == true) {
    $script .= "SMLTOWN.config.debug = true;";
}
if (isset($websocket_server) && $websocket_server == true) {
    $script .= "SMLTOWN.config.websocket_server = true;";
}
if (isset($websocket_autoload) && $websocket_autoload == true) {
    $script .= "SMLTOWN.config.websocket_autoload = true;";
}
$script .= "</script>";

echo $script;
?>

<html>
    <head>        
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">

        <!--meta to cache files, but it can't override client options-->
        <meta http-equiv="Cache-control" content="public">

        <title>Small Town</title>
        <link rel="shortcut icon" href="<?php echo $smalltownURL ?>favicon.ico" type="image/x-icon"/>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/errorLog.js"></script>



        <link rel="stylesheet" type="text/css" href="<?php echo $smalltownURL ?>css/index.css">
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/common.css'>
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/game.css'>
        <!--<link rel='stylesheet' href='css/animations.css'>-->
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/icons.css'>        
    </head>

    <!--smalltown is class if not plugin-->
    <body id="smltown">
        <div id="smltown_html">            
            <div class='smltown_loader'></div>            
            <img style="position:absolute; top: 50px; left:0; right:0; margin:auto; max-width: 90%;" 
                 src="data:image/gif;base64,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"/>
        </div>
    </body>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery-1.11.0.min.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Util.js"></script>    
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Games.js"></script>

    <script>

    SMLTOWN.lang = "<?php echo $lang ?>";
    SMLTOWN.path = "<?php echo $smalltownURL; ?>";

    SMLTOWN.user.userId = SMLTOWN.Util.getCookie("smltown_userId");
    SMLTOWN.user.name = SMLTOWN.Util.getLocalStorage("smltown_userName");

    $(document).one("ready", function () {
        $("#smltown_footer").append("<i id='smltown_connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");
        SMLTOWN.Server.handleConnection();
    });

    </script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>lang/<?php echo $lang ?>.js"></script>      
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/json2.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Server.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/requests.js"></script> <!--before connection-->

    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Message.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Update.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Action.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Transform.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Add.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Load.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Local.js"></script>    
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Time.js"></script>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery.mobile.events.min.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/modernizr.custom.36644.js"></script><!--after mobile.events-->
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Events.js"></script><!--after modernizr-->

</html>