///////////////////////////////////////////////////////////////////////////////
//EVENTS PLUGINS

var touchstart = ('ontouchstart' in document.documentElement ? "touchstart" : "touchstart mousedown");
var touchmove = ('ontouchmove' in document.documentElement ? "touchmove" : "touchmove mousemove");
var touchend = ('ontouchend' in document.documentElement ? "touchend" : "touchend mouseup");

console.log(touchstart);

//jQuery
(function ($) { //unify touchstart and mousedown to prevent double events

    $.fn.touchstart = function (event) {
        if ('ontouchstart' in document.documentElement) {
            this.bind("touchstart", function (e) {
                event.call(this, e);
            });
        } else { //if not touch
            this.bind("mousedown", function (e) {
                event.call(this, e);
            });
        }
        return this;
    };
})(jQuery);

//?
$('input').bind('focus', function () {
    $(window).scrollTop(10);
    var keyboard_shown = $(window).scrollTop() > 0;
    $(window).scrollTop(0);

    $('body').prepend(keyboard_shown ? 'keyboard ' : 'nokeyboard ');
});

$(window).resize(function () {
    SMLTOWN.Transform.windowResize();
    SMLTOWN.Transform.gameResize();
});

SMLTOWN.Events = {
    //ADMIN CARDS EVENTS //////////////////////////////////////////////////////
    cards: function () {
        var tapped = false;
        var mousedown = false;
        var card = null;

        $(".smltown_rulesCard").touchstart(function () {
            if (!SMLTOWN.user.admin) {
                return;
            }
            var $this = $(this);
            if (card != $(this).attr("smltown_card")) {
                tapped = false;
                card = $(this).attr("smltown_card");
            }
            if (!tapped) { //if tap is not set, set up single tap
                mousedown = true;
                tapped = setTimeout(function () {
                    tapped = null; //insert things you want to do when single tapped
                }, 300);   //wait then run single click code
                mousedown = setTimeout(function () {
                    // TAPHOLD//////////////////////////////////////////////
                    if (!mousedown || $this.hasClass("smltown_cardOut")) {
                        return false;
                    }
                    if (SMLTOWN.Game.playing()) {
                        SMLTOWN.Message.flash("cannot modify cards in game");
                        return;
                    }

                    $this.find("input").show();
                    $this.find("input").focus();
                    $this.find("span").hide();
                }, 600);   //wait then run single click code
                return;
            }

            // DOUBLE TAP (tapped within 300ms of last tap)/////////////////
            if (SMLTOWN.Game.playing()) {
                SMLTOWN.Message.flash("cannot toggle cards in game");
                return;
            }
            clearTimeout(tapped); //stop single tap callback
            tapped = null;
            $(this).toggleClass("smltown_cardOut"); //insert things you want to do when double tapped

            var cards = SMLTOWN.Game.info.cards;
            if ("object" != typeof cards) {
                cards = {};
            }
            if ($(this).hasClass("smltown_cardOut")) {
                var cardName = $(this).attr("smltown_card");
                delete cards[cardName];
            } else {
                cards[$(this).attr("smltown_card")] = 0;
            }
            SMLTOWN.Server.request.saveCards(cards);

        }).on("mouseup", function () {
            mousedown = false;

        }).bind("taphold", function (e) {
            e.preventDefault();
            return false;

        }).on("focusout", function () { //input number
            var cards = SMLTOWN.Game.info.cards;
            var card = $(this).attr("smltown_card");

            if (!$(this).find("input").val()) {
                $(this).find("span").show();
                $(this).find("input").hide();
                if (card) {
                    cards[card] = 0;
                    SMLTOWN.Server.request.saveCards(cards);
                }
            } else { //int value
                var val = $(this).find("input").val();
                if (val != cards[card]) {
                    cards[card] = val;
                    SMLTOWN.Server.request.saveCards(cards);
                }
            }
        });

        $(".smltown_rulesCard form").submit(function () {
            $(this).find("input").blur();
            return false;
        });

        //plain user events
        $(".smltown_rulesCard").on("tap", function () {
            var $this = $(this);
            setTimeout(function () { //w8 documents events
                $(document).one("tap", function () {
                    $this.removeClass("smltown_selectedRulesCard");
                    $("#smltown_infoSelectedCard").remove();
                });
                $this.addClass("smltown_selectedRulesCard");
                $("#smltown_body").append("<div id='smltown_infoSelectedCard'>"
                        + SMLTOWN.cards[$this.attr("smltown_card")].name
                        + "<p>" + SMLTOWN.cards[$this.attr("smltown_card")].rules + "</p>");
            }, 1);
        });
    }
    ,
    //GAME EVENTS //////////////////////////////////////////////////////////////
    game: function () { //1 time load
        var $this = this;

        this.menuEvents();

        //SWIPES ACTIONS GAME
        $("#smltown_menuIcon").on("click", function () {
            $this.swipeRight();
        });
        $("#smltown_cardIcon").on("click", function () {
            $this.swipeLeft();
        });

        // "> div" resolve some swipe bugs! and without duplications
        $("#smltown_game").on("swiperight", function (e) {
            e.preventDefault();
            $this.swipeRight();
        });
        $("#smltown_game").on("swipeleft", function (e) {
            e.preventDefault();
            $this.swipeLeft();
        });

        // ANY setTimeout for Android 2.3 focus !
        $("#smltown_console").on("mouseup", function (e) {
            if ($(e.target).attr("id") == "smltown_chatInput") {
                return;
            }
//            setTimeout(function () {
            $('#smltown_console').toggleClass("smltown_consoleExtended");
            if ($("#smltown_console").hasClass("smltown_consoleExtended")) {
                $("#smltown_chatInput").focus();
            }
            SMLTOWN.Transform.chatUpdate();
//            }, 300);
        });

        $("#smltown_chatInput").on("focusout", function () {
            if ($("#smltown_console").hasClass("smltown_consoleExtended")) {
                return;
            }
            SMLTOWN.Transform.chatUpdate();
        });

        $("#smltown_chatForm").submit(function () {
            $("#smltown_console").trigger("mouseup");
            $('#smltown_chatInput').blur(); //?
            var text = $('#smltown_chatInput').val();
            if (text.length) {
                SMLTOWN.Message.addChat(text, SMLTOWN.user.id);
                SMLTOWN.Server.request.chat(text);
            }
            SMLTOWN.Transform.chatFocusOut();
            return false;
        });



        //GAME SCROLLS (only touch device) ////////////////////////////////////////
        this.touchScroll($("#smltown_list"), "top");
        this.touchScroll($("#smltown_menu > div"), "top");
        this.touchScroll($("#smltown_consoleText > div"), "bottom");

        //ONLY COMPUTER EVENTS ////////////////////////////////////////////////////
        $("#smltown_list").scroll(function () {
            SMLTOWN.Transform.updateHeader();
        });

        //TAP MENUS
        $("#smltown_card").on("tap", function () {
            if ($("#smltown_card > div").hasClass("smltown_rotate")) {
                SMLTOWN.Transform.cardRotateSwipe();
            } else {
                $("#smltown_card > div").addClass("smltown_rotate");
            }
        });

        $("#smltown_menu").on("tap", function (e) {
            if ($(e.target).attr("id") == "smltown_menu") {
                e.preventDefault(); //prevent background clicks
                $(this).removeClass("smltown_visible");
            }
        });

        $("#smltown_help").on("tap", function () {
            $("#smltown_helpMessage").remove();
            var message = $("<div id='smltown_helpMessage'>");
            var tour = $("<div class='smltown_tour'>tour</div>");
            tour.click(function () {
                SMLTOWN.Add.nextHelp(0);
            });
            message.html("<div class='smltown_text'></div>").append(tour);
            $("#smltown_body").append(message);
            SMLTOWN.Add.help();
            $(document).one("tap", function (e) {
                e.preventDefault();
                message.remove();
            });
        });
    }
    ,
    swipeRight: function () {
        if ($("#smltown_card").hasClass("smltown_visible")) {
            SMLTOWN.Transform.cardSwipeRotate();
        } else if ($("#smltown_menu").hasClass("smltown_swipe")) {
            $("#smltown_menu").addClass("smltown_visible");
        }
    }
    ,
    swipeLeft: function () {
        if ($("#smltown_menu").hasClass("smltown_visible")) {
            $("#smltown_menu").removeClass("smltown_visible");
        } else {
            if (!SMLTOWN.user.card) {
                SMLTOWN.Message.flash("noCard");
            }
            else if ($("#smltown_card").hasClass("smltown_swipe")) {
                $("#smltown_card").addClass("smltown_visible");
            }
        }
    }
    ,
    //ALL SCROLLS GAME
    touchScroll: function (div, side) { //side: top or bottom        
        var element = div.attr("id");
        //android 2.3 bug on height content div
        var $this = div.find(">div");

        if ($this.css("transform") == "none") {
            $this.css("transform", "translateY(0px)");
        }

        var finalPosition, x, y, pageX, pageY, originScrollY, position, moved;
        var divHeight = div.height(); //can't change, update on widnow transform

        //let night scroll etc..
        if ("smltown_list" == element) {
            div = $("#smltown_body"); //global scroll events
        }

        div.off("touchstart");
        div.on("touchstart", function (e) { //necessary top != auto

            position = null; //reset final position to prevent calculations 
            var maxScroll = divHeight - $this.height(); //see bottom list
            //console.log(element + " , " + maxScroll)

            //not scrolling
            if (maxScroll > -10) {
                //console.log("not scroll " + element);
                $this.css("transform", "translateY(0px)"); //important
                return;
            }

            pageX = e.originalEvent.touches[0].pageX;
            pageY = e.originalEvent.touches[0].pageY;
            var Y = parseInt($this.css('transform').split(',')[5]);
            originScrollY = Y - pageY;

            $(this).on("touchmove", function (e) {
                e.preventDefault(); //faster (test on 2.3 android)    
                moved = true;

                //limit scroll
                y = e.originalEvent.touches[0].pageY;

                if ("smltown_console" != element) { //prevent scroll on swipe
                    x = e.originalEvent.touches[0].pageX;
                    if (Math.abs(y - pageY) < 2 * Math.abs(x - pageX)) {
                        console.log(99)
                        return;
                    }
                }

                //scroll
                finalPosition = originScrollY + y;
                //console.log(finalPosition + " , " + $this.height())
                if (side == "top") {
                    if (finalPosition > 0) {
                        finalPosition = 10;
                    } else if (finalPosition < maxScroll) {
                        finalPosition = maxScroll - 10;
                    }
                } else { //bottom
                    if (finalPosition < 0) {
                        finalPosition = -10;
                    } else if (finalPosition > -maxScroll) {
                        finalPosition = -maxScroll + 10;
                    }
                }

                if ("smltown_list" == element && finalPosition > maxScroll) { //not at bottom
                    clearTimeout(SMLTOWN.Events.consoleTimeout);
                    $("#smltown_game").addClass("smltown_reduced");
                }

                //prevent extra calculations
                if (position == finalPosition) {
                    return;
                }

                position = finalPosition;
                $this.css("transform", "translateY(" + finalPosition + "px)");

                //common events
                if ("smltown_list" == element) {
                    SMLTOWN.Transform.updateHeader();
                }

            }).one("touchend", function () {
                $(this).off("touchmove");
                if (!moved) {
                    return;
                }

                if (side == "top") {
                    if (finalPosition > 0) {
                        $this.css("transform", "translateY(2px)");
                    } else if (finalPosition < maxScroll) { //bottom scroll
                        $(this).trigger("scrollBottom"); //for games list
                        $this.css({
                            transform: "translateY(" + (maxScroll) + "px)"
                        });
                    }
                } else {
                    if (finalPosition < 0) {
                        $this.css("transform", "translateY(0px)");
                    } else if (finalPosition > -maxScroll) {
                        $this.css("transform", "translateY(" + (-maxScroll) + "px)");
                    }
                }

                if ("smltown_list" == element) {
                    $this.consoleTimeout = setTimeout(function () { //let some time to continue scroling
                        $("#smltown_game").removeClass("smltown_reduced");
                    }, 800);

                } else if ("smltown_menu" == element) {
                    if ($(this).height() - $this.height() > 0) {//client see bottom list                        
                        $this.css("transform", "translateY(0px)");
                    }
                }
            });
        });
    }
    ,
    //MENU EVENTS ////////////////////////////////////////////////////////////
    menuEvents: function () {
        //ON GAME
        this.menuInput("password", function (val) {
            SMLTOWN.Server.request.setPassword(val);
        }, true); //can be empty

        this.menuInput("dayTime", function (val) {
            SMLTOWN.Server.request.setDayTime(val);
        });

        $("#smltown_openVoting input").change(function () {
            var checked = $(this).is(':checked');
            SMLTOWN.Server.request.setOpenVoting(checked ? 1 : 0);
        });

        $("#smltown_endTurn input").change(function () {
            var checked = $(this).is(':checked');
            SMLTOWN.Server.request.setEndTurnRule(checked ? 1 : 0);
        });

        //ON USER SETTINGS
        this.menuInput("updateName", function (val) {
            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].name == val) {
                    SMLTOWN.Message.flash("duplicatedName");
                    return;
                }
            }
            SMLTOWN.Server.request.setName(val);
            SMLTOWN.Message.flash("name saved");
        });

        $("#smltown_cleanErrors").on("touchend mouseup", function () {
            if ($(this).hasClass("active")) {
                SMLTOWN.Load.cleanGameErrors();
            }
        });

        if (document.location.hostname == "localhost") {
            var becomeAdmin = $("<div id='smltown_becomeAdmin'><span>BecomeAdmin</span></div>")
            $("#smltown_updateName").after(becomeAdmin);
            becomeAdmin.on("tap", function () {
                SMLTOWN.Server.request.becomeAdmin();
            });
        }

        //ON BACK BUTTON
        $("#smltown_backButton").click(function () {
            SMLTOWN.Load.back();
        });

        // MENU NAVIGATION EVENTS
        $("#smltown_startButton").on("tap", function () {
            SMLTOWN.user.sleeping = true;
            SMLTOWN.Server.request.startGame();
        });

        $("#smltown_restartButton").on("tap", function () {
            SMLTOWN.Server.request.restartGame();
        });

        $("#smltown_endTurnButton").on("tap", function () {
            SMLTOWN.Server.request.endTurn();
        });

        //BY KIND
        $(".smltown_action").on("tap", function () {
            $(".smltown_visible").removeClass("smltown_visible");
            SMLTOWN.Transform.removeAuto($("#smltown_menu .smltown_auto"));
        });

        // ( all this starts cose a IE bug on :active when click text (and android 2.3) )
        var node;
        $("#smltown_menu .smltown_selector > div").touchstart(function () {
            node = this.nodeValue;
            var selector = this;
            $(selector).addClass("active");

            $(document).on("touchmove.menu mousemove.menu", function (event) {
                var eventDiv = document.elementFromPoint(event.clientX, event.clientY);
                var div = $(eventDiv).closest('div')[0];
                if (eventDiv != selector && div != selector) {
                    $(document).off("touchmove.menu mousemove.menu");
                    $(selector).removeClass("active");
                }
            });
        }).on("mouseup", function (event) {
            //visuals
            $(document).off("touchmove.menu mousemove.menu");
            var $this = $(this);
            setTimeout(function () {
                $this.removeClass("active");
            }, 1);

            //events
            var eventTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (!$(eventTarget).is("div")) {
                eventTarget = $(eventTarget).closest("div")[0];
            }
            if (eventTarget.nodeValue != node) { //prevent close menu if not tap //this slows down 2.3 android
                return;
            }

            if ($(this).hasClass("input")) { // INPUT
                $(this).find("input").focus();
                var textInput = $(this).find("input[type=text]");
                if (textInput.length > 0) {
                    textInput[0].setSelectionRange(8, 8); //number of characters *2
                }
                var checkBoxes = $(this).find("input[type=checkbox]");
                if (checkBoxes) {
                    checkBoxes.prop("checked", !checkBoxes.prop("checked")).change(); //change event fire
                }
                return false; //prevent focusout
            }

            var div = $(this);
            var animation = function () {
                //undefined function
            };
            if ($(this).hasClass("smltown_falseSelector")) { //if is cards
                div = $(this).parent();
                animation = SMLTOWN.Transform.animateAuto; //utils function
            } else if ($(this).is(':first-child')) { //if is selector
                div = $(this).parent();
                animation = SMLTOWN.Transform.animateButtons; //utils function
            } else if (!$(this).hasClass("smltown_action") && !$(this).hasClass("smltown_input")) { //selected
                animation = SMLTOWN.Transform.animateAuto; //utils function
            }

            if (div.hasClass("smltown_auto")) { //remove auto
                if (div.hasClass("text")) {
                    SMLTOWN.Transform.removeAuto(div.find(".smltown_auto")); //prevent card selector close
                } else {
                    SMLTOWN.Transform.removeAuto(div);
                }
                //return menu at original top position
                $("#smltown_menuContent > div").css("transform", "translateY(0)");

            } else { //add auto (expand)
                var parent = div.parent();
                parent.not("#smltown_menu > div").css("height", "auto");
                animation(div, function (height) {
                    if (height > SMLTOWN.Transform.contentHeights.menuContent) {
                        console.log("translateY(" + -div.position().top + ")");
                        $("#smltown_menuContent > div").css("transform", "translateY(" + -div.position().top + "px)");
                    }
                }); //div auto height
                SMLTOWN.Transform.removeAuto($("#smltown_menu .smltown_auto").not(parent));
                div.addClass("smltown_auto");
            }

        });
    }
    ,
    menuInput: function (id, callback, empty) { //menu cell with input
        var value = $("#smltown_" + id + " input").val();
        $("#smltown_" + id + " input").attr("original", value);
        $("#smltown_" + id + " form").submit(function () {
            var input = $(this).find("input");
            if (input.is(":focus")) {
                input.blur();
            }
            return false;
        });
        $("#smltown_" + id + " input").on('blur', function () {
            var original = $(this).attr("original");
            var val = $(this).val();
            if (val === original) {
                return;
            }
            if (!empty) {
                if (!val) {
                    return;
                }
                $(this).val("");
                $(this).attr("placeholder", val);
            }
            callback(val);
        });
    }
    ,
    // SET SELECT EVENTS TO 1 PLAYER
    playerEvents: function (player) {
        //set CHECKABLES players
        var id = player.id;
        player.div.on("tap", function () {
            SMLTOWN.Action.playerSelect(id);
        });
    }
};
