
SMLTOWN.Help = {
    help: function () {
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
            var cardName = SMLTOWN.cards[card].name;
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
                SMLTOWN.Message.flash("error_tutorialPlayers");
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
        var $this = this;
        var helpStop = $("<div id=helpStop>");
        helpStop.smltown_text("helpStop");

        helpStop.on("tap", function () {
            $this.stop();
        });

        $("#smltown_html > div").append(helpStop);
        $("#smltown_html > div").css("pointer-events", "none");
        this.nextHelp();
    }
    ,
    done: function () {
        this.stop();
        SMLTOWN.Message.notify("tutorialDone");
    }
    ,
    stop: function () {
        $("#helpStop").remove();
        $("#smltown_helpFilter").remove();
        $("#smltown_html > div").css("pointer-events", "auto");
        clearInterval(this.helperCheckInterval);
        clearInterval(this.helpMoveInterval);
        clearInterval(this.eventInterval);
    }
    ,
    helperPosition: 0
    ,
    helps: null
    ,
    //popup location, text, event target, wait query event (if == false, check visibility)
    helpGameList: [
        //nombre partida
        ["#smltown_nameGame", "help_typeNameGame", "#smltown_nameGame"]
                ,
        //entrar en partida
        ["#smltown_newGame", "help_createGame", "#smltown_newGame", "#smltown_newGame:not(.smltown_disable)"]
    ]
    ,
    helpGame: [
        //crear partida
        //menu
        ["#smltown_menuIcon", "help_newGameMenuIcon", "#smltown_menuIcon", "#smltown_menuIcon:visible"] //first helper w8 visible
                ,
        //admin click
        ["#smltown_adminMenu", "help_newGameAdminMenu", "#smltown_adminMenu", false]
                ,
        //repartir cartas
        ["#smltown_restartButton", "help_newCards", "#smltown_restartButton", false]
                ,
        //w8
        [null, "help_waitCardShuffle"]
                ,
        //ver carta back
        ["#smltown_cardIcon", "help_cardIcon", "#smltown_cardIcon"]
                ,
        //click carta
        [null, "help_cardShow", "#smltown_card"]
                ,
        //ocultar carta
        [null, "help_cardHide", "#smltown_card"]
                ,
        //menu again
        ["#smltown_menuIcon", "help_startGameMenuIcon", "#smltown_menuIcon"]
                ,
        //admin click
        ["#smltown_adminMenu", "help_startGameAdminMenu", "#smltown_adminMenu", false]
                ,
        //start game
        ["#smltown_startButton", "help_startGame", "#smltown_startButton", false]
                ,
        //w8
        [null, "help_waitStartGame"]
                ,
        //empezara pronto
        ["#smltown_popup", "help_popupStartGame", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //INICIO LOOP /////////////////////////////////////////////////////
        //espera a que vibre
        [null, "help_waitVibration"]
                ,
        //despierta
        ["#smltown_popup", "help_popup1stWakeup", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //select victim
        ["#smltown_listAlive", "help_select1stNightVictim", "#smltown_listAlive"]
                ,
        //re-select
        [".smltown_preselect", "help_reselect1stNightVictim", ".smltown_preselect"]
                ,
        //devorado
        ["#smltown_popup", "help_popup1stKilled", "#smltown_popupOk", "#smltown_popup:visible"]
//                ,
//        //espera al resto de jugadores
//        [null, "espera al resto de jugadores"]
                ,
        //ha sido asesinado
        ["#smltown_popup", "help_popup1stWasKilled", "#smltown_popupOk", "#smltown_popup:visible"]
//                ,
//        //menu
//        ["#smltown_menuIcon", "help_sun", "#smltown_menuIcon"]
                ,
        //menu
        ["#smltown_menuIcon", "help_endTurnMenuIcon", "#smltown_menuIcon"]
                ,
        //admin
        ["#smltown_adminMenu", "help_endTurnAdminMenu", "#smltown_adminMenu", false]
                ,
        //acabar turno
        ["#smltown_endTurnButton", "help_endTurn", "#smltown_endTurnButton", false]
                ,
        //linchamiento
        ["#smltown_popup", "help_popupLinch", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //select victim
        ["#smltown_listAlive", "help_select1stDayVictim", "#smltown_listAlive"]
                ,
        //re-select
        [".smltown_preselect", "help_reselect1stDayVictim", ".smltown_preselect"]
                ,
        //ha sido linchado
        ["#smltown_popup", "help_popup1stDayVictim", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //RE - LOOP /////////////////////////////////////////////////////
        //despierta
        ["#smltown_popup", "help_popup2ndWakeUp", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //select victim
        ["#smltown_listAlive", "help_select2ndNightVictim", "#smltown_listAlive"]
                ,
        //re-select
        [".smltown_preselect", "help_reselect2ndNightVictim", ".smltown_preselect"]
                ,
        //devorado
        ["#smltown_popup", "help_popup2ndKilled", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
//        //espera al resto de jugadores
//        [null, "espera al resto de jugadores"]
//                ,
        //ha sido asesinado
        ["#smltown_popup", "help_popup2ndWasKilled", "#smltown_popupOk", "#smltown_popup:visible"]
                ,
        //COMPARTE
        ["#smltown_win > div", "help_popupShare", "#smltown_win .smltown_footer div", "#smltown_win:visible"]
//                ,
//        //ha finalizado la partida
//        ["#smltown_popup", "ha finalizado la partida", "#smltown_popupOk", "#smltown_popup:visible"]
    ]
    ,
    nextHelp: function () {
        var $this = this;
        clearInterval(this.helperCheckInterval);
        clearInterval(this.helpMoveInterval);
        console.log("helperPosition = " + this.helperPosition);
        if (this.helperPosition < 0) {
            this.helperPosition = 0;
        }

        $("#smltown_helpFilter").remove();

        //if helper ends
        var help = this.helps[this.helperPosition];
        if (!help) {
            if (this.helps == this.helpGameList) {
                clearInterval(this.startGameInterval);
                this.startGameInterval = setInterval(function () {
                    if ($("#smltown_game").length) {
                        clearInterval($this.startGameInterval);
                        $this.helps = $this.helpGame;
                        $this.helperPosition = 0;
                        $this.start();
                    }
                }, 1000);
                return;
            }
            
            //tutorial done
            this.done();
            return;
        }

        var target = null;
        if (help.length > 2) {
            target = help[2];
        }
        var action = null;
        if (help.length > 3) {
            action = help[3];
        }

        this.locateHelper(help[0], help[1], target, help[3]);
    }
    ,
    locateHelper: function (queryDiv, value, target, event) {
        var $this = this;
        var help = $("<div class='smltown_helpDiv'>");
        var helpContainer = $("<div id='smltown_helpFilter'>");
        helpContainer.append(help);

        var text = SMLTOWN.Message.translate(value);
        text = text.replace(/\. /g, '.<br/><br/>').replace(/! /g, '.<br/><br/>');

        help.html(text);

        if (event) {
            console.log("event");
            clearInterval($this.eventInterval);
            //w8 condition done
            $this.eventInterval = setInterval(function () {
                console.log(event);
                if ($(event).length) {
                    clearInterval($this.eventInterval);

                    $("#smltown_helpFilter").remove();
                    $("#smltown_html > div").append(helpContainer);
                    $this.placeHelper(queryDiv);

                    $this.targetEvent(target, help);
                }
            }, 500);
            //
        } else {
            $("#smltown_helpFilter").remove();
            $("#smltown_html > div").append(helpContainer);
            this.placeHelper(queryDiv, function () {
                if (false == event && queryDiv) {
                    $this.checkVisiblity(queryDiv, help);
                }
            });
            $this.targetEvent(target, help);
        }
    }
    ,
    targetEvent: function (target, help) {
        var $this = this;

        if (target) {
            $("*").off(".help");
            var canClick = true;
            $(".smltown_userSelectable").removeClass("smltown_userSelectable");
            $(target).addClass("smltown_userSelectable")
                    .on("tap.help", function () {
                        if (!canClick) {
                            return;
                        }
                        canClick = false;
                        setTimeout(function () {
                            canClick = true;
                        }, 500);

                        $("#smltown_helpFilter").remove();
                        console.log("CLICK TARGET");
                        $this.helperPosition++;
                        $this.nextHelp();
                    });
            //
        } else {
            $("#smltown_helpFilter").addClass("smltown_filter");
            var button = $("<button>");
            button.text("ok");
            button.on("tap", function () {
                $("#smltown_helpFilter").remove();
                $this.helperPosition++;
                $this.nextHelp();
            });
            help.append(button);
        }
    }
    ,
    placeHelper: function (queryDiv, callback) {
        var $this = this;

        var pos = null;
        if (queryDiv) {
            pos = $(queryDiv).offset();
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

        var help = $(".smltown_helpDiv");

        if (!pos) {
            help.addClass("smltown_center");
            return;
        }

        var height = $("#smltown_html").height();
        var width = $("#smltown_html").width();

        var x = pos.left;
        var y = pos.top;
        var divWidth = $(queryDiv).outerWidth();
        var divHeight = $(queryDiv).outerHeight();

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

    }
    ,
    //color advice div
    divAd: function (queryDiv) {
        //console.log(queryDiv);
        $(".smltown_helpAd").remove();
        var ad = $("<div class='smltown_helpAd'>");
        var div = $(queryDiv);
        var pos = div.offset();
        ad.css({
            left: pos.left,
            top: pos.top,
            width: div.outerWidth(),
            height: div.outerHeight()
        });
        $("#smltown_helpFilter").append(ad);
    }
    ,
    checkVisiblity: function (queryDiv) {
        var $this = this;
        clearInterval(this.helperCheckInterval);

        //check visible position
        this.helperCheckInterval = setInterval(function () {
            $this.placeHelper(queryDiv);

            var pos = $(queryDiv).offset();

            if ("undefined" == typeof pos) {
                return;
            }

            var x = pos.left;
            var y = pos.top;

            var height = $("#smltown_html").outerHeight();
            var width = $("#smltown_html").outerWidth();

            var hidden = false;
            if (x < 0 - 30
                    || x > width + 30
                    || y < 0 - 30
                    || y > height + 30) {
                hidden = true;
            }

            if (queryDiv) {
                var div = $(queryDiv)[0];
                if (!div.isVisible()) {
                    hidden = true;
                }
            }

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