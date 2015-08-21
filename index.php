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
        Update: {}
    };

</script>

<?php
session_start();

//path files 4 plugins
$smalltownURL = "";
if (isset($_SESSION['smalltownURL']) && file_exists("/game.php") < 1) {
    $smalltownURL = $_SESSION['smalltownURL'] . "/";
}

global $lang;
$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}

if (isset($_SESSION['smltown_gameId'])) {
    echo "<script>;SMLTOWN.Game.info.id = '" . $_SESSION['smltown_gameId'] . "';</script>";
}

include_once "config.php";
?>

<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Small Town</title>
        <link rel="shortcut icon" href="<?php echo $smalltownURL ?>favicon.ico" type="image/x-icon"/>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/errorLog.js"></script>

        <link rel="stylesheet" type="text/css" href="<?php echo $smalltownURL ?>css/index.css">
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/common.css'>
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/game.css'>
        <!--<link rel='stylesheet' href='css/animations.css'>-->
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/icons.css'>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery-1.11.0.min.js"></script>
    </head>

    <!--smalltown is class if not plugin-->
    <body id="smltown">
        <div id="smltown_html">
            
        </div>
    </body>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Util.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Games.js"></script>

    <script>

    SMLTOWN.lang = "<?php echo $lang ?>";
    SMLTOWN.path = "<?php echo $smalltownURL; ?>";
    SMLTOWN.websocketServer = <?php echo $websocket_server; ?>;
    
    SMLTOWN.user.userId = SMLTOWN.Util.getCookie("smltown_userId");
    SMLTOWN.user.name = SMLTOWN.Util.getLocalStorage("smltown_userName");
    
    $(document).one("ready", function () {
        $("#smltown_footer").html("<i id='smltown_connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");
        SMLTOWN.Server.handleConnection();
    });

    </script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>lang/<?php echo $lang ?>.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery.mobile.events.min.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/modernizr.custom.36644.js"></script>
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
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Events.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Time.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>css/images.js"></script>
</html>