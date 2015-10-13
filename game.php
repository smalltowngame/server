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

<div id="smltown_game">

    <div id="smltown_header">
        <div id="smltown_menuIcon"></div>            
        <div class="smltown_content">
            <span id="smltown_help">?</span>
        </div>
        <div id="smltown_consoleTitle">
            <span id="smltown_statusGame"></span>
            <span id="smltown_gameName"></span>
        </div>
        <div id="smltown_cardIcon"></div>
    </div>

    <div id="smltown_body">

        <div id='smltown_sun'><div></div></div>

        <div id="smltown_list">
            <div>
                <div id="smltown_user"></div>
                <div id="smltown_listAlive"></div>
                <div id="smltown_listDead"></div>
                <div id="smltown_listSpectator"></div>
            </div>
        </div>

        <div id="smltown_filter">
            <!--            <div id="smltown_popup">
                            <div id="smltown_popupText"></div>
                            <div id="smltown_popupOk" class="smltown_button">OK</div>
                            <div id="smltown_popupCancel" class="smltown_button">Cancel</div>
                        </div>-->
            <div class="smltown_countdown"></div>
        </div>

    </div>

    <div id="smltown_menu" class="smltown_swipe">
        <div id="smltown_menuContent">
            <div id="smltown_menuAll">
                <div class="smltown_selector smltown_admin">					
                    <div id="smltown_adminMenu">
                        <symbol class="icon">R</symbol>
                        <span>Admin</span>
                        <small>adminHelp</small>
                    </div>

                    <div id="smltown_restartButton" class="smltown_action">
                        <span>NewCards</span> <symbol>R</symbol>
                        <small>newCardsHelp</small>
                    </div>

                    <div id="smltown_startButton" class="smltown_action">
                        <span>StartGame</span> <symbol>R</symbol>
                        <small>startGameHelp</small>
                    </div>

                    <div id="smltown_endTurnButton" class="smltown_action">
                        <span>EndTurn</span> <symbol>R</symbol>
                        <small>endTurnHelp</small>
                    </div>
                </div>

                <div class="smltown_selector smltown_admin">
                    <div>
                        <symbol class="icon">S</symbol>
                        <span>Game</span>
                        <small>gameHelp</small>
                    </div>

                    <div id="smltown_password" class="input smltown_admin">
                        <span>Password</span> <symbol>R</symbol>
                        <form>
                            <input type="text"/>
                        </form>					
                    </div>

                    <div id="smltown_gamePublic" class="input smltown_admin smltown_gameover">
                        <span>GamePublic</span> <symbol>R</symbol>
                        <input class="" type="checkbox"/>
                    </div>

                    <div id="smltown_dayTime" class="input smltown_admin smltown_gameover">
                        <span>DayTime</span> <symbol>R</symbol>
                        <form>
                            <span>sec_p</span>
                            <input type="text" placeholder="60"/>
                        </form>					
                    </div>

                    <div id="smltown_openVoting" class="input smltown_admin smltown_gameover">
                        <span>OpenVoting</span> <symbol>R</symbol>
                        <input class="" type="checkbox"/>
                    </div>

                    <div id="smltown_endTurn" class="input smltown_admin smltown_gameover">
                        <span>AdminEndTurn</span> <symbol>R</symbol>
                        <input class="" type="checkbox"/>
                    </div>
                </div>

                <div class="smltown_selector">
                    <div class="smltown_falseSelector">
                        <symbol class="icon">U</symbol>
                        <span>PlayingCards</span>
                        <small>cardsHelp</small>
                    </div>
                    <p id='smltown_playingCards'></p>
                </div>

                <div class="smltown_selector">
                    <div>
                        <symbol class="icon">U</symbol>
                        <span>UserSettings</span>
                        <small>userHelp</small>
                    </div>
                    <div id="smltown_updateName" class="input smltown_gameover">                    
                        <span>Name</span>
                        <form>
                            <input type="text"/>
                        </form>
                    </div>
                    <div id="smltown_updateImage" class="smltown_action">
                        <span>Image</span>
                        <img>
                    </div>
                    <div id="smltown_spectatorMode" class="smltown_action">
                        <span>SpectatorMode</span>
                        <small>spectatorModeHelp</small>
                    </div>
                    <div id="smltown_cleanErrors" class="smltown_action">
                        <span>CleanErrors</span>
                        <small>cleanHelp</small>
                    </div>
                </div>

                <div id="smltown_friendsMenu" class="smltown_selector">
                    <div>
                        <div class="icon">i</div>
                        <span>Friends</span>
                        <small>friendsHelp</small>
                    </div>
                    <!--Display at least 1 option -->
                    <div id="smltown_showFriends" class="smltown_action">
                        <span>Invite</span>
                        <small>inviteHelp</small>
                    </div>
                    <div id="smltown_addSocialId" class="smltown_action" style="display: none">
                        <span>AddSocialId</span>
                        <small>addSocialIdHelp</small>
                    </div>
                </div>

                <div class="smltown_selector">
                    <div>
                        <div class="icon">i</div>
                        <span>Info</span>
                        <small>infoHelp</small>
                    </div>
                    <div id="smltown_currentUrl" class="input">
                        <span>CurrentURL</span>
                        <small></small>
                    </div>

                    <div id="smltown_disclaimer" class="text">
                    </div>
                </div>

                <div id="smltown_notesMenu" class="smltown_selector">
                    <div class="smltown_falseSelector">
                        <div class="icon">i</div>
                        <span>Notes</span>
                        <small>infoNotes</small>
                    </div>
                    <div id="smltown_notes">
                        <textarea></textarea>
                    </div>
                </div>

                <!--sticky footer PUSH-->
                <!--<div style="height:50px"></div>-->
            </div>

            <div id="smltown_backButton" class="smltown_selector">
                <div>
                    <span>Back</span>
                    <small>backHelp</small>
                </div>
            </div>

        </div>
    </div>

    <div id="smltown_card" class="smltown_swipe">
        <div id="smltown_cardBack" class="smltown_cardImage smltown_cardShadow"></div>
        <div id="smltown_cardFront">
            <div class="smltown_cardImage"></div>
            <div class="smltown_cardText"><div></div></div>
            <div class="smltown_cardShadow"></div>
        </div>
    </div>

    <div id="smltown_console">
        <div style="display: table; height: 100%; width: 100%">
            <div id="smltown_consoleText">
                <!--id 4 scroll detection-->
                <div id="smltown_consoleLog">
                    <p class="smltown_errorLog"></p>
                    <div></div>
                    <div class="smltown_night"></div>
                </div>
            </div>

            <form id="smltown_chatForm">
                <div style="position: relative">
                    <!--<input type="text" id="smltown_chatInput" class="emojis-wysiwyg"/>-->
                    <textarea type="text" id="smltown_chatInput" class="emojis-wysiwyg"></textarea>
                    <div id="smltown_sendInput"></div>
                </div>
            </form>
        </div>
    </div>

    <!--<div id="smltown_nightConsole"></div>-->

    <!--friends selector-->
    <div id=smltown_friendSelector>
        <div id='smltown_friendsTitle'>
            <p>InviteFriends</p>
            <div class="smltown_update">Update</div>

        </div>
        <div id='smltown_friendsContent'>
            <!--demo social friend-->
            <div class='smltown_invitableFriend'><img src=''><p>demoUser</p></div>
        </div>
        <div id='smltown_friendsFooter'>
            <div class="smltown_submit">SendInvitation</div>
            <div class="smltown_cancel">Cancel</div>            
        </div>
    </div>

    <!--login to find friend selector-->
    <div id='smltown_shareMenu'>
        <div>ShareBy</div>
    </div>

    <div id='smltown_pictureContextMenu'>
        <div id="smltown_addFriend">addFriend</div>
    </div>

    <!--visuals card-->
    <div id='smltown_phpCard'></div>

</div>

<script type="text/javascript" src="<?php echo $smalltownURL ?>games/<?php echo $type ?>/frontEnd.js"></script>
<script type="text/javascript" src="<?php echo $smalltownURL ?>games/<?php echo $type ?>/lang/<?php echo $lang ?>.js"></script>

<script>
    $('.emojis-wysiwyg').emojiarea({wysiwyg: true});
    $("#smltown_sendInput").on("tap", function() {
        $("#smltown_chatForm").submit();
    });

    $(".emoji-wysiwyg-editor").blur(function(e) {
        if ($(e.target).parents("#smltown_chatForm").length > 0) {
            $(".emoji-wysiwyg-editor").trigger('focus');
            $("#smltown_chatInput").trigger('change');
        }
    });

    $(".emoji-wysiwyg-editor").on("tap", function(e) {
        if ($(e.target).is("img")) {
            var index = $(e.target).index();

            var caret = 0;
            $(".emoji-wysiwyg-editor").contents().each(function() {
                caret++;
                if (index == $(this).index()) {
                    console.log("return on index = " + index);
                    return false;
                }
            });

            var textNode = $(".emoji-wysiwyg-editor")[0];
            var range = document.createRange();
            range.setStart(textNode, caret);
            range.setEnd(textNode, caret);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });

</script>

<script>
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
    SMLTOWN.Game.info = {
        id:<?php echo $gameId ?>,
        type: '<?php echo $type ?>'
    };

    SMLTOWN.Game.loadedFiles = 0;
    SMLTOWN.Util.translateHTML();

    //INIT VARIABLES
    SMLTOWN.user.sleeping = true;
    SMLTOWN.cardLoading = false;

    $(window).ready(function() {
        SMLTOWN.Transform.gameResize();
    });
    SMLTOWN.Events.game();
    SMLTOWN.Server.request.addUserInGame(SMLTOWN.Game.info.id); //add this user to game

    //start SOCKET imitation
//    if (!SMLTOWN.Server.websocket) {
//        SMLTOWN.Server.startPing();
//    }

    //info
    $("#smltown_disclaimer").load(SMLTOWN.path + "./game_disclaimer.html");
    $("#smltown_currentUrl small").html(window.location.href);

    //cookie
    SMLTOWN.Util.setPersistentCookie("smltown_gameId", SMLTOWN.Game.info.id);

    $("#smltown_notes textarea").val(localStorage.getItem("notes" + SMLTOWN.Game.info.id));
    $("#smltown_notes textarea").css('height', $("#smltown_notes textarea")[0].scrollHeight + "px");

</script>
