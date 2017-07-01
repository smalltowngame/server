
SMLTOWN.Help = {
    help: function () { //game status message
        var status = SMLTOWN.Game.info.status;
        if (!status) {
            status = 0;
        }

        var t = SMLTOWN.Message.translate;
        var text = t("help_status" + status);

        text += "</br>"; /////////////////////////////////

        var waitPlayers = [];
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            if (player.message) {
                waitPlayers.push(player.name);
            }
        }
        if (waitPlayers.length) {
            text += t("help_waiting");
            for (var i = 0; i < waitPlayers.length; i++) {
                text += waitPlayers[i];
                if (waitPlayers.length + 1 != i) {
                    text += ", ";
                } else {
                    text += ". ";
                }
            }
        }

        text += "</br>"; /////////////////////////////////

        text += t("help_cardsPlaying");
        var cards = SMLTOWN.Game.info.cards;
        for (var card in cards) {
            var cardName = SMLTOWN.cards[card].lang.name;
            text += cardName;
            text += ", ";
        }

        $("#smltown_helpMessage .smltown_text").html(text);
    }
    ,
    tour: function () {
        console.log("tour");
        //check availability
        for (var id in SMLTOWN.players) {
            if (id != SMLTOWN.user.id && SMLTOWN.players[id].admin > -1) {
                console.log(id + " , " + SMLTOWN.user.id + " , " + SMLTOWN.players[id].admin);
                SMLTOWN.Message.flash("_error_tutorialPlayers");
                return;
            }
        }

        //if in game
        if ($("#smltown_game").length) {
            this.helps = this.helpGame;
        } else {
            this.helps = this.helpGameList;
        }

        this.start();
    }
    ,
    start: function () {
        var _this = this;
        this.loadIframe(function () {
            var iframe = _this.iframe;

            var helpStop = $("<div id='helpStop'>");
            helpStop.smltown_text("helpStop");
            var left = $("<div style='float:left;margin: 0 20px'><</div>");
            helpStop.append(left);
            left.click(function (e) {
                e.stopPropagation();
                _this.helperPosition -= 2;
                var func = _this.helps[_this.helperPosition - 1][3];
                if (func) {
                    func();
                }
                _this.nextHelp();
            });

            var right = $("<div style='float:right;margin: 0 20px'>></div>");
            helpStop.append(right);
            right.click(function (e) {
                e.stopPropagation();
                _this.helperPosition++;
                var func = _this.helps[_this.helperPosition - 1][3];
                if (func) {
                    func();
                }
                _this.nextHelp();
            });

            helpStop.on("tap", function () {
                _this.stop();
            });

            $("#smltown_html").append(helpStop);
            iframe.find("#smltown_html > div").css("pointer-events", "none");
            _this.nextHelp();
        });
    }
    ,
    done: function () {
        console.log("tutorial done");
        this.stop();
        SMLTOWN.Message.notify("_tutorialDone");
    }
    ,
    stop: function () {
        var iframe = this.iframe;
        $("#helpStop").remove();
        $("#smltown_helpFilter").remove();
        clearInterval(this.helperCheckInterval);
        clearInterval(this.helpMoveInterval);
        clearInterval(this.eventInterval);
        $("#smltown_iframe").remove();
    }
    ,
    helperPosition: 0
    ,
    helps: null
    ,
    //popup location, text, event target, wait query event (if == false, check visibility)
    helpGameList: [
        //nombre partida
//        ["#smltown_nameGame", "help_typeNameGame", "#smltown_nameGame", function () {
//                SMLTOWN.Help.iframe.find("#smltown_newGame").removeClass("smltown_disable");
//            }]
//                ,
        //entrar en partida
        ["#smltown_createGame", "help_createGame", "#smltown_newGame", function () {
                SMLTOWN.Help.iframe.find("#smltown_html")
                        .append("#smltown_game")
                        .load(location.origin + location.pathname + "/game.html", function () {

                            SMLTOWN.Help.iframe.find("#smltown_html").addClass("smltown_isAdmin");

                            //user
                            var userDiv = SMLTOWN.Update.addPlayerHTML(null, true);
                            userDiv.find(".smltown_name").text("YOU");
                            userDiv.find(".smltown_playerStatus").smltown_text("alive");
                            SMLTOWN.Help.iframe.find("#smltown_user").append(userDiv);

                            SMLTOWN.Help.helps = SMLTOWN.Help.helpGame;
                            SMLTOWN.Help.helperPosition = 0;
                            $.getScript(SMLTOWN.path + "games/mafia-werewolf/help/" + SMLTOWN.lang + ".js", function () {
                                SMLTOWN.Help.nextHelp();
                            });

                            SMLTOWN.Help.cardUrl = SMLTOWN.path + "games/mafia-werewolf/cards/card_werewolf.jpg";
                        });
            }]
    ]
    ,
    helpGame: [
        //crear partida
        //menu
        ["#smltown_menuIcon", "help_newGameMenuIcon", "#smltown_menuIcon", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").addClass("smltown_visible");
            }] //first helper w8 visible
                ,
        //admin click
        ["#smltown_adminMenu", "_help_newGameMenuIcon _help_newGameAdminMenu", "#smltown_adminMenu", function () {
                SMLTOWN.Transform.animateAuto(SMLTOWN.Help.iframe.find(".smltown_selector:eq(0)"));
            }]
                ,
        //repartir cartas
        ["#smltown_restartButton", "help_newCards", "#smltown_restartButton", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").removeClass("smltown_visible");
                SMLTOWN.Help.iframe.find("#smltown_cardFront .smltown_cardImage").css('background-image', "url('" + SMLTOWN.Help.cardUrl + "')");
//                var cardName = SMLTOWN.Message.translate("");
                var cardName = "WEREWOLF";
                SMLTOWN.Help.iframe.find("#smltown_cardFront .smltown_cardText").html(SMLTOWN.Update.userTextCard(cardName));
                SMLTOWN.Transform.removeAuto(SMLTOWN.Help.iframe.find(".smltown_selector"));
                //show back card 

            }]
                ,
        //w8
        [null, "help_waitCardShuffle", null, function () {
                SMLTOWN.Help.iframe.find("#smltown_card").addClass("smltown_visible");
                setTimeout(function () {
                    SMLTOWN.Help.iframe.find("#smltown_card").removeClass("smltown_visible");
                }, 150)
            }]
                ,
        //ver carta back
        ["#smltown_cardIcon", "help_cardIcon", "#smltown_cardIcon", function () {
                SMLTOWN.Help.iframe.find("#smltown_card").addClass("smltown_visible");
            }]
                ,
        //click carta
        [null, "help_cardShow", "#smltown_card", function () {
//                SMLTOWN.Transform.cardRotateSwipe();
                SMLTOWN.Help.iframe.find("#smltown_card > div").addClass("smltown_rotate");
            }]
                ,
        //ocultar carta
        [null, "help_cardHide", "#smltown_card", function () {
                SMLTOWN.Help.iframe.find("#smltown_card").removeClass("smltown_visible");
            }]
                ,
        //menu again
        ["#smltown_menuIcon", "help_startGameMenuIcon", "#smltown_menuIcon", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").addClass("smltown_visible");
            }]
                ,
        //admin click
        ["#smltown_adminMenu", "help_startGameAdminMenu", "#smltown_adminMenu", function () {
                SMLTOWN.Transform.animateAuto(SMLTOWN.Help.iframe.find(".smltown_selector:eq(0)"));
            }]
                ,
        //start game
        ["#smltown_startButton", "help_startGame", "#smltown_startButton", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").removeClass("smltown_visible");
                SMLTOWN.Help.iframe.find(".smltown_auto").removeClass("smltown_auto");
                SMLTOWN.Transform.removeAuto(SMLTOWN.Help.iframe.find(".smltown_selector"));
            }]
                ,
        //w8
        [null, "help_waitStartGame", null, function () {
                var txt = SMLTOWN.Message.translate("_botsAdded <br/> _gameWillStart");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
            }]
                ,
        //empezara pronto
        ["#smltown_popup", "help_popupStartGame", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                SMLTOWN.Help.iframe.find("#smltown_html").addClass("smltown_night");

                //1
                var player1 = SMLTOWN.Update.addPlayerHTML(null, true);
                player1.find(".smltown_name").text("Mike");
                player1.find(".smltown_playerStatus").smltown_text("alive");
                SMLTOWN.Help.iframe.find("#smltown_listAlive").append(player1);
                //2
                var player2 = SMLTOWN.Update.addPlayerHTML(null, true);
                player2.find(".smltown_name").text("John");
                player2.find(".smltown_playerStatus").smltown_text("alive");
                SMLTOWN.Help.iframe.find("#smltown_listAlive").append(player2);
                //3
                var player3 = SMLTOWN.Update.addPlayerHTML(null, true);
                player3.find(".smltown_name").text("Carl");
                player3.find(".smltown_playerStatus").smltown_text("alive");
                SMLTOWN.Help.iframe.find("#smltown_listAlive").append(player3);
            }]
                ,
        //INICIO LOOP /////////////////////////////////////////////////////
        //espera a que vibre
        [null, "help_waitVibration", null, function () {
                var txt = SMLTOWN.Message.translate("_wakeUp WEREWOLF... _yourTurn");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
                if (window.Device) {
                    SMLTOWN.Help.vibrationInterval = setInterval(function () {
                        Device.vibrate();
                    }, 1500);
                }
            }]
                ,
        //despierta
        ["#smltown_popup", "help_popup1stWakeup", "#smltown_popupOk", function () {
                clearTimeout(SMLTOWN.Help.vibrationInterval);
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
            }]
                ,
        //select victim
        ["#smltown_listAlive", "help_select1stNightVictim", "#smltown_listAlive", function (e) {
                var div;
                if ($(e.target).hasClass(".smltown_player")) {
                    div = $(e.target);
                } else {
                    div = $(e.target).closest(".smltown_player");
                }
                div.addClass("smltown_preselect");
            }]
                ,
        //re-select
        [".smltown_preselect", "help_reselect1stNightVictim", ".smltown_preselect", function () {
                SMLTOWN.Help.iframe.find(".smltown_preselect").removeClass("smltown_preselect").addClass("smltown_dead")
                        .appendTo(SMLTOWN.Help.iframe.find("#smltown_listDead"))
                        .find(".smltown_extra").css("background-image", "url(" + SMLTOWN.path + "games/mafia-werewolf/cards/card_villager.jpg)");

                var txt = SMLTOWN.Message.translate("player _werewolf_wasKilled");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
            }]
                ,
        //devorado
        ["#smltown_popup", "help_popup1stKilled", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                var txt = SMLTOWN.Message.translate("Villager _wasKilledTonight");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
                SMLTOWN.Help.iframe.find("#smltown_html").removeClass("smltown_night");
            }]
//                ,
//        //espera al resto de jugadores
//        [null, "espera al resto de jugadores"]
                ,
        //ha sido asesinado
        ["#smltown_popup", "help_popup1stWasKilled", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                SMLTOWN.Time.setSunPosition(SMLTOWN.Help.iframe.find("#smltown_sun"), $("#smltown_html").width());

                SMLTOWN.Help.iframe.find("#smltown_sun").attr("class", "daylight1");
                var y = $("#smltown_html").width() / 2 + 50;
                SMLTOWN.Help.iframe.find("#smltown_sun div").css("transform", "translate(-50%, " + y + "px)");
            }]
//                ,
//        //menu
//        ["#smltown_menuIcon", "help_sun", "#smltown_menuIcon"]
                ,
        //menu
        ["#smltown_menuIcon", "help_endTurnMenuIcon", "#smltown_menuIcon", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").addClass("smltown_visible");
                //SUN
                SMLTOWN.Help.iframe.find("#smltown_sun").attr("class", "daylight16");
                var y = $("#smltown_html").width() / 2 + 50;
                var x = $("#smltown_html").width() - SMLTOWN.Help.iframe.find("#smltown_sun >div").width() / 2;
                SMLTOWN.Help.iframe.find("#smltown_sun div").css("transform", "translate(" + x + "px, " + y + "px)");
            }]
                ,
        //admin
        ["#smltown_adminMenu", "help_endTurnAdminMenu", "#smltown_adminMenu", function () {
                SMLTOWN.Transform.animateAuto(SMLTOWN.Help.iframe.find(".smltown_selector:eq(0)"));
            }]
                ,
        //acabar turno
        ["#smltown_endTurnButton", "help_endTurn", "#smltown_endTurnButton", function () {
                SMLTOWN.Help.iframe.find("#smltown_menu").removeClass("smltown_visible");
                var txt = SMLTOWN.Message.translate("_lynch");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
                SMLTOWN.Transform.removeAuto(SMLTOWN.Help.iframe.find(".smltown_selector"));
            }]
                ,
        //linchamiento
        ["#smltown_popup", "help_popupLinch", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
            }]
                ,
        //select victim
        ["#smltown_listAlive", "help_select1stDayVictim", "#smltown_listAlive", function (e) {
                var div;
                if ($(e.target).hasClass(".smltown_player")) {
                    div = $(e.target);
                } else {
                    div = $(e.target).closest(".smltown_player");
                }
                div.addClass("smltown_preselect");
            }]
                ,
        //re-select
        [".smltown_preselect", "help_reselect1stDayVictim", ".smltown_preselect", function () {
                SMLTOWN.Help.iframe.find(".smltown_preselect").removeClass("smltown_preselect").addClass("smltown_dead")
                        .appendTo(SMLTOWN.Help.iframe.find("#smltown_listDead"));
                var txt = SMLTOWN.Message.translate("player _werewolf_wasKilled");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
            }]
                ,
        //ha sido linchado
        ["#smltown_popup", "help_popup1stDayVictim", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                var txt = SMLTOWN.Message.translate("_wakeUp WEREWOLF... _yourTurn");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
                SMLTOWN.Help.iframe.find("#smltown_html").addClass("smltown_night");
                if (window.Device) {
                    SMLTOWN.Help.vibrationInterval = setInterval(function () {
                        Device.vibrate();
                    }, 1500);
                }
            }]
                ,
        //RE - LOOP /////////////////////////////////////////////////////
        //despierta
        ["#smltown_popup", "help_popup2ndWakeUp", "#smltown_popupOk", function () {
                clearTimeout(SMLTOWN.Help.vibrationInterval);
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
            }]
                ,
        //select victim
        ["#smltown_listAlive", "help_select2ndNightVictim", "#smltown_listAlive", function (e) {
                var div;
                if ($(e.target).hasClass(".smltown_player")) {
                    div = $(e.target);
                } else {
                    div = $(e.target).closest(".smltown_player");
                }
                div.addClass("smltown_preselect");
            }]
                ,
        //re-select
        [".smltown_preselect", "help_reselect2ndNightVictim", ".smltown_preselect", function () {
                SMLTOWN.Help.iframe.find(".smltown_preselect").removeClass("smltown_preselect").addClass("smltown_dead")
                        .appendTo(SMLTOWN.Help.iframe.find("#smltown_listDead"));
                var txt = SMLTOWN.Message.translate("player _werewolf_wasKilled");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
            }]
                ,
        //devorado
        ["#smltown_popup", "help_popup2ndKilled", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                var txt = SMLTOWN.Message.translate("Villager _wasKilledTonight");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Message.notificationHTML(txt));
                SMLTOWN.Help.iframe.find("#smltown_html").removeClass("smltown_night");
            }]
                ,
//        //espera al resto de jugadores
//        [null, "espera al resto de jugadores"]
//                ,
        //ha sido asesinado
        ["#smltown_popup", "help_popup2ndWasKilled", "#smltown_popupOk", function () {
                SMLTOWN.Help.iframe.find("#smltown_notification").remove();
                var winnerText = SMLTOWN.Message.translate("winner");
                var shareText = SMLTOWN.Message.translate("Share");
                SMLTOWN.Help.iframe.find("#smltown_html").append(SMLTOWN.Social.facebook.winHTML(SMLTOWN.Help.cardUrl, winnerText, shareText));
            }]
                ,
        //COMPARTE
        ["#smltown_win > div", "help_popupShare", "#smltown_win .smltown_footer div", function () {
                SMLTOWN.Help.iframe.find("#smltown_win").remove();
            }]
//                ,
//        //ha finalizado la partida
//        ["#smltown_popup", "ha finalizado la partida", "#smltown_popupOk", "#smltown_popup:visible"]
    ]
    ,
    nextHelp: function () {
        var $this = this;
        var iframe = this.iframe;

        clearInterval(this.helperCheckInterval);
        clearInterval(this.helpMoveInterval);
        console.log("helperPosition = " + this.helperPosition);
        if (this.helperPosition < 0) {
            this.helperPosition = 0;
        }

        iframe.find("#smltown_helpFilter").remove();

        //if helper ends
        var help = this.helps[this.helperPosition];
        if (!help) {
            if (this.helps == this.helpGameList) {
                clearInterval(this.startGameInterval);
                this.startGameInterval = setInterval(function () {
                    if (iframe.find("#smltown_game").length) {
                        clearInterval($this.startGameInterval);
                        $this.helps = $this.helpGame;
                        $this.helperPosition = 0;
                        $.getScript(SMLTOWN.path + "games/mafia-werewolf/help/" + SMLTOWN.lang + ".js", function () {
                            $this.start();
                        });
                    }
                }, 1000);
                return;
            }

            //tutorial done
            this.done();
            return;
        }

        this.locateHelper(help[0], help[1], help[2], help[3]);
    }
    ,
    //locateHelper: function (queryDiv, value, target, event, func) {
    locateHelper: function (queryDiv, value, target, func) {
        var _this = this;
        var iframe = this.iframe;

        var help = $("<div class='smltown_helpDiv smltown_userSelectable'>");
        var helpContainer = $("<div id='smltown_helpFilter'>");
        helpContainer.append(help);

        var text = SMLTOWN.Message.translate(value);
        text = text.replace(/\. /g, '.<br/><br/>').replace(/! /g, '.<br/><br/>');

        help.attr("lang", value).html(text);

//        if (event) {
//            console.log("event");
//            clearInterval(_this.eventInterval);
//            //w8 condition done
//            _this.eventInterval = setInterval(function () {
//                console.log(event);
//                if (iframe.find(event).length) {
//                    clearInterval(_this.eventInterval);
//
//                    iframe.find("#smltown_helpFilter").remove();
//                    iframe.find("#smltown_html > div").append(helpContainer);
//                    _this.placeHelper(queryDiv);
//
//                    _this.targetEvent(target, help, func);
//                }
//            }, 500);
//            //
//        } else {
        iframe.find("#smltown_helpFilter").remove();
        clearInterval(this.helperTimeout);
        var body = iframe.find("#smltown_body");

//            _this.placeHelper(queryDiv, function () {
//                if (false == event && queryDiv) {
//                    _this.checkVisiblity(queryDiv, help);
//                }
//            });

        this.helperTimeout = setTimeout(function () {
            body.append(helpContainer);
            _this.placeHelper(queryDiv);
        }, 500);

        _this.targetEvent(target, help, func);
//        }
    }
    ,
    targetEvent: function (target, help, func) {
        var $this = this;
        var iframe = this.iframe;

        if (target) {
            iframe.find("*").off(".help");
            var canClick = true;
            iframe.find(".smltown_userSelectable").removeClass("smltown_userSelectable");

            iframe.find(target)
                    //.addClass("smltown_userSelectable")
                    .on("click.help", function (e) {
                        console.log("click")
                        if (!canClick) {
                            return;
                        }
                        canClick = false;
                        setTimeout(function () {
                            canClick = true;
                        }, 500);

                        iframe.find("#smltown_helpFilter").remove();
                        console.log("CLICK TARGET");

                        //before next
                        if (func) {
                            func(e);
                        }

                        $this.helperPosition++;
                        $this.nextHelp();
                    });
            //
        } else {
            iframe.find("#smltown_helpFilter").addClass("smltown_filter");
            var button = $("<button>");
            button.text("ok");
            button.on("click", function () {
                iframe.find("#smltown_helpFilter").remove();

                //before next
                if (func) {
                    func();
                }

                $this.helperPosition++;
                $this.nextHelp();
            });
            help.append(button);
        }
    }
    ,
    placeHelper: function (queryDiv, callback) {
        var $this = this;
        var iframe = this.iframe;

        var pos = null;
        if (queryDiv) {
            pos = iframe.find(queryDiv).offset();
        }

        //w8 appear div offset
        if ("undefined" == typeof pos) {
            console.log("undefined div");
            setTimeout(function () {
                $this.placeHelper(queryDiv, callback);
            }, 500);
            return;
        }

        if (callback) {
            callback();
        }

        var help = iframe.find(".smltown_helpDiv");

        if (!pos) {
            help.addClass("smltown_center");
            return;
        }

        var height = iframe.find("#smltown_html").height();
        var width = iframe.find("#smltown_html").width();

        var x = pos.left;
        var y = pos.top;
        var divWidth = iframe.find(queryDiv).outerWidth();
        var divHeight = iframe.find(queryDiv).outerHeight();

        if (x + divWidth / 2 <= width / 2) {
            help.css("left", x + 5);
            help.addClass("smltown_left");
        } else {
            help.css("right", width - x - divWidth - 5);
            help.addClass("smltown_right");
        }

        if (y + divHeight / 2 <= height / 2) {
            if (!divHeight) {
                divHeight = 20;
            }
            help.css("top", y + divHeight + 10);
            help.addClass("smltown_top");
        } else {
            help.css("bottom", height - y + 10);
            help.addClass("smltown_bottom");
        }

        this.divAd(queryDiv);
        iframe.find(queryDiv).addClass("smltown_userSelectable");
    }
    ,
    //color advice div
    divAd: function (queryDiv) {
        var iframe = this.iframe;

        //console.log(queryDiv);
        var ad = iframe.find("#smltown_helpFilter .smltown_helpAd");
        if (!ad.length) {
            ad = $("<div class='smltown_helpAd'>");
            iframe.find("#smltown_helpFilter").append(ad);
        }
        var div = iframe.find(queryDiv);
        var pos = div.offset();
        //if same position return
//        console.log(parseInt(ad.css("left")) + "==" + pos.left
//                + "&&" + parseInt(ad.css("top")) + "==" + pos.top
//                + "&&" + parseInt(ad.css("width")) + "==" + div.outerWidth()
//                + "&&" + parseInt(ad.css("height")) + "==" + div.outerHeight())
//        if (parseInt(ad.css("left")) == pos.left
//                && parseInt(ad.css("top")) == pos.top
//                && parseInt(ad.css("width")) == div.outerWidth()
//                && parseInt(ad.css("height")) == div.outerHeight()) {
//            return;
//        }

        //w8 tranformation



        var time = 0;
        var adInterval = setInterval(function () {
//            if (pos.left || pos.top) {
            clearInterval(adInterval);

            ad.css({
                left: pos.left,
                top: pos.top,
                width: div.outerWidth(),
                height: div.outerHeight()
            });

//            }else{
            console.log(pos.left + " && " + pos.top);
//            }

            time = 500;
        }, time);
    }
    ,
    checkVisiblity: function (queryDiv) {
        var $this = this;
        var iframe = this.iframe;

        clearInterval(this.helperCheckInterval);

        //check visible position
        this.helperCheckInterval = setInterval(function () {
            $this.placeHelper(queryDiv);

            var pos = iframe.find(queryDiv).offset();

            if ("undefined" == typeof pos) {
                return;
            }

            //check if hidden
            var x = pos.left;
            var y = pos.top;

            var height = iframe.find("#smltown_html").outerHeight();
            var width = iframe.find("#smltown_html").outerWidth();

            var hidden = false;
            if (x < 0 - 30
                    || x > width + 30
                    || y < 0 - 30
                    || y > height + 30) {
                hidden = true;
            }

            if (queryDiv) {
                var div = iframe.find(queryDiv)[0];
                if (!div.isVisible()) {
                    hidden = true;
                }
            }

            //if hiddengo back
            if (hidden) {
                $this.helperPosition--;
                //if div action is null
                if (!$this.helps[$this.helperPosition][0]) {
                    $this.helperPosition--;
                }
                $this.nextHelp();
                return;
            }
        }, 500);
    }
    ,
    loadIframe: function (callback) {
        $("#smltown_iframe").remove();
        var ifr = $("<iframe id='smltown_iframe'>");
        $("#smltown_html").append(ifr);
        this.iframe = $("#smltown_iframe").contents();

        //CSS
        //not js
        var html = $("#smltown_body").html();
        var htmlDiv = $("<div id='smltown_html'>");
        var bodyDiv = $("<div id='smltown_body'>");
        htmlDiv.html(bodyDiv);
        bodyDiv.html(html);
        $("#smltown_iframe").contents().find("body").attr("id", "smltown").html(htmlDiv);

        $("link[rel='stylesheet'], link[type='text/css'], link[href$='.css']").clone().appendTo($("#smltown_iframe").contents().find("html"));

        //js images file
        $("#smltown_iframe")[0].contentDocument.getElementsByTagName('html')[0].appendChild(smltown_style);

        callback();
    }
    ,
    cloneFunction: function (func, name) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.text = "var " + name + " = " + func.toString();

        $("#smltown_iframe").contents().find("head")[0].appendChild(script);
    }
};


/**
 * Author: Jason Farrell
 * Author URI: http://useallfive.com/
 *
 * Description: Checks if a DOM element is truly visible.
 * Package URL: https://github.com/UseAllFive/true-visibility
 */
Element.prototype.isVisible = function () {

    'use strict';

    /**
     * Checks if a DOM element is visible. Takes into
     * consideration its parents and overflow.
     *
     * @param (el)      the DOM element to check if is visible
     *
     * These params are optional that are sent in recursively,
     * you typically won't use these:
     *
     * @param (t)       Top corner position number
     * @param (r)       Right corner position number
     * @param (b)       Bottom corner position number
     * @param (l)       Left corner position number
     * @param (w)       Element width number
     * @param (h)       Element height number
     */
    function _isVisible(el, t, r, b, l, w, h) {
        var p = el.parentNode,
                VISIBLE_PADDING = 2;

        if (!_elementInDocument(el)) {
            return false;
        }

        //-- Return true for document node
        if (9 === p.nodeType) {
            return true;
        }

        //-- Return false if our element is invisible
        if (
                '0' === _getStyle(el, 'opacity') ||
                'none' === _getStyle(el, 'display') ||
                'hidden' === _getStyle(el, 'visibility')
                ) {
            return false;
        }

        if (
                'undefined' === typeof (t) ||
                'undefined' === typeof (r) ||
                'undefined' === typeof (b) ||
                'undefined' === typeof (l) ||
                'undefined' === typeof (w) ||
                'undefined' === typeof (h)
                ) {
            t = el.offsetTop;
            l = el.offsetLeft;
            b = t + el.offsetHeight;
            r = l + el.offsetWidth;
            w = el.offsetWidth;
            h = el.offsetHeight;
        }
        //-- If we have a parent, let's continue:
        if (p) {
            //-- Check if the parent can hide its children.
            if (('hidden' === _getStyle(p, 'overflow') || 'scroll' === _getStyle(p, 'overflow'))) {
                //-- Only check if the offset is different for the parent
                if (
                        //-- If the target element is to the right of the parent elm
                        l + VISIBLE_PADDING > p.offsetWidth + p.scrollLeft ||
                        //-- If the target element is to the left of the parent elm
                        l + w - VISIBLE_PADDING < p.scrollLeft ||
                        //-- If the target element is under the parent elm
                        t + VISIBLE_PADDING > p.offsetHeight + p.scrollTop ||
                        //-- If the target element is above the parent elm
                        t + h - VISIBLE_PADDING < p.scrollTop
                        ) {
                    //-- Our target element is out of bounds:
                    return false;
                }
            }
            //-- Add the offset parent's left/top coords to our element's offset:
            if (el.offsetParent === p) {
                l += p.offsetLeft;
                t += p.offsetTop;
            }
            //-- Let's recursively check upwards:
            return _isVisible(p, t, r, b, l, w, h);
        }
        return true;
    }

    //-- Cross browser method to get style properties:
    function _getStyle(el, property) {
        if (window.getComputedStyle) {
            return document.defaultView.getComputedStyle(el, null)[property];
        }
        if (el.currentStyle) {
            return el.currentStyle[property];
        }
    }

    function _elementInDocument(element) {
        while (element = element.parentNode) {
            if (element == document) {
                return true;
            }
        }
        return false;
    }

    return _isVisible(this);

};