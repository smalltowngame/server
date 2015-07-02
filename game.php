
<div id="smltown_header">
    <div id="smltown_menuIcon"></div>            
    <div class="smltown_content"></div>
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

    <div id="smltown_filter" class="absolute">
        <div id="smltown_popup" class="absolute">
            <div id="smltown_popupText"></div>
            <div id="smltown_popupOk" class="smltown_button">OK</div>
            <div id="smltown_popupCancel" class="smltown_button">Cancel</div>
        </div>
        <div class="smltown_countdown"></div>
    </div>

    <!--visuals card-->
    <div id='smltown_phpCard'></div>

</div>

<div id="smltown_menu" class="smltown_swipe">
    <div id="smltown_menuContent">
        <div>
            <div class="smltown_selector smltown_admin">					
                <div>
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

                <div id="smltown_dayTime" class="input smltown_admin smltown_gameOver">
                    <span>DayTime</span> <symbol>R</symbol>
                    <form>
                        <span>sec/p</span>
                        <input type="text" placeholder="60"/>
                    </form>					
                </div>

                <div id="smltown_openVoting" class="input smltown_admin smltown_gameOver">
                    <span>OpenVoting</span> <symbol>R</symbol>
                    <input class="" type="checkbox"/>
                </div>

                <div id="smltown_endTurn" class="input smltown_admin smltown_gameOver">
                    <span>AdminEndTurn</span> <symbol>R</symbol>
                    <input class="" type="checkbox"/>
                </div>
            </div>

            <div class="smltown_selector">
                <div class="smltown_falseSelector">
                    <symbol class="icon">U</symbol>
                    <span>PlayingCards</span>
                    <small>card list</small>
                </div>
                <p id='smltown_playingCards'></p>
            </div>

            <div class="smltown_selector">
                <div>
                    <symbol class="icon">U</symbol>
                    <span>UserSettings</span>
                    <small>personal options</small>
                </div>
                <div id="smltown_updateName" class="input smltown_gameOver">                    
                    <span>Name</span>
                    <form>
                        <input type="text"/>
                    </form>					
                </div>
                <div id="smltown_cleanErrors" class="smltown_single button">
                    <span>CleanErrors</span>
                    <small>reload game</small>
                </div>
            </div>

            <div class="smltown_selector">
                <div>
                    <div class="icon">i</div>
                    <span>Info</span>
                    <small>help and game manual</small>
                </div>
                <div id="smltown_currentUrl" class="text">
                </div>

                <div id="smltown_disclaimer" class="text">
                </div>
            </div>

        </div>

        <div id="smltown_backButton" class="smltown_selector">
            <div>
                <span>Back</span>
                <small>back to game list</small>
            </div>
        </div>

    </div>
</div>

<div id="smltown_card" class="smltown_swipe">
    <div id="smltown_cardBack" class="smltown_cardImage"></div>
    <div id="smltown_cardFront">
        <div class="smltown_cardImage"></div>
        <div class="smltown_cardText"><div></div></div>
    </div>
</div>

<div id="smltown_console" class="smalltown_console">
    <!--            <div id="consoleTitle">
                    <span id="statusGame"></span>
                    <span class="gameName"></span>
                </div>-->

    <div id="smltown_consoleText">
        <!--id 4 scroll detection-->
        <div id="smltown_consoleLog">
            <p class="smltown_errorLog"></p>
            <div></div>

        </div>
    </div>
    <form id="smltown_chatForm">
        <input type="text" id="smltown_chatInput"/>
    </form>
</div>

<script>

    //INIT VARIABLES
    SMLTOWN.user.sleeping = true;    
    SMLTOWN.cardLoading = false;
    
    SMLTOWN.Transform.gameResize();
    SMLTOWN.Transform.storeGameHeights();
    SMLTOWN.Events.game();

    //start SOCKET imitation
    SMLTOWN.Server.request.addUserInGame(); //add this user to game
    SMLTOWN.Server.startPing();

    $("#smltown_disclaimer").load(SMLTOWN.path + "./game_disclaimer.html");
    $("#smltown_currentUrl").append("<b>Current URL:</b> <br/><br/> <small>" + window.location.href + "</small>");

</script>
