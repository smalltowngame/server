<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<script>
    var smltown = {};
</script>
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

session_start();
$smalltownURL = "";
if (isset($_SESSION['smalltownURL']) && file_exists("/game.php") < 1) {
    $smalltownURL = $_SESSION['smalltownURL'] . "/";
}

include_once 'DB.php';
include_once 'DB_response.php';
$games = getGamesInfo();
echo "<script>;var games = JSON.parse('$games');</script>";

$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}

if (isset($_SESSION['smltown_gameId'])) {
    echo "<script>;smltown.gameId = '" . $_SESSION['smltown_gameId'] . "';</script>";
}

//$session = $_SESSION['smalltownURL'];
//echo "<script>console.log('smalltownURL = $smalltownURL. session = $session. " . file_exists("/game.php") . "')</script>";
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
        <p id="ola">U+1F601</p>
        😃
        😁
        <div id="smltown_html">            
            <div id="smltown_gameList"><div class="smltown_errorLog" class="title"></div></div>
            <div id="smltown_game"></div>
        </div>
    </body>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/util.js"></script>
    <script>

    $("#ola").html("↓");

    //MULTILANGIAGE DETECTION
    (function($) { //translate every text() jquery function
        var old = $.fn.text;
        $.fn.text = function(text) {
            if (text && !isNumber(text)) {
                text = message(text);
            }
            return old.apply(this, arguments);
        };
    })(jQuery);

    var loadsCount = 0;
    $("#smltown_gameList").load("<?php echo $smalltownURL ?>" + "gameList.php", function() {
        documentReady();
        loadsCount++;
    });
    $("#smltown_game").load("<?php echo $smalltownURL ?>" + "game.php", function() {
        events();
        documentReady();
        loadsCount++;
    });

    function documentReady() {
        if (!loadsCount) {
            return;
        }
        windowResize();

        //DEFINE WAY TO NAVIGATE
        if ($("body").attr("id") == "smltown") { //as MAIN webpage game
            if (!window.location.hash) {
                location.hash = "gameList"
            }
            window.onhashchange = function() {
                divLoad(window.location.hash.split("#")[1] || "");
            };
            window.onhashchange();

        } else { //as PLUGIN
            if (typeof smltown.gameId != "undefined") {
                load("game?" + smltown.gameId);
            } else {
                load("gameList");
            }
        }
    }

    //LOAD CALL
    function load(url) {
        if ($("body").attr("id") == "smltown") { //as MAIN
            window.location.hash = url;
        } else {
            divLoad(url);
        }
    }

    //LOAD FUNCTION
    function divLoad(url) {
        if (typeof url == "undefined") {
            smltown_error("ge2ybn")
        }
        var urlArray = url.split("?");
        var urlPage = urlArray[0];
        if (urlPage == "game") {
            if (typeof urlArray[1] != "undefined") {
                smltown.gameId = urlArray[1]
            }
            $("#smltown_gameList").hide();
            $("#smltown_game").show();
            loadGame();
        } else if (urlPage == "gameList") {
            $("#smltown_game").hide();
            $("#smltown_gameList").show();
            indexLoad();
        }
    }

    //let DEFAULT gameList.php
    function indexLoad() {
        $(".smltown_createGame").remove();
        if (document.location.hostname != "localhost") {
            $("#smltown_games").before("<table class='smltown_createGame'><td id='smltown_nameGame'><input type='text' placeholder='game name'></td> <td id='smltown_newGame' class='smltown_button'>create game</td> </table>");
            $("#smltown_nameGame input").focus(function() {
                Device.input();
                smltown_error("hi")
            });
            $("#smltown_newGame").click(function() { //CREATE GAME
                console.log(123)
                createGame();
            });
        }
        $("#connectionCheck").remove();
        $("#smltown_footer").prepend("<i id='connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");

        websocketConnection(function(done) {
            if (!done) {
                $(".smltown_allowWebsocket").text("NOT");
            }
            $("#smltown_connectionCheck").show();
            listGames(games);
        });
    }

    function updateGames() {
        var json = JSON.stringify({
            action: "getGamesInfo"
        });
        ajax(json, function(res) {
            var games;
            try {
                games = JSON.parse(res);
            } catch (e) {
                console.log("error");
                return;
            }
            listGames(games);
        });
    }

    function listGames(games) {
        $(".smltown_game").remove();
        for (var i = 0; i < games.length; i++) {
            addGamesRow(games[i]);
            if (document.location.hostname == "localhost") {
                break;
            }
        }
    }

    function addGamesRow(game) {

        var classNames = "smltown_game";
        if (document.location.hostname == "localhost") {
            classNames += " smltown_local";
            game.name = "Local Game"
        }
        var div = $("<div id='" + game.id + "' class='" + classNames + "'>");
        div.append("<span class='smltown_name'>" + game.name + "</span>");
        if (game.password) {
            div.append("<symbol class='smltown_password'>x</symbol>");
        }

        div.append("<span class='smltown_playersCount'><small>players: </small> " + game.players + "</span>");
        div.append("<span class='smltown_admin'><small>admin: </small> " + game.admin + "</span>");
        $("#smltown_games").append(div);
        gameEvents(game.id);
    }

    function createGame() {
        stopLocalGameRequests();
        var name = $("#smltown_nameGame input").val();
        if (!name) {
            $("#smltown_log").text("empty name!");
            return;
        }

        $("#smltown_log").text("!wait...");
        var json = JSON.stringify({
            action: "createGame",
            name: name
        });

        ajax(json, function(id) {
            if (!isNaN(id)) {
                smltown.gameId = id;
                load("game?" + smltown.gameId);
            } else {
                $("#smltown_log").html("id = " + id);
            }
        });
    }

    function gameEvents(id) {
        $("#" + id).click(function() {
            var id = $(this).attr("id");
            if ($(this).closest("tr").hasClass("smltown_password")) {
                askPassword(id);
            } else {
                accessGame(id);
            }
        });
    }

    function askPassword(id) {
        $("#smltown_body").append("<div class='dialog'><form id='passwordForm'>"
                + "<input type='text' id='password' gameId='" + id + "' placeholder='password'>"
                + "<input type='submit' value='Ok'>"
                + "<div class='smltown_button' onclick='$(\".dialog\").remove();'>Cancel</div>"
                + "<div class='log'></div>"
                + "</form><div>");
        $("#smltown_password").focus();
        $("#smltown_passwordForm").submit(function() {
            $("#smltown_passwordForm .error").text("");
            var gameId = $("#smltown_password").attr("gameId");
            var password = $("#smltown_password").val();
            var json = JSON.stringify({
                action: "checkPassword",
                gameId: gameId,
                password: password
            });
            ajax(json, function(res) {
                if (res > 0) {
                    $("#smltown_passwordForm .log").html("loading game...");
                    accessGame(gameId);
                } else {
                    $("#smltown_passwordForm .log").html("<div class='smltown_error'>wrong password</div>");
                }
            });
            return false;
        });
    }

    function accessGame(id) {
        stopLocalGameRequests();
        smltown.gameId = id;
        load("game?" + smltown.gameId);
    }

    var Game = {};
    Game.lang = '<?php echo $lang ?>';
    Game.path = "<?php echo $smalltownURL; ?>"
    </script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/ajax.js"></script>

    <script type="text/javascript" src="<?php echo $smalltownURL ?>lang/<?php echo $lang ?>.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery.mobile.events.min.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/modernizr.custom.36644.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/events.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/json2.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/requests.js"></script> <!--before connection-->    
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/connection.js"></script>    
    <script type="text/javascript" src="<?php echo $smalltownURL ?>js/messages.js"></script>
    <script type="text/javascript" src="<?php echo $smalltownURL ?>css/images.js"></script>
    <!--emoticons-->
    <link href="libs/js-emoji/emoji.css" rel="stylesheet" type="text/css" />
    <script src="libs/js-emoji/emoji.js" type="text/javascript"></script>
    <script type="text/javascript">
//
//// force text output mode
//    emoji.text_mode = true;
//
//// show the short-name as a `title` attribute for css/img emoji
//    emoji.include_title = true;

    emoji.img_path = "/smalltown/smalltown";
    </script>
</html>
