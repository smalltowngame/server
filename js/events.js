///////////////////////////////////////////////////////////////////////////////
//EVENTS PLUGINS

//unify touchstart and mousedown to prevent double events
(function($) {
    $.fn.touchstart = function(event) {
        if ('ontouchstart' in document.documentElement) {
            this.bind("touchstart", function(e) {
                event.call(this, e);
            });
        } else { //if not touch
            this.bind("mousedown", function(e) {
                event.call(this, e);
            });
        }
        return this;
    };
})(jQuery);

///////////////////////////////////////////////////////////////////////////////
//VARIABLES DECLARATION
var contentHeights = {//android 2.3 bug on height content div
    updateConsole: function() {
        if ($("#smltown_console").hasClass("extended")) {
            this.console = $("#smltown_body").height();
            return;
        }
        this.console = $("#smltown_body").height() * 0.2;
    }
    ,
    menuContent: $("#smltown_body").height(),
    console: $("#smltown_body").height() * 0.2,
    list: $("#smltown_body").height() * 0.8 - 30,
};

//autorun
if (Modernizr.touch) {
    console.log("TOUCH");
    $("#smltown_list, #smltown_menuContent, #smltown_console").css("overflow-y", "hidden");
    $("#smltown_console .text").css("position", "relative");
}

$(window).resize(function() {
    documentResize();
    resizeCard();
});
//////////////////////////////////////////////////////

function cardSwipeRotate() {
    $("#smltown_card").removeClass("visible");
    setTimeout(function() {
        $("#card > div").removeClass("rotate");
    }, 400);
}
function cardRotateSwipe() {
    if ($("#smltown_card > div").hasClass("rotate")) {
        $("#smltown_card > div").removeClass("rotate");
    }
    setTimeout(function() {
        $("#smltown_card").removeClass("visible");
    }, 400);
}


//var transition = 0;
function events() {

    //SWIPES ACTIONS GAME
    $("#smltown_menuIcon").on("click", function() {
        $(window).trigger("swiperight");
    });
    $("#smltown_cardIcon").on("click", function() {
        $(window).trigger("swipeleft");
    });

    $(window).on("swiperight", function(e) {
        e.preventDefault();

        if ($("#smltown_card").hasClass("smltown_visible")) {
            cardSwipeRotate();
        } else if ($("#smltown_menu").hasClass("smltown_swipe")) {
            $("#smltown_menu").addClass("smltown_visible");
        }
//        transition = Math.min(100, transition + 100);
//        $("#card").css({"-webkit-transform": "translateX(" + transition + "%)"}); //best on efficiency
    });
    $(window).on("swipeleft", function(e) {
        e.preventDefault();
        if ($("#smltown_menu").hasClass("smltown_visible")) {
            $("#smltown_menu").removeClass("smltown_visible");
        } else {
            if (!Game.card) {
                flash("no card yet");
            }
            else if ($("#smltown_card").hasClass("smltown_swipe")) {
                $("#smltown_card").addClass("smltown_visible");
//            transition = Math.max(-100, transition - 100);
//            $("#card").css({"-webkit-transform": "translateX(" + transition + "%)"});
            }
        }
    });

    //TAP MENUS
    $("#smltown_card").on("tap", function() {
        if ($("#card > div").hasClass("rotate")) {
            cardRotateSwipe();
        } else {
            $("#card > div").addClass("rotate");
        }
    });

    $("#smltown_menu").on("tap", function(e) {
        if ($(e.target).attr("id") == "menu") {
            $(this).removeClass("visible");
        }
    });

    // MENU NAVIGATION EVENTS
    $("#smltown_startButton").on("tap", function() {
        Game.end = false;
        Game.sleep = true;
        Game.request.startGame();
        $(".smltown_visible").removeClass("smltown_visible");
    });

    $("#smltown_restartButton").on("tap", function() {
        Game.end = false;
        Game.request.restartGame();
        $(".smltown_visible").removeClass("smltown_visible");
    });

    // ( all this starts cose a IE bug on :active when click text (and android 2.3) )
    var node;
    $("#smltown_menu .smltown_selector > div").touchstart(function() {
        node = this.nodeValue;
        var selector = this;
        $(selector).addClass("active");

        $(document).on("touchmove.menu mousemove.menu", function(event) {
            var eventDiv = document.elementFromPoint(event.clientX, event.clientY);
            var div = $(eventDiv).closest('div')[0];
            if (eventDiv != selector && div != selector) {
                $(document).off("touchmove.menu mousemove.menu");
                $(selector).removeClass("active");
            }
        });
    }).on("mouseup", function(event) {
        //visuals
        $(document).off("touchmove.menu mousemove.menu");
        var $this = $(this);
        setTimeout(function() {
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
        var animation = function() {
        };
        if ($(this).hasClass("falseSelector")) { //if is cards
            div = $(this).parent();
            animation = animateAuto; //utils function
        } else if ($(this).is(':first-child')) { //if is selector
            div = $(this).parent();
            animation = animateButtons; //utils function
        } else if (!$(this).hasClass("button") && !$(this).hasClass("input")) { //selected
            animation = animateAuto; //utils function
        }

        if (div.hasClass("auto")) { //remove auto
            if (div.hasClass("text")) {
                removeAuto(div.find(".auto")); //prevent card selector close
            } else {
                removeAuto(div);
            }
            //return menu at original top position
            $("#smltown_menuContent > div").animate({top: 0}, 300);

        } else { //add auto (expand)
            var parent = div.parent();
            parent.not("#smltown_menu > div").css("height", "auto");
            animation(div, function(height) {
                if (height > contentHeights.menuContent) {
                    $("#smltown_menuContent > div").animate({top: -div.position().top}, 300);
                }
            }); //div auto height
            removeAuto($("#smltown_menu .auto").not(parent));
            div.addClass("auto");
        }

    });
//    .on("touchcancel", function() {
//        $(document).off("touchmove.menu mousemove.menu");
//        var $this = $(this);
//        setTimeout(function() {
//            $this.removeClass("active");
//        }, 1);
//    });
    ////////////////////////////////////////////////////////////////////////////

    ///// menu events
    //game
    menuInput("password", function(val) {
        Game.request.setPassword(val);
    });

    menuInput("dayTime", function(val) {
        Game.request.setDayTime(val);
    });

    $("#smltown_openVoting input").change(function() {
        var checked = $(this).is(':checked');
        Game.request.setForcedVotes(checked ? 1 : 0);
    });

    $("#smltown_endTurn input").change(function() {
        var checked = $(this).is(':checked');
        Game.request.setEndTurnRule(checked ? 1 : 0);
    });

    //user settings
    menuInput("updateName", function(val) {
        Game.request.setName(val);
        flash("name saved");
    });

    $("#smltown_cleanErrors").on("touchend mouseup", function() {
        if ($(this).hasClass("active")) {
            Game.load.loading();
            reload();
        }
    });

    $(".smltown_gameover").touchstart(function(e) {
        if (Game.info.status == 1 || Game.info.status == 2) {
            e.stopPropagation();
            flash("game must be finished");
        }
    });
    //back button
    $("#smltown_backButton").click(function() {
        gameBack();
    });

    $("#smltown_console").on("mouseup", function() {
        $('#smltown_console').toggleClass("extended");
        chatUpdate();
        if ($("#smltown_console").hasClass("extended")) {
            $("#smltown_chat").focus();
        }
    });
    $("#smltown_chat").on("focusout", function() {
        if ($("#smltown_console").hasClass("extended")) {
            return;
        }
        chatFocusOut();
    });

    $("#smltown_chatForm").submit(function() {
        $('#smltown_chat').blur();
        var text = $('#smltown_chat').val();
        if (text.length) {
            addChat(text);
            Game.request.chat(text);
        }
        chatFocusOut();
        return false;
    });

    // GAME SCROLLS (only touch device)
    touchScroll($("#smltown_list"), "top");
    touchScroll($("#smltown_menu > div"), "top");
    touchScroll($("#smltown_console"), "bottom");
}

function addChats(chats) {
    console.log("chats = " + chats)
    var arrayChats = chats.split("·");
    var values;
    for (var i = 0; i < arrayChats.length; i++) {
        values = arrayChats[i].split("~");
        addChat(values.text, values.userId);
    }
    chatUpdate();
    setUserNamesByClass();
}

function addChat(text, userId) {
    console.log("text = " + text)
    if (!userId) {
        userId = Game.user.id;
    }
    $("#smltown_console .text").append("<div><span class='id" + userId + "'></span>" + text + "</div>");
}

function chatFocusOut() { //DEVICE FUNCTION CALL!!!
    $('#smltown_chat').val("");
    $("#smltown_console").removeClass("extended");
    chatUpdate();
}

function chatUpdate() {
    contentHeights.updateConsole();
    //if scroll
    $("#smltown_console").animate({
        scrollTop: $("#smltown_console .text").height() + 50
    }, 500);
}

function removeAuto(sel) { //remove auto height
    sel.removeClass("auto");
    sel.stop().css("height", ""); //stop animations
}

function menuInput(id, callback) { //menu cell with input
    $("#smltown_" + id + " form").submit(function() {
//        console.log(222)
        var input = $(this).find("input");
//        var val = input.val();
        if (input.is(":focus")) {
            input.blur();
        }
//        input.val("");
//        if (!val) {
//            return false;
//        }
//        input.attr("placeholder", val);
//        callback(val);
        return false;
    });
    $("#smltown_" + id + " input").on('blur', function() {
//        $("#" + id + " form").trigger('submit');

        var val = $(this).val();

        $(this).val("");
        console.log(val)
        if (!val) {
            return false;
        }
        console.log(333)
        $(this).attr("placeholder", val);

        callback(val);
        return false;
    });
}

//card admin events
function rulesEvents() {
    var tapped = false;
    var mousedown = false;
    var card = null;

    if (Game.user.admin) {
        $(".smltown_rulesCard").touchstart(function() {
            var $this = $(this);
            if (card != $(this).attr("card")) {
                tapped = false;
                card = $(this).attr("card");
            }
            if (!tapped) { //if tap is not set, set up single tap
                mousedown = true;
                tapped = setTimeout(function() {
                    tapped = null; //insert things you want to do when single tapped
                }, 300);   //wait then run single click code
                mousedown = setTimeout(function() {
                    // TAPHOLD//////////////////
                    if (!mousedown || Game.swipeEvent || $this.hasClass("cardOut")) {
                        return false;
                    }
                    $this.find("input").show();
                    $this.find("input").focus();
                    $this.find("span").hide();
                    //////////////////////////////
                }, 600);   //wait then run single click code
                return;
            }

            // DOUBLE TAP (tapped within 300ms of last tap)
            clearTimeout(tapped); //stop single tap callback
            tapped = null;
            $(this).toggleClass("cardOut"); //insert things you want to do when double tapped

            var cards = Game.info.cards;
            if ($(this).hasClass("cardOut")) {
                var cardName = $(this).attr("card");
                delete cards[cardName];
                Game.request.saveCards(cards);

            } else {
                cards[$(this).attr("card")] = null;
                Game.request.saveCards(cards);
            }

        }).on("tap", function() {
            var $this = $(this);
            setTimeout(function() { //w8 documents events
                $(document).one("tap", function() {
                    $this.removeClass("selected");
                    $("#smltown_infoSelectedCard").remove();
                });
                $this.addClass("selected");
                $("#smltown_body").append("<div id='smltown_infoSelectedCard'>" + Game.cards[$this.attr("card")].desc);
            }, 1);

        }).on("mouseup", function() {
            mousedown = false;

        }).bind("taphold", function(e) {
            e.preventDefault();
            return false;

        }).on("focusout", function() { //input number
            var cards = Game.info.cards;
            var card = $(this).attr("card");

            if (!$(this).find("input").val()) {
                $(this).find("span").show();
                $(this).find("input").hide();
                if (card) {
                    cards[card] = 0;
                    Game.request.saveCards(cards);
                }
            } else { //int value
                var val = $(this).find("input").val();
                if (val != cards[card]) {
                    cards[card] = val;
                    Game.request.saveCards(cards);
                }
            }
        });

        $(".smltown_rulesCard form").submit(function() {
            $(this).find("input").blur();
            return false;
        });
    }

    $(".smltown_rulesCard").on("tap", function() {
        var $this = $(this);
        setTimeout(function() { //w8 documents events
            $(document).one("tap", function() {
                $this.removeClass("selected");
                $("#infoSelectedCard").remove();
            });
            $this.addClass("selected");
            $("#smltown_body").append("<div id='infoSelectedCard'>" + Game.cards[$this.attr("card")].desc);
        }, 1);
    })
}

function touchScroll(div, side) { //side: top or bottom
    div.off("touchstart");
    var element = div.attr("id");
    //android 2.3 bug on height content div
    var $this = div.find(">div");

    if ($this.css(side) == "auto") {
        $this.css(side, 0);
    }

    var animationTop = {}, animationBottom = {};
    animationTop[side] = 2;

    var finalPosition, x, y, pageX, pageY, originScrollY;
    var direction = 1;
    if (side == "bottom") {
        direction = -1;
    }
    div.on("touchstart", function(e) { //necessary top != auto
        var maxScroll = contentHeights[element] - $this.height() - 10; //see bottom list
        if (maxScroll > 0) {
            $this.css(side, 0);
            return;
        }
        pageX = e.originalEvent.touches[0].pageX;
        pageY = e.originalEvent.touches[0].pageY;
        originScrollY = parseInt($this.css(side)) - pageY * direction;

        $(this).on("touchmove", function(e) {
            e.preventDefault(); //faster (test on 2.3 android)

            //limit scroll
            y = e.originalEvent.touches[0].pageY;

            if ("console" == element) {
                $("#smltown_chat").blur();

            } else {//prevent scroll on swipe
                x = e.originalEvent.touches[0].pageX;
                if (Math.abs(y - pageY) < 2 * Math.abs(x - pageX)) {
                    return;
                }
            }

            //scroll
            finalPosition = originScrollY + y * direction;
            if (finalPosition > 0) {
                finalPosition = 10;
            } else if (finalPosition < maxScroll) {
                finalPosition = maxScroll - 10;
            } else {
                if ("list" == element) {
                    $("#smltown_console").css("margin-bottom", "-20%");
                }
            }
            $this.css(side, finalPosition + "px");

            //common events
            if ("list" == element) {
                onPlayersScroll();
            }

        }).one("touchend", function() {
            $(this).off("touchmove");
            if (finalPosition > 0) {
                $this.animate(animationTop, 100);
            } else if (finalPosition < maxScroll) {
                animationBottom[side] = maxScroll;
                $this.animate(animationBottom, 100);
            }
            if ("list" == element) {
                setTimeout(function() { //let some time to continue scroling
                    $("#smltown_console").css("margin-bottom", "inherit");
                }, 500);

            } else if ("menu" == element) {
                if ($(this).height() - $this.height() > 0) {//client see bottom list                        
                    $this.animate(animationTop, 100);
                }
            } else if ("console" == element) {
                chatFocusOut();
            }
        });
    });
}

/*
 $(document).on("swipeup swipedown", function () {
 Game.swipeEvent = true;
 }).on("touchstart", function () {
 Game.swipeEvent = false;
 });
 */

$("#smltown_list").scroll(function() {
    onPlayersScroll();
});

function onPlayersScroll() { //only touch
    if (parseInt($("#list > div").css("top")) < 0) {
        $("#smltown_header").addClass("thin");
    } else {
        $("#smltown_header").removeClass("thin");
    }
}
