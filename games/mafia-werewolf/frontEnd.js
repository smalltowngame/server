
//SMLTOWN.mafia_werewolf = {};

SMLTOWN.Update.gameStatus = function() {
    console.log("update game");
    //INPUTS
    SMLTOWN.Time.clearCountdowns();

    //hide
    var lastClass = $("#smltown_game").attr("class");
    $("#smltown_game").attr("class", "");
    $(".smltown_gameover").removeClass("smltown_selectable");
    $("#smltown_sun").hide();
    $("#smltown_startButton").hide();
    $("#smltown_endTurnButton").hide();
    $("#smltown_spectatorMode").hide();
    $(".smltown_spectatorJoinable").removeClass("smltown_spectatorJoinable");
    SMLTOWN.Action.nightConsoleOff();

    //var statusChange = localStorage.getItem("status" + SMLTOWN.Game.info.id) != SMLTOWN.Game.info.status;
    var statusChange = $("#smltown_game").attr("status") != SMLTOWN.Game.info.status;
    console.log("statusChange = " + statusChange);
    SMLTOWN.Server.pingDefault(SMLTOWN.Server.normalPing);
    $(".defaultSelect").removeClass("defaultSelect");

    switch (SMLTOWN.Game.info.status) {

        case 1: //night time
            SMLTOWN.Server.pingDefault(SMLTOWN.Server.fastPing);

            $("#smltown_sun").show();
            $("#smltown_game").attr("class", "smltown_night");
            $("#smltown_statusGame").smltown_text("nightTime");

            if (statusChange) { // 1st time
                $(".smltown_check").removeClass("smltown_check");
                $(".smltown_votes span").remove();

                SMLTOWN.Action.sleep(); //only if 1st time!
            }

            if (SMLTOWN.Game.info.night && SMLTOWN.user.status > -1 && SMLTOWN.user.card == SMLTOWN.Game.info.night) {
                if (SMLTOWN.Action.night.extra) { //if extra
                    SMLTOWN.Server.request.nightExtra(); //1st call
                } else if (SMLTOWN.Action.night.select && !SMLTOWN.user.message) { //or if select                        
                    SMLTOWN.Action.wakeUpCard();
                } else if (SMLTOWN.user.message) {
                    SMLTOWN.Message.setMessage(SMLTOWN.user.message);
                } else {
                    smltown_debug("undefined error on night game status");
                }
            } else {
                var message = false, instant = true;
                SMLTOWN.Action.wakeUp(message, instant); //prevent stay wake up on other night turn
            }

            break;
        case 2:
            if (statusChange) { // 1st time
                $("#smltown_statusGame").smltown_text("wakingUp");
                this.onStatusChange();
                SMLTOWN.Action.endNight();
            }
            break;
        case 3: //town discusing
            SMLTOWN.Server.pingDefault(SMLTOWN.Server.fastPing);
            $("#smltown_sun").show(); //before countdown!

            SMLTOWN.Time.runCountdown();
            if ("1" == SMLTOWN.Game.info.endTurn) {
                if ("0" !== SMLTOWN.Game.info.time) {
                    $("#smltown_endTurnButton").show();
                }
            }

            $("#smltown_statusGame").smltown_text("dayTime");

            if (statusChange) { // 1st time
                var t = SMLTOWN.Message.translate;
                if (!SMLTOWN.Game.info.time || 0 < parseInt(SMLTOWN.Game.info.time)) {
                    SMLTOWN.Action.wakeUp(t("GoodMorning")); //only if any server message
                } else {
                    console.log("prevented good morning message. info.time = " + SMLTOWN.Game.info.time);
                }
            }

            //help colors
            var allBots = true;
            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].admin > -2) {
                    allBots = false;
                    break;
                }
            }
            if (SMLTOWN.user.admin > 0 && allBots) {
                $("#smltown_menuIcon").addClass("defaultSelect");
                $("#smltown_adminMenu").addClass("defaultSelect");
                $("#smltown_endTurnButton").addClass("defaultSelect");
            }

            break;
        case 4:
            if (statusChange) { // 1st time
                $("#smltown_statusGame").smltown_text("endingDay");
                this.onStatusChange();
            }

            break;
        case 5: //end game
            SMLTOWN.Server.pingDefault(SMLTOWN.Server.slowPing);

            if (statusChange) { // 1st time 
                console.log("end game");
                var t = SMLTOWN.Message.translate;
                SMLTOWN.Action.wakeUp(t("GameOver"), true);
                SMLTOWN.Action.cleanVotes();
                $("#smltown_statusGame").smltown_text("GameOver");
                $("#smltown_game").attr("class", "smltown_gameover");
                SMLTOWN.Action.resetGame();

                if (SMLTOWN.user.status > -1 && SMLTOWN.Social.winFeed) {
                    SMLTOWN.Social.winFeed();
                }
            }

            for (var id in SMLTOWN.players) {
                var player = SMLTOWN.players[id];
                if (player.status > -1) {
                    $("#" + player.id + " .smltown_votes").smltown_text("Win");
                }
            }

            if (SMLTOWN.Action.night.endGame) {
                SMLTOWN.Action.night.endGame();
            }

            //help colors     
            if (SMLTOWN.user.admin > 0) {
                $("#smltown_menuIcon").addClass("defaultSelect");
                $("#smltown_adminMenu").addClass("defaultSelect");
                $("#smltown_restartButton").addClass("defaultSelect");
            }
            if (SMLTOWN.user.admin < 0) {
                $("#smltown_user").addClass("smltown_spectatorJoinable");
            } else if (SMLTOWN.user.admin == 0) {
                $("#smltown_spectatorMode").show();
            }

            break;
        default: //waiting for new game (0) "new cards"
            SMLTOWN.Server.pingDefault(SMLTOWN.Server.slowPing);
            $(".smltown_gameover").addClass("smltown_selectable");
            
            SMLTOWN.Action.removeCards(); //run this always prevents bugs
            if (statusChange) { // 1st time
                if (lastClass) { //only if not on enter game
                    var t = SMLTOWN.Message.translate;
                    SMLTOWN.Action.wakeUp(t("gameRestarted"), true);
                }

                $("#smltown_game").attr("class", "smltown_waiting");
                $("#smltown_statusGame").smltown_text("waitingNewGame");
                $(".smltown_player:not(.smltown_spectator) .smltown_playerStatus").smltown_text("waiting");
                $(".smltown_player.smltown_spectator .smltown_playerStatus").smltown_text("spectatorPlayer");                
                SMLTOWN.Action.resetGame();
            }

            if (1 == SMLTOWN.user.admin && SMLTOWN.user.card) {
                $("#smltown_startButton").show();
            }

            //help colors
            if (SMLTOWN.user.admin > 0) {
                $("#smltown_menuIcon").addClass("defaultSelect");
                $("#smltown_adminMenu").addClass("defaultSelect");
                if (SMLTOWN.user.card) {
                    $("#smltown_startButton").addClass("defaultSelect");
                } else {
                    $("#smltown_restartButton").addClass("defaultSelect");
                }
            }
            if (SMLTOWN.user.admin < 0) {
                $("#smltown_user").addClass("smltown_spectatorJoinable");
            } else if (SMLTOWN.user.admin == 0) {
                $("#smltown_spectatorMode").show();
            }
    }
    //localStorage.setItem("status" + SMLTOWN.Game.info.id, SMLTOWN.Game.info.status);
    $("#smltown_game").attr("status", SMLTOWN.Game.info.status);

    //update user stored message!
    if (SMLTOWN.Message.message) {
        SMLTOWN.Message.setMessage(SMLTOWN.Message.message);
        SMLTOWN.Message.message = null;
    }
};

//mafia-werewolf only function
SMLTOWN.Update.onStatusChange = function() {
    console.log("status change");
    if (SMLTOWN.user.status > -1 && SMLTOWN.user.card == SMLTOWN.Game.info.night) { //special card like hunter
        //SMLTOWN.Action.wakeUp(); //cose not sleep
        if (!SMLTOWN.cards[SMLTOWN.user.card]) {
            console.log("card is not longer in game!");
            return;
        }
        var name = SMLTOWN.cards[SMLTOWN.user.card].lang.name;
        var t = SMLTOWN.Message.translate;
        //SMLTOWN.Message.notify(name.toUpperCase() + "... " + t("yourTurn"), true);
        SMLTOWN.Action.wakeUp(name.toUpperCase() + "... " + t("yourTurn"));
    }
//    else if (!$("#smltown_popup").is(":visible")) {
//        //if game reload and not server message shown
//        SMLTOWN.Message.notify("waiting night end decisions", true);
//    }

    SMLTOWN.Action.cleanVotes();
};

SMLTOWN.Action.defineSelectFunctions = function() {
    if (SMLTOWN.Game.info.status == 3 && null != SMLTOWN.Time.end) { //day. time.end is null when day is over
        if (1 != SMLTOWN.Game.info.openVoting && SMLTOWN.Time.countdownInterval) {
            console.log("time is not ended");
            return false;
        }
        this.selectFunction = SMLTOWN.Server.request.selectPlayer;
        this.unselectFunction = SMLTOWN.Server.request.unSelectPlayer;
    } else if (SMLTOWN.Game.info.night && SMLTOWN.Game.info.night == SMLTOWN.user.card && !SMLTOWN.user.sleeping) { //night
        this.selectFunction = this.night.select;
        this.unselectFunction = this.night.unselect;
    } else {
        if (SMLTOWN.Game.info.night) {
            //not night name (like preday..)
            SMLTOWN.Message.flash("_awakening");
        } else {
            console.log("nothing to select");
        }
        return false;
    }
}

SMLTOWN.Game.playing = function() {
    var status = SMLTOWN.Game.info.status;
    if (status > 0 && status < 5) {
        return true;
    }
    return false;
};

///////////////////////////////////////////////////////////////////////////////
//MESAGES
//Override
SMLTOWN.Message.showMessage = function(text, action) {
    var $this = this;
    var time = 0;
    var doCallback = true;

    // STOP functions
    if ("statusGameChange" == action) {
        SMLTOWN.Game.info.night = SMLTOWN.user.card;
        doCallback = false;
    } else if ("lynch" == action) {
        doCallback = false;
    }

    setTimeout(function() {
        var important = true;
        $this.notify(text, function() {
            //alive night message => sleep rol
            if (SMLTOWN.user.status > -1 && SMLTOWN.Game.info.status == 1) {
                SMLTOWN.Game.info.night = "done"; //then not need update from server
                SMLTOWN.Action.sleep();
            }

            if (doCallback) {
                SMLTOWN.Action.cleanVotes();
                SMLTOWN.Server.request.messageReceived();
            }
        }, null, null, important);
    }, time);
};

//FROM SMLTOWN.Message.setMessage() (custom message functions FROM SERVER)
SMLTOWN.Message.votations = function(json) {
    var res = killsMessage(json, false)
    var card = "";
    if (res) {
        var url = SMLTOWN.Add.getCardUrl(res[1][0]);
        if (url) {
            card = "<img src='" + url + "'/>";
        }
    }

    return card + "<div class='smltown_imageText'>" + res[0] + "<div>" + SMLTOWN.Message.translate("GettingDark");
};

SMLTOWN.Message.kills = function(json) {
    var res = killsMessage(json, true);
    var card = "";
    if (res) {
        var url = SMLTOWN.Add.getCardUrl(res[1][0]);
        if (url) {
            card = "<img src='" + url + "'/>";
        }
    }
    return card + "<div class='smltown_imageText'>" + res[0] + "<div>";
};

function killsMessage(json, night) {
    var t = SMLTOWN.Message.translate;
    var sleepText = "";

    var plays = false;
    try {
        plays = JSON.parse(json);
    } catch (e) {
        smltown_error("error parsing kills message = " + json);
        return "";
    }
    console.log(json)

    var selections = false;
    sleepText += "<table>"
    for (var i = 0; i < plays.length; i++) {
        var sel = plays[i].sel;
        if (sel) {
            sleepText += "<tr>"
            var id = plays[i].id;
            //console.log(SMLTOWN.players[id].name)
            var nameSel = SMLTOWN.players[sel].name;
            sleepText += "<td class='id" + id + "'>" + SMLTOWN.players[id].name + "</td>"
                    + " <td> ⚔ </td> "
                    + "<td class='id" + sel + "'>" + nameSel + "</td>";
            sleepText += "</tr>";
            selections = true;
        }
    }
    sleepText += "</table>"

    if (selections) {
        sleepText += "<br/>";
    }

    //check kills by cards showed on json
    var cards = [];
    var linched = false;
    for (var i = 0; i < plays.length; i++) {
        if (plays[i].card) {
            linched = true;
            var play = plays[i];
            var id = play.id;

            SMLTOWN.players[id].status = 0;

            if (!SMLTOWN.cards[play.card]) {
                SMLTOWN.Message.flash("error on card result: " + play.card);
                return;
            }

            var name = SMLTOWN.players[id].name;
            var cardName = SMLTOWN.cards[play.card].lang.name;
            sleepText += " <span class='id" + id + "'>" + name + "</span>, " + cardName + ", ";
            cards.push(play.card);

            if (night) {
                sleepText += t("wasKilledTonight");
            } else {
                sleepText += t("wasKilled");
            }
            sleepText += ". ";
        }
    }

    if (!linched) {
        if (night) {
            sleepText += t("NoKillsTonight") + ". ";
        } else {
            sleepText += t("NoKills") + ". ";
        }
    }
    return [sleepText, cards];
}
