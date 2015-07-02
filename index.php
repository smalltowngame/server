<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Expose-Headers: smalltown, name");
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
        temp: {}
    };
</script>

<?php
session_start();
$smalltownURL = "";
if (isset($_SESSION['smalltownURL']) && file_exists("/game.html") < 1) {
    $smalltownURL = $_SESSION['smalltownURL'] . "/";
}

include_once 'php/DB.php';
include_once 'php/request.php';
addUser();

global $lang;
$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}

if (isset($_SESSION['smltown_gameId'])) {
    echo "<script>;SMLTOWN.Game.id = '" . $_SESSION['smltown_gameId'] . "';</script>";
}
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
            <div id="smltown_game"><div class="smltown_errorLog"></div></div>
        </div>
    </body>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Util.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/Games.js"></script>

    <script>

    SMLTOWN.lang = "<?php echo $lang ?>";
    SMLTOWN.path = "<?php echo $smalltownURL; ?>";

    // wait document ready or if in plugin readyState is complete?
//    if (document.readyState === "complete") {
//        loads();
//    }
    $(document).one("ready", function() {
        SMLTOWN.Server.websocketConnection(function(done) {
            if (!done) {
                SMLTOWN.Server.ajaxConnection();
            } else {
                console.log("WEBSOCKET CONNECTION");
            }
        });
        SMLTOWN.Transform.windowResize();
        //DEFINE WAY TO NAVIGATE
        if ($("body").attr("id") == "smltown") { //as MAIN webpage game
            if (!window.location.hash) {
                window.location.hash = "gameList"
            }
            window.onhashchange = function() {
                SMLTOWN.Load.end();
                SMLTOWN.Load.divLoad(window.location.hash.split("#")[1] || "");
            };
            window.onhashchange();
        } else { //as PLUGIN
            if (typeof SMLTOWN.Game.id != "undefined") {
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.id);
            } else {
                SMLTOWN.Load.showPage("gameList");
            }
        }
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
