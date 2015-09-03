<?php
if (isset($_COOKIE['smltown_userId'])) {
    include_once 'php/DB.php';
    sql("UPDATE smltown_players SET gameId = null WHERE id = '" . $_COOKIE['smltown_userId'] . "'");
}
?>

<div id="smltown_gameList">

    <div id="smltown_content">
        <div id="smltown_title"></div>

        <div id="smltown_gamesWrapper">
            <div id="smltown_games">
                <div id="smltown_footer">
                    <div id="smltown_loadingDiv"></div>
                    <br/>
                </div>
            </div>
        </div>

        <div class="smltown_log" style="position:absolute; z-index:99"></div>
        <div class="smltown_errorLog"></div>            
    </div>

    <div id="smltown_reload" class="smltown_button" onclick="SMLTOWN.Load.reloadList()">reload</div>

</div>

<script>
    //SMLTOWN.Util.translateHTML();
    $("#smltown_title").html("<p>" + SMLTOWN.Message.translate("GameList") + "</p>");

    SMLTOWN.Game.info = {};
    SMLTOWN.Load.gameList();

    //game list events
    $("#smltown_gamesWrapper").on("scrollBottom", function () {
        SMLTOWN.Games.loadMore();
    });

</script>
