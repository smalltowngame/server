///////////////////////////////////////////////////////////////////////////////
//EVENTS PLUGINS

//Modernizr
if (Modernizr.touch) {
    $("#smltown_html").addClass("smltown_touch");
    SMLTOWN.touch = true;
    console.log("TOUCH");
} else {
    $("#smltown_html").addClass("smltown_mouse");
}

var touchstart = ('ontouchstart' in document.documentElement ? "touchstart" : "touchstart mousedown");
var touchmove = ('ontouchmove' in document.documentElement ? "touchmove" : "touchmove mousemove");
var touchend = ('ontouchend' in document.documentElement ? "touchend" : "touchend mouseup");

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
//$('input').bind('focus', function() {
//    $(window).scrollTop(10);
//    var keyboard_shown = $(window).scrollTop() > 0;
//    $(window).scrollTop(0);
//
//    $('body').prepend(keyboard_shown ? 'keyboard ' : 'nokeyboard ');
//});

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
                        SMLTOWN.Message.flash("_cannotModifyCardsInGame");
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
                SMLTOWN.Message.flash("_cannotCardsGame");
                return;
            }
            if (SMLTOWN.user.admin < 1) {
                SMLTOWN.Message.flash("_cannotCardsAdmin");
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
                        + SMLTOWN.cards[$this.attr("smltown_card")].lang.name
                        + "<p>" + SMLTOWN.cards[$this.attr("smltown_card")].lang.rules + "</p>");
            }, 1);
        });
    }
    ,
    //GAME EVENTS //////////////////////////////////////////////////////////////
    game: function () { //1 time load
        var $this = this;
        this.menuEvents();

        //SWIPES ACTIONS GAME
        $("#smltown_menuIcon").on("tap", function () {
            $this.swipeRight();
        });
        $("#smltown_cardIcon").on("tap", function () {
            $this.swipeLeft();
        });

        $("#smltown_game")
                //SWIPE RIGHT
                .on("swiperight", function (e) {
                    if ($(e.target).parents("#smltown_chatForm").length) {
                        return;
                    }
                    e.preventDefault();
                    $this.swipeRight();
                })
                //SWIPE LEFT
                .on("swipeleft", function (e) {
                    if ($(e.target).parents("#smltown_chatForm").length) {
                        return;
                    }
                    e.preventDefault();
                    $this.swipeLeft();
                })
                //CLICK anywhere to unselect player
                .on("tap", function (e) {
                    var preselect = $(".smltown_preselect");
                    if (preselect.length
                            && !$(e.target).parents(".smltown_player").length
                            && !$(e.target).hasClass("smltown_player")) {
                        preselect.removeClass("smltown_preselect");
                    }
                });

        // ANY setTimeout for Android 2.3 focus !
        $("#smltown_console").on("mouseup", function (e) {
            if ($(e.target).attr("id") == "smltown_chatForm" || $(e.target).parents('#smltown_chatForm').length > 0
                    || $(e.target).is(":button") || $(e.target).hasClass("smltown_button")) {
                return;
            }
//            setTimeout(function () {
            $('#smltown_console').toggleClass("smltown_consoleExtended");
            if ($("#smltown_console").hasClass("smltown_consoleExtended")) {
                $("#smltown_chatInput").focus();
//                $(".emoji-wysiwyg-editor").focus();
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

        //enter press
        $("#smltown_chatForm").keypress(function (e) {
            if (e.which == 13) {
                //let enters
                if (e.shiftKey) {
                    this.value += "\n";
                } else {
                    $("#smltown_chatForm").submit();
                }
            }
        });

        //esc press
        $(document).keyup(function (e) {
            if (e.which == 27) {
                SMLTOWN.Message.removeNotification(true);
            }
        });

        //input height change
        $("#smltown_chatForm").change(function () {
            SMLTOWN.Transform.chatUpdate();
        });

        $("#smltown_chatForm").submit(function () {
            $("#smltown_console").trigger("mouseup");
            var text = $('#smltown_chatInput').val();

            //if some text
            if (text.trim().length) {
                SMLTOWN.Message.addChat(text, SMLTOWN.user.id);
                SMLTOWN.Server.request.chat(text);
            }

            $('#smltown_chatInput').val("");
            $(".emoji-wysiwyg-editor").html("");
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
            var closeId = "smltown_menu";
            if ($("#smltown_menuContent").hasClass("smltown_removeMenuMargin")) {
                closeId = "smltown_menuAll";
            }
            if ($(e.target).attr("id") == "smltown_menuAll") {
                e.preventDefault(); //prevent background clicks
                SMLTOWN.Transform.removeAuto($("#smltown_menu .smltown_auto"));
            }
            if ($(e.target).attr("id") == closeId) {
                e.preventDefault(); //prevent background clicks
                $(this).removeClass("smltown_visible");
            }
        });

        $("#smltown_help").on("tap", function () {
            $("#smltown_helpMessage").remove();
            var message = $("<div id='smltown_helpMessage'>");
            var tour = $("<div class='smltown_tour'>tour</div>");
            tour.on("tap", function () {
                SMLTOWN.Help.tour();
            });
            message.html("<div class='smltown_text'></div>").append(tour);
            $("#smltown_body").append(message);
            SMLTOWN.Help.help();
            $(document).one("tap", function (e) {
                e.preventDefault();
                message.remove();
            });
        });

        //FRIENDS
        $("#smltown_friendsFooter > div").on("tap", function () {
            $("#smltown_friendSelector").hide();
        });

        $("#smltown_addFriend").on("tap", function () {
            var socialId = $("#smltown_pictureContextMenu").attr("socialId");
            if (!socialId) {
                SMLTOWN.Message.flash("_missingSocialId");
                return;
            }
            SMLTOWN.Server.request.addFriend(socialId);
            SMLTOWN.Message.flash("_friendAdded");
            $("#smltown_pictureContextMenu").hide();
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
                SMLTOWN.Message.flash("_noCard");
            }
            else if ($("#smltown_card").hasClass("smltown_swipe")) {
                $("#smltown_card").addClass("smltown_visible");
            }
        }
    }
    ,
    //ALL VERTICAL SCROLLS GAME
    touchScroll: function (div, side) { //side: top or bottom        
        var element = div.attr("id");
        var $this = div.find(" > div");

        if ($this.css("transform") == "none") {
            $this.css("transform", "translateY(0px)");
        }

        var finalPosition, x, y, pageX, pageY, originScrollY, position, moved;
        var gameContent = $("#smltown_game");

        div.off("touchstart");
        div.on("touchstart", function (e) { //necessary top != auto

            position = null; //reset final position to prevent calculations 
            var thisHeight = 0;
            $this.each(function () {
                thisHeight += $(this).height();
            });
            var maxScroll = div.height() - thisHeight; //if u see bottom list

            //not scrolling
            if (maxScroll > -10) {
                console.log("preventing vertical scroll on " + element);
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
                    gameContent.addClass("smltown_reduced");
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
                        gameContent.removeClass("smltown_reduced");
                    }, 1000);

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
        console.log($("#smltown_menuAll").length)
        var _this = this;
        
        //ON GAME
        this.menuInput("password", function (val) {
            SMLTOWN.Server.request.setPassword(val);
        }, true); //can be empty

        $("#smltown_gamePublic input").change(function () {
            var checked = $(this).is(':checked');
            SMLTOWN.Server.request.setPublicGameRule(checked ? 1 : 0);
        });

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

        $("#smltown_endTurnButton").on("tap", function () {
            SMLTOWN.Server.request.endTurn();
        });

        //ON USER SETTINGS
        this.menuInput("updateName", function (val) {
            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].name == val) {
                    SMLTOWN.Message.flash("_duplicatedUserName");
                    return;
                }
            }
            SMLTOWN.Server.request.setName(val);
            SMLTOWN.Message.flash("_savedName");
        });

        $("#smltown_updateImage").on("tap", function () {
            var input = $("<input type='file' accept='image/*'>");
            input.trigger("tap");
            input.change(function (e) {
                var file = this.files[0];
                var reader = new FileReader();
                reader.onload = function (event) {
                    var data = event.target.result;
                    SMLTOWN.Social.setPicture(data);
                };
                //fire
                reader.readAsDataURL(file);
            });
        });

        $("#smltown_spectatorMode").on("tap", function () {
            SMLTOWN.Server.request.spectatorMode();
        });

        $("#smltown_cleanErrors").on("tap", function () {
            if ($(this).hasClass("active")) {
                SMLTOWN.Load.cleanGameErrors();
            }
        });

        //NOTES
        $("#smltown_notesMenu").on("tap", function (e) {
            //
        });

        $("#smltown_notes textarea").on("keyup", function () {
            localStorage.setItem("notes" + SMLTOWN.Game.info.id, $(this).val());
            $(this).css('height', "5px");
            $(this).css('height', this.scrollHeight + "px");
        });

        //ON FRIENDS
        $("#smltown_showFriends").on("tap", function () {
            SMLTOWN.Social.showFriends();
        });
        $("#smltown_addSocialId").on("tap", function () {
            SMLTOWN.Social.addSocialId();
        });
        if (SMLTOWN.user.socialId) {
            $("#smltown_addSocialId span").smltown_text("EditSocialId");
        }

        if (document.location.hostname == "localhost") {
            var becomeAdmin = $("<div id='smltown_becomeAdmin'><span>BecomeAdmin</span></div>")
            $("#smltown_updateName").after(becomeAdmin);
            becomeAdmin.on("tap", function () {
                console.log("become admin")
                SMLTOWN.Server.request.becomeAdmin();
            });
        }

        //ON BACK BUTTON
        $("#smltown_backButton").on("tap", function () {
            SMLTOWN.Load.back();
        });

        // MENU NAVIGATION EVENTS
        $("#smltown_startButton").on("tap", function () {
            SMLTOWN.user.sleeping = true;
            if ($(".smltown_spectator").length) {
                SMLTOWN.Message.notify("_someSpectator", function () {
                    SMLTOWN.Server.request.startGame();
                }, true);
                return;
            }
            SMLTOWN.Server.request.startGame();
        });

        $("#smltown_restartButton").on("tap", function () {
            //ask
            if (SMLTOWN.user.card) {
                SMLTOWN.Message.notify("_restartGameQuestion", function () {
                    SMLTOWN.Server.request.restartGame();
                }, true);
                return;
            }

            SMLTOWN.Server.request.restartGame();
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

            if ($this.hasClass("input")) { // INPUT
                $this.find("input").focus();
                var textInput = $this.find("input[type=text]");
                if (textInput.length > 0) {
                    textInput[0].setSelectionRange(8, 8); //number of characters *2
                }
                var checkBoxes = $this.find("input[type=checkbox]");
                if (checkBoxes) {
                    checkBoxes.prop("checked", !checkBoxes.prop("checked")).change(); //change event fire
                }
                return false; //prevent focusout
            }

            var div = $this;

            var animation = function () {
                //undefined function
            };
            if ($this.hasClass("smltown_falseSelector")) { //if is cards
                div = $this.parent();
                animation = SMLTOWN.Transform.animateAuto; //utils function
            } else if ($this.is(':first-child')) { //if is selector
                div = $this.parent();
                animation = SMLTOWN.Transform.animateButtons; //utils function
            } else if (!$this.hasClass("smltown_action") && !$this.hasClass("smltown_input")) { //selected
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
                _this.menuExpand(div, animation);
            }
        });
        console.log("menu events done")
    }
    ,
    menuExpand: function (div, animation) {
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
        player.div.on("tap", function (e) {
            if ($(this).closest("#smltown_listSpectator").length) {
                console.log("spectator");
                return;
            }
            if ($(e.target).parents(".smltown_picture").length || $(e.target).hasClass("smltown_picture")) {
                return;
            }
            SMLTOWN.Action.playerSelect(id);
        });

        //
        player.div.find(".smltown_picture").on("tap", function (e) {
            var $this = $(this);
            $("#smltown_addFriend").show();

            if (player.admin == -2) {
                SMLTOWN.Message.flash("_isBot");
                return;
            }

            if (!player.socialId) {
                SMLTOWN.Message.flash("_cantFriend");
                return;
            }

            //exit menu
            $(document).on(touchstart, function (e) {
                if (!$(e.target).parents("#smltown_pictureContextMenu").length && $(e.target).attr("id") != "smltown_pictureContextMenu") {
                    $(document).off(touchstart);
                    $("#smltown_pictureContextMenu").hide();
                }
            });

            //FRIEND BUTTON
            if (player.id == SMLTOWN.user.id) {
                //SMLTOWN.Message("yourPicture");
                return;
            }

            //smalltown friends
            if (SMLTOWN.user.friends) {
                for (var i = 0; i < SMLTOWN.user.friends.length; i++) {
                    if (SMLTOWN.user.friends[i].socialId == player.socialId) {
                        SMLTOWN.Message.flash("_isFriend");
                        $("#smltown_addFriend").hide();
                        break;
                    }
                }
            }

            //other social friends
            var socialFriends = SMLTOWN.Social.friends;
            if (socialFriends) {
                for (var i = 0; i < socialFriends; i++) {
                    if (socialFriends[i] == player.socialId) {
                        SMLTOWN.Message.flash("_isFriend");
                        $("#smltown_addFriend").hide();
                        break;
                    }
                }
            }

            var something = false;
            $('#smltown_pictureContextMenu > div').each(function () {
                if ("none" != $(this).css("dislpay")) {
                    something = true;
                }
            });

            if (!something) {
                return;
            }

            //CONTEXT MENU
            $("#smltown_pictureContextMenu").attr("socialId", player.socialId);
            var offset = $this.offset();
            $("#smltown_pictureContextMenu").css({
                top: offset.top + $this.height(),
                left: offset.left + $this.width()
            }).show();

        });
    }
};
