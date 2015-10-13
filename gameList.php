<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');

if (isset($_COOKIE['smltown_userId'])) {
    include_once 'php/DB.php';
    sql("UPDATE smltown_players SET gameId = null WHERE id = '" . $_COOKIE['smltown_userId'] . "'");
}
?>

<div id="smltown_gameList">

    <div id="smltown_content">
        <div id="smltown_title">
            <table id='smltown_createGame' style="display: none">
                <td id='smltown_nameGame'>
                    <input type='text'>
                </td>
                <td id='smltown_newGame' class='smltown_button smltown_disable'>
                    <div>createGame</div>
                </td>
            </table>
        </div>

        <div id="smltown_gamesWrapper">
            <div id="smltown_games"></div>

            <!--http://ryanfait.com/sticky-footer/-->
            <div id="smltown_footer">
                <div id="smltown_loadingGames"></div>
                <br/>
                <div class="smltown_log" style="position:absolute; z-index:99"></div>
                <div class="smltown_errorLog"></div>

                <!-- Your like button code -->
                <!--<div class="fb-like" href="https://apps.facebook.com/smltown/" layout="box_count" action="like" show-faces="false" share="false" width="50"></div>-->
            </div>
        </div>       
    </div>

    <div id="smltown_reload" class="smltown_button" onclick="SMLTOWN.Games.reloadList()">reload</div>

</div>

<script>
    SMLTOWN.Server.stopPing();

    $("#smltown_nameGame input").attr("placeholder", "🔍 " + SMLTOWN.Message.translate("gameName"));
    SMLTOWN.Util.translateHTML();

    //clean
    SMLTOWN.Game.info = {};
    SMLTOWN.Load.gameList();

    //game list events
    $("#smltown_gamesWrapper").on("scrollBottom", function () {
        SMLTOWN.Games.loadMore();
    });

    //cookie
    SMLTOWN.Util.setPersistentCookie("smltown_gameId", "");

    //url message
    if (location.hash.split("?")[1]) {
        smltown_error(location.hash.split("?")[1]);
    }

    //TUTORIAL?
    if ("todo" == localStorage.getItem("tutorial")) {
        SMLTOWN.Message.notify("tutorial?", function () {
            SMLTOWN.Help.tour();
        }, function () {
            localStorage.setItem("tutorial", "done");
        });
    }

</script>
