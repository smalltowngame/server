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

//autorun
if (Modernizr.touch) {
    console.log("TOUCH");
    $("#smltown_list, #smltown_menuContent, #smltown_console").css("overflow-y", "hidden");
    $("#smltown_console .text").css("position", "relative");
}

function windowResize() {
    smltown_error(111)
    //DEFINE HTML HEIGHT FOR PLUGINS
    var rest = viewport().height - $("#smltown_html").offset().top;
    $("#smltown_html").css("height", rest + "px");

    //RESIZE FUNCTIONS//////////////////////////////////////////////////////////
    $("#smltown_html").removeClass("smltown_static smltown_staticCard");

    //WIDTHS
    $("#smltown_body").width("100%");
    $("#smltown_menu, #smltown_card").addClass("smltown_swipe");
    $("#smltown_menu").width("200%");
    $("#smltown_card").width("inherit");

    //HEIGHTS
    $("#smltown_body").height($("#smltown_html").height() - $("#smltown_header").height());

    //horizontal /3
//    if (9 * $(window).width() >= 16 * $(window).height()) {
//        $("html").addClass("smltown_static staticCard");
//        $("body").width($(window).height() * 3 / 4);
//        $("#smltown_menu, #card").width(($(window).width() - $("body").width()) / 2);
//        //horizontal /2
//    } else 
    if (3 * $(window).width() >= 4 * $(window).height()) {
        $("#smltown_html").addClass("smltown_static");
        $("#smltown_body").width($("#smltown_html").width() - $("#smltown_menu").width());
//        $("#smltown_body").width(450);
        $("#smltown_menu, #smltown_body, #smltown_console").height($(window).height() - $("#smltown_header").height());
//        $("#smltown_menu").width($(window).width() - $("body").width());
        //vertical
    } else {
        //unTouchable
        if (!Modernizr.touch) {
            $("#smltown_html").addClass("unTouchable");
        }
    }

    //RESTORE HEIGHT CONSTANTS
    window.contentHeights = {//android 2.3 BUG on height content div
        updateConsole: function() {
            setTimeout(function() {
                if ($("#smltown_console").hasClass("extended")) {
                    this.smltown_console = $("#smltown_body").height();
                } else {
                    this.smltown_console = $("#smltown_body").height() * 0.25;
                }
                $("#smltown_console").height(this.smltown_console);
            }, 500);
        }
        ,
        smltown_menuContent: $("#smltown_body").height(),
        smltown_console: $("#smltown_body").height() * 0.25,
        smltown_list: $("#smltown_body").height() * 0.75 - 30
    };
    ///////////////////////////////////////////////////////////////////////////

    resizeCard();
}

$(window).resize(function() {
    windowResize();
});

//////////////////////////////////////////////////////

function cardSwipeRotate() {
    $("#smltown_card").removeClass("smltown_visible");
    setTimeout(function() {
        $("#smltown_card > div").removeClass("smltown_rotate");
    }, 400);
}
function cardRotateSwipe() {
    if ($("#smltown_card > div").hasClass("smltown_rotate")) {
        $("#smltown_card > div").removeClass("smltown_rotate");
    }
    setTimeout(function() {
        $("#smltown_card").removeClass("smltown_visible");
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
        if ($("#smltown_card > div").hasClass("smltown_rotate")) {
            cardRotateSwipe();
        } else {
            $("#smltown_card > div").addClass("smltown_rotate");
        }
    });

    $("#smltown_menu").on("tap", function(e) {
        if ($(e.target).attr("id") == "smltown_menu") {
            $(this).removeClass("smltown_visible");
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
        if ($(this).hasClass("smltown_falseSelector")) { //if is cards
            div = $(this).parent();
            animation = animateAuto; //utils function
        } else if ($(this).is(':first-child')) { //if is selector
            div = $(this).parent();
            animation = animateButtons; //utils function
        } else if (!$(this).hasClass("smltown_button") && !$(this).hasClass("smltown_input")) { //selected
            animation = animateAuto; //utils function
        }

        if (div.hasClass("smltown_auto")) { //remove auto
            if (div.hasClass("text")) {
                removeAuto(div.find(".smltown_auto")); //prevent card selector close
            } else {
                removeAuto(div);
            }
            //return menu at original top position
            $("#smltown_menuContent > div").css("transform", "translateY(0)");

        } else { //add auto (expand)
            var parent = div.parent();
            parent.not("#smltown_menu > div").css("height", "auto");
            animation(div, function(height) {
                if (height > contentHeights.menuContent) {
                    console.log("translateY(" + -div.position().top + ")");
                    $("#smltown_menuContent > div").css("transform", "translateY(" + -div.position().top + "px)");
                }
            }); //div auto height
            removeAuto($("#smltown_menu .smltown_auto").not(parent));
            div.addClass("smltown_auto");
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

//    $("#smltown_console").on("mousedown", function() {
//        if ($("#smltown_chatInput").is(":focus"))
//            console.log(123)
//    });

    $("#smltown_console").on("mouseup", function() {
//        if($("#smltown_chatInput").is(":focus"))
        $('#smltown_console').toggleClass("extended");
        chatUpdate();
        if ($("#smltown_console").hasClass("extended")) {
            $("#smltown_chatInput").focus();
        }
    });
    $("#smltown_chatInput").on("focusout", function() {
        if ($("#smltown_console").hasClass("extended")) {
            return;
        }
        chatUpdate();
    });

    $("#smltown_chatForm").submit(function() {
        $('#smltown_chatInput').blur();
        var text = $('#smltown_chatInput').val();
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

//function addChats(chats) {
//    console.log("chats = " + chats)
//    var arrayChats = chats.split("·");
//    var values;
//    for (var i = 0; i < arrayChats.length; i++) {
//        values = arrayChats[i].split("~");
//        addChat(values[1], values[0]);
//    }
//    chatUpdate();
//    setUserNamesByClass();
//}

function addChats() { //from coockie	
    var chats = getCookie("chat");
    var arrayChats = chats.split("·");
    var values;
    for (var i = 0; i < arrayChats.length; i++) {
        values = arrayChats[i].split("~");
        writeChat(values[1], values[0]);
    }
    chatUpdate();
    setUserNamesByClass();
}

function clearChats() { //coockie
    document.cookie = "chat=;domain=." + document.domain + ";path=/;";
}

function addChat(text, userId) { //from server
    if (typeof userId == "undefined") {
        userId = Game.userId;
    }
    var now = new Date();
    now.setTime(now.getTime() + 31536000000); //1 year
    var domain = "." + document.domain;
    if (document.domain == "localhost") {
        domain = "";
        document.cookie.Domain = null;
    }
    document.cookie = "chat=" + getCookie("chat") + "·" + userId + "~" + text + ";expires=" + now.toGMTString() + ";domain=" + domain + ";path=/;";
    writeChat(text, userId);
}

function writeChat(text, userId) {
    var name = "";
    if (typeof Game.players[userId] != "undefined") { //if player no longer exists
        name = Game.players[userId].name + ": ";
    }
    console.log(text)
    text = emoji.replace_unified(text);
    console.log(text)
    $("#smltown_console .text").append("<div><span class='id" + userId + "'>" + name + "</span>" + text + "</div>");
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1);
        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }
    return "";
}

function chatFocusOut() { //LET DEVICE FUNCTION CALL!!!
    $('#smltown_chatInput').val("");
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
    sel.removeClass("smltown_auto");
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
        if (!val) {
            return false;
        }
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
    });
}

function touchScroll(div, side) { //side: top or bottom    
    div.off("touchstart");
    var element = div.attr("id");
    console.log("'" + element + "' scroll on '" + side + "' done")
    //android 2.3 bug on height content div
    var $this = div.find(">div");

    if ($this.css("transform") == "none") {
        $this.css("transform", "translateY(0px)");
    }

    var finalPosition, x, y, pageX, pageY, originScrollY, position, moved;

    div.on("touchstart", function(e) { //necessary top != auto
        position = null; //reset final position to prevent calculations 
        var maxScroll = contentHeights[element] - $this.height() + 10; //see bottom list
        if (maxScroll > -10) {
            console.log("not scroll " + element);
            $this.css("transform", "translateY(0px)");
            return;
        }

        pageX = e.originalEvent.touches[0].pageX;
        pageY = e.originalEvent.touches[0].pageY;
        var Y = parseInt($this.css('transform').split(',')[5]);
        originScrollY = Y - pageY;

        $(this).on("touchmove", function(e) {
            e.preventDefault(); //faster (test on 2.3 android)    
            moved = true;

            //limit scroll
            y = e.originalEvent.touches[0].pageY;

            if ("smltown_console" == element) {
//                $("#smltown_chatInput").blur();

            } else {//prevent scroll on swipe
                x = e.originalEvent.touches[0].pageX;
                if (Math.abs(y - pageY) < 2 * Math.abs(x - pageX)) {
                    return;
                }
            }

            //scroll
            finalPosition = originScrollY + y;
            if (side == "top") {
                if (finalPosition > 0) {
                    finalPosition = 10;
                } else if (finalPosition < maxScroll) {
                    finalPosition = maxScroll - 10;
                }
            } else {
                if (finalPosition < 0) {
                    finalPosition = -10;
                } else if (finalPosition > -maxScroll) {
                    finalPosition = -maxScroll + 10;
                }
            }
            //prevent extra calculations
            if (position == finalPosition) {
                return;
            }

            if ("smltown_list" == element) {
                $("#smltown_console").addClass("smltown_reduced");
            }

            position = finalPosition;
            $this.css("transform", "translateY(" + finalPosition + "px)");

            //common events
            if ("smltown_list" == element) {
                onPlayersScroll();
            }

        }).one("touchend", function() {
            $(this).off("touchmove");
            if (!moved) {
                return;
            }
            if (side == "top") {
                if (finalPosition > 0) {
                    $this.css("transform", "translateY(2px)");
                } else if (finalPosition < maxScroll) {
                    $this.css({
                        transform: "translateY(" + maxScroll + "px)"
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
                setTimeout(function() { //let some time to continue scroling
                    $("#smltown_console").removeClass("smltown_reduced");
                }, 500);

            } else if ("smltown_menu" == element) {
                if ($(this).height() - $this.height() > 0) {//client see bottom list                        
                    $this.css("transform", "translateY(0px)");
                }
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

//computer
$("#smltown_list").scroll(function() {
    onPlayersScroll();
});

function onPlayersScroll() { //only touch
    var Y = parseInt($("#smltown_list > div").css('transform').split(',')[5]);
    if (Y < 0) {
        $("#smltown_header").addClass("thin");
    } else {
        $("#smltown_header").removeClass("thin");
    }
}
