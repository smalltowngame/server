<?php
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
                <td id='smltown_newGame' class='smltown_button'>
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
                <div class="fb-like" data-href="https://apps.facebook.com/smltown/" data-layout="box_count" data-action="like" data-show-faces="false" data-share="false"></div>
            </div>
        </div>       
    </div>

    <div id="smltown_reload" class="smltown_button" onclick="SMLTOWN.Load.reloadList()">reload</div>

</div>

<script>

    $("#smltown_nameGame input").attr("placeholder", "🔍 " + SMLTOWN.Message.translate("gameName"));
    SMLTOWN.Util.translateHTML();

    SMLTOWN.Game.info = {};
    SMLTOWN.Load.gameList();

    //game list events
    $("#smltown_gamesWrapper").on("scrollBottom", function() {
        SMLTOWN.Games.loadMore();
    });

</script>
