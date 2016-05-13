<?php

function back() {
    echo "<script>SMLTOWN.Load.showPage('gameList', 'not valid hash id');</script>";
    exit;
}

if (!isset($_REQUEST['gameId']) || empty($_REQUEST['gameId'])) { //from jquery load()
    back(); //if not game id
}
$gameId = $_REQUEST['gameId'];

if (!empty($_REQUEST['lang'])) { //from jquery load()
    $lang = $_REQUEST['lang'];
}


//path files 4 plugins
$smalltownURL = "";
if (isset($_COOKIE['smalltownURL'])) {
    $smalltownURL = $_COOKIE['smalltownURL'] . "/";
}

include_once 'php/DB.php';
$type = "";

try {
    if (intval($gameId) < 1) {
        throw new Exception("game id is not an integer.");
    }
    $games = petition("SELECT type FROM smltown_games WHERE id = $gameId");
} catch (Exception $e) {
    echo "<script>SMLTOWN.Load.showPage('gameList', 'not valid game id');</script>";
    exit;
}

if (count($games)) {
    $type = $games[0]->type;
} else {
    back(); //if game not exists
}
?>

<div id="smltown_game"></div>

<script type="text/javascript" src="<?php echo $smalltownURL ?>games/<?php echo $type ?>/frontEnd.js"></script>
<script type="text/javascript" src="<?php echo $smalltownURL ?>games/<?php echo $type ?>/lang/<?php echo $lang ?>.js"></script>

<script>

    $("#smltown_game").load("<?php echo $smalltownURL ?>game.html", function () {
        SMLTOWN.Game.info = {
            id: <?php echo $gameId ?>,
            type: '<?php echo $type ?>'
        };


        //EMOJI REMOVED - SIMPLIFICATION NOW TO GROW
//    $('.emojis-wysiwyg').emojiarea({wysiwyg: true});
        //NOT COMMENT THIS!
        $("#smltown_sendInput").on("tap", function (e) {
            e.preventDefault(); //prevent open chat again
            $("#smltown_chatForm").submit();
        });

//    $(".emoji-wysiwyg-editor").blur(function (e) {
//        if ($(e.target).parents("#smltown_chatForm").length > 0) {
//            $(".emoji-wysiwyg-editor").trigger('focus');
//            $("#smltown_chatInput").trigger('change');
//        }
//    });
//
//    $(".emoji-wysiwyg-editor").on("tap", function (e) {
//        if ($(e.target).is("img")) {
//            var index = $(e.target).index();
//
//            var caret = 0;
//            $(".emoji-wysiwyg-editor").contents().each(function () {
//                caret++;
//                if (index == $(this).index()) {
//                    console.log("return on index = " + index);
//                    return false;
//                }
//            });
//
//            var textNode = $(".emoji-wysiwyg-editor")[0];
//            var range = document.createRange();
//            range.setStart(textNode, caret);
//            range.setEnd(textNode, caret);
//            var sel = window.getSelection();
//            sel.removeAllRanges();
//            sel.addRange(range);
//        }
//    });


        var inGame = true;

        console.log("game file load");
        SMLTOWN.Load.start();

        //add translated selector if chat empty
        $("#smltown_consoleLog > div").attr("empty-content", SMLTOWN.Message.translate("emptyChat"));

        //RESTART
        SMLTOWN.user.admin = null;
        SMLTOWN.user.card = null;
        SMLTOWN.user.rulesJS = null;
        SMLTOWN.user.sel = null;
        SMLTOWN.user.message = null;

        SMLTOWN.players = {};

        SMLTOWN.Game.loadedFiles = 0;
        SMLTOWN.Util.translateHTML();

        //INIT VARIABLES
        SMLTOWN.user.sleeping = true;
        SMLTOWN.cardLoading = false;

        SMLTOWN.Events.game();

        //cookie
        (function () {
            var urlId = SMLTOWN.Load.getUrlGameId();
            if (urlId) {
                SMLTOWN.Game.info.id = urlId;
            }
            SMLTOWN.Util.setPersistentCookie("smltown_gameId", SMLTOWN.Game.info.id);
        })

        $(window).ready(function () {
            SMLTOWN.Transform.gameResize();
            SMLTOWN.Server.request.addUserInGame(SMLTOWN.Game.info.id); //add this user to game
        });

        //info
        $("#smltown_currentUrl").html(location.origin + "/" + location.hash.split("?")[1]);

        if ($("#smltown_notes textarea").length) {
            $("#smltown_notes textarea").val(localStorage.getItem("notes" + SMLTOWN.Game.info.id));
            $("#smltown_notes textarea").css('height', $("#smltown_notes textarea")[0].scrollHeight + "px");
        }
    });

</script>
