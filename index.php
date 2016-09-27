<?php
//headers first of all!
header('Access-Control-Allow-Origin: *');
header("Access-Control-Expose-Headers: smalltown, smltown_name");
header('smalltown: 1');
//header('name:u');
//
//set cookie lifetime for 10 days (60sec * 60mins * 24hours * 100days)
ini_set('session.cookie_lifetime', 864000);
ini_set('session.gc_masexlifetime', 864000);
//maybe you want to precise the save path as well
//ini_set('session.save_path', "smalltown");
//needs to be before html
session_start();
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">

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
        config: {},
        Social: {}
    };
</script>

<?php
//path files 4 plugins
//$smalltownURL = $_SERVER['HTTP_HOST'];
$smalltownURL = "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
//if (isset($_SESSION['smalltownURL']) && file_exists("/game.php") < 1) {
if (isset($_COOKIE['smalltownURL'])) {
    $smalltownURL = $_COOKIE['smalltownURL'] . "/";
}
$staticsURL = $smalltownURL;
if (isset($_GET["static"])) {
    $staticsURL = $_GET["static"];
    echo "<script>console.log('staticsURL: $staticsURL')</script>";
}

global $lang;
if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
    $lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
}
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}

//update config file externally
if (true === getenv("config_update")) {
    unlink('config.php');
    putenv("config_update=false");
    echo "console.log('WARN: config.php update by global server variable')";
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
    $database_port = false === $port ? "null" : $port;
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
include_once "config.php";

$script = "<script>;";
//if (isset($_SESSION['smltown_gameId'])) {
//    $script .= "SMLTOWN.Game.info.id = '" . $_SESSION['smltown_gameId'] . "';";
//}
if (isset($debug)) {
    $script .= "SMLTOWN.config.debug = $debug;";
}

if (isset($websocket_server)) {
    $script .= "SMLTOWN.config.websocket_server = $websocket_server;";
}
if (isset($websocket_autoload)) {
    $script .= "SMLTOWN.config.websocket_autoload = $websocket_autoload;";
}
if (isset($local_servers)) {
    $script .= "SMLTOWN.config.local_servers = $local_servers;";
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

        <script>
            SMLTOWN.lang = "<?php echo $lang ?>";
            SMLTOWN.path = "<?php echo $smalltownURL; ?>";
            SMLTOWN.path_static = "<?php echo $staticsURL; ?>";
        </script>

        <?php if ($staticsURL == $smalltownURL) { ?>
            <link rel="shortcut icon" href="<?php echo $smalltownURL ?>favicon.ico" type="image/x-icon"/>
        <?php } ?>
        <script type="text/javascript" src="<?php echo $staticsURL ?>libs/smltown_errorLog.js"></script>

        <!--load jquery allways in header-->
        <script type="text/javascript" src="<?php echo $staticsURL ?>libs/jquery-1.11.0.min.js"></script>
    </head>

    <!--smalltown is class if not plugin-->
    <body id="smltown"></body>

    <!--load async HTML-->
    <script>

            //load loading images first
            (function () {
//                var url = SMLTOWN.path_static + "/html/loading.html";
                var url = SMLTOWN.path + "/html/loading.html";
                console.log("loading url = " + url);
                var XHRt = new XMLHttpRequest; // new ajax
                XHRt.onload = function () {
                    document.querySelector("#smltown").innerHTML = XHRt.response;
                };
                XHRt.open("GET", url, false);
                XHRt.send();
            })();

    </script>

    <!--CSS after load starting images-->
    <link rel='stylesheet' href="<?php echo $staticsURL ?>css/clean.css">
    <link rel='stylesheet' href="<?php echo $staticsURL ?>css/index.css">
    <link rel='stylesheet' href='<?php echo $staticsURL ?>css/common.css'>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>css/game.css'>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>css/static.css'>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>css/icons.css'>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>css/help.css'>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>social/social.css'>
    <script type="text/javascript" src="<?php echo $staticsURL ?>css/images.js"></script>

    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Util.js"></script>    
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/UI.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Games.js"></script>

    <script>

            // external cookie overwrites
//    (function() {
//        var userName = SMLTOWN.Util.getCookie("smltown_userName");
//        if (userName) {
//            console.log("user name = " + userName);
//            SMLTOWN.user.name = userName;
//        }
//    })();

            $(document).one("ready", function () {
                SMLTOWN.user.userId = SMLTOWN.Util.getCookie("smltown_userId");
                if (!SMLTOWN.user.userId) {
                    localStorage.setItem("tutorial", "todo");
                }

                SMLTOWN.user.name = SMLTOWN.Util.getLocalStorage("smltown_userName");
                SMLTOWN.Transform.windowResize();
                $("#smltown_footer").append("<i id='smltown_connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");
                SMLTOWN.Server.handleConnection();
                //detect android
                var ua = navigator.userAgent.toLowerCase();
                var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
                if (!window.Device && isAndroid) {
                    if (!localStorage.getItem("androidAsked")) {
                        SMLTOWN.Message.notify("_androidAppQuestion", function () { //ok callback
                            window.location = "https://play.google.com/store/apps/details?id=town.sml";
                        }, function () {
                            localStorage.setItem("androidAsked", 1);
                        });
                    }

                    //reduce height body
                    $("#smltown_html").css({
                        bottom: "80px"
                    });
                    //add AD
                    var ad = $("<div id='androidAd'></div>");
                    $("#smltown").append(ad);
                    ad.click(function () {
                        location.href = "https://play.google.com/store/apps/details?id=town.sml";
                    });
                }
            });
    </script>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>lang/<?php echo $lang ?>.js"></script>      
    <script type="text/javascript" src="<?php echo $staticsURL ?>libs/json2.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Server.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/request.js"></script> <!--before connection-->

    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Message.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Update.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Action.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Transform.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Add.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Load.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Local.js"></script>    
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Time.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Social.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Help.js"></script>

    <script type="text/javascript" src="<?php echo $staticsURL ?>libs/jquery.mobile.events.min.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>libs/modernizr.custom.36644.js"></script><!--after mobile.events-->
    <script type="text/javascript" src="<?php echo $staticsURL ?>js/Events.js"></script><!--after modernizr-->

    <script type="text/javascript" src="<?php echo $staticsURL ?>social/facebook.js"></script>

    <!--Emojis-->
    <script type="text/javascript" src="<?php echo $staticsURL ?>libs/emoji/jquery.emojiarea.js"></script>
    <script type="text/javascript" src="<?php echo $staticsURL ?>libs/emoji/packs/basic/emojis.js"></script>
    <link rel='stylesheet' href='<?php echo $staticsURL ?>libs/emoji/jquery.emojiarea.css'>   
    <script>
            $.emojiarea.path = '<?php echo $staticsURL ?>libs/emoji/packs/basic/images';
    </script>

</html>
