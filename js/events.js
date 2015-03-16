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
        if ($("#console").hasClass("extended")) {
            this.console = $("body").height();
            return;
        }
        this.console = $("body").height() * 0.2;
    }
    ,
    menuContent: $("body").height(),
    console: $("body").height() * 0.2,
    list: $("body").height() * 0.8 - 30,
};

//autorun
if (Modernizr.touch) {
    console.log("TOUCH");
    $("#list, #menuContent, #console").css("overflow-y", "hidden");
    $("#console .text").css("position", "relative");
}


////http://stackoverflow.com/questions/19808917/how-to-get-swipe-up-and-swipe-down-event-in-jquery-mobile
//$.event.special.swipeupdown = {
//    setup: function() {
//        var $this = $(this);
//        $this.on("touchstart", function(event) {
//            var stop;
//            var start = {
//                time: (new Date()).getTime(),
//                coords: [event.pageX, event.pageY],
//                origin: $(event.target)
//            };
//
//            $this.on("touchmove.event", function(event) {
//                stop = {
//                    time: (new Date()).getTime(),
//                    coords: [event.pageX, event.pageY]
//                };
//
//                if (stop.time - start.time < 700) { //default hold is 750
//                    if (Math.abs(start.coords[1] - stop.coords[1]) < 30) {
//                        return;
//                    }
//                    start.origin.trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
//                }
//                $this.unbind("touchmove.event");
//                start = stop = undefined;
//
//            }).one("touchend", function() {
//                $this.unbind("touchmove.event");
//                start = stop = undefined;
//            });
//        });
//    }
//};
//
//$.each({
//    swipedown: "swipeupdown",
//    swipeup: "swipeupdown"
//}, function(event, sourceEvent) {
//    $.event.special[event] = {
//        setup: function() {
//            $(this).bind(sourceEvent, $.noop);
//        }
//    };
//});

$(window).resize(function() {
    documentResize();
    resizeCard();
});
//////////////////////////////////////////////////////

function swipeBack() {
    $(".swipe").removeClass("visible");
    setTimeout(function() {
        $("#card > div").removeClass("rotate");
    }, 400);
}

function events() {
    $("#menuIcon").on("click", function() {
        $(window).trigger("swiperight");
    });
    $("#cardIcon").on("click", function() {
        $(window).trigger("swipeleft");
    });

    $(window).on("swiperight", function(e) {
        e.preventDefault();
        if ($("#card.visible").length) {
            swipeBack();
        } else if ($("#menu").hasClass("swipe")) {
            $("#menu").addClass("visible");
        }
    });
    $(window).on("swipeleft", function(e) {
        e.preventDefault();
        if ($("#menu.visible").length) {
            swipeBack();
        } else {
            if (!Game.card) {
                flash("no card yet");
                Game.swipeStatus = 0;
            } else if ($("#card").hasClass("swipe")) {
                $("#card").addClass("visible");
            }
        }
    });

    $("#startButton").on("tap", function() {
        Game.end = false;
        Game.sleep = true;
        Game.request.startGame();
        $(".visible").removeClass("visible");
    });

    $("#restartButton").on("tap", function() {
        Game.end = false;
        Game.request.restartGame();
        $(".visible").removeClass("visible");
    });

    $("#card").on("tap", function(e) {
        if ($(e.target).attr("id") == "card") {
            $(this).removeClass("visible");
        } else {
            $("#card > div").toggleClass("rotate");
        }
    });
    $("#menu").on("tap", function(e) {
        if ($(e.target).attr("id") == "menu") {
            $(this).removeClass("visible");
        }
    });

    // MENU NAVIGATION EVENTS

    //all this starts cose IE bug on :active when click text (and android 2.3)
    var node;
    $("#menu .selector > div").touchstart(function() {
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
            $("#menuContent > div").animate({top: 0}, 300);

        } else { //add auto (expand)
            var parent = div.parent();
            parent.not("#menu > div").css("height", "auto");
            animation(div, function(height) {
                if (height > contentHeights.menuContent) {
                    $("#menuContent > div").animate({top: -div.position().top}, 300);
                }
            }); //div auto height
            removeAuto($("#menu .auto").not(parent));
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

    $("#openVoting input").change(function() {
        var checked = $(this).is(':checked');
        Game.request.setForcedVotes(checked ? 1 : 0);
    });

    $("#endTurn input").change(function() {
        var checked = $(this).is(':checked');
        Game.request.setEndTurnRule(checked ? 1 : 0);
    });

    //user settings
    menuInput("updateName", function(val) {
        Game.request.setName(val);
        flash("name saved");
    });

    $("#cleanErrors").on("touchend mouseup", function() {
        if ($(this).hasClass("active")) {
            Game.load.loading();
            reload();
        }
    });

    $(".gameover").touchstart(function(e) {
        if (Game.info.status == 1 || Game.info.status == 2) {
            e.stopPropagation();
            flash("game must be finished");
        }
    });
    //back button
    $("#backButton").click(function() {
        window.history.back();
    });

    $("#console").on("mouseup", function() {
        $('#console').toggleClass("extended");
        chatUpdate();
        if ($("#console").hasClass("extended")) {
            $("#chat").focus();
        }
    });
    $("#chat").on("focusout", function() {
        if ($("#console").hasClass("extended")) {
            return;
        }
        chatFocusOut();
    });

    $("#chatForm").submit(function() {
        $('#chat').blur();
        var text = $('#chat').val();
        if (text.length) {
            Game.request.chat(text);
        }
        chatFocusOut();
        return false;
    });

    // GAME SCROLLS (only touch device)
    touchScroll($("#list"), "top");
    touchScroll($("#menu > div"), "top");
    touchScroll($("#console"), "bottom");
}

function chatFocusOut() { //DEVICE FUNCTION CALL!!!
    $('#chat').val("");
    $("#console").removeClass("extended");
    chatUpdate();
}

function chatUpdate() {
    contentHeights.updateConsole();
    //if scroll
    $("#console").animate({
        scrollTop: $("#console .text").height() + 50
    }, 500);
}

function removeAuto(sel) { //remove auto height
    sel.removeClass("auto");
    sel.stop().css("height", ""); //stop animations
}

function menuInput(id, callback) { //menu cell with input
    $("#" + id + " form").submit(function() {
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
    $("#" + id + " input").on('blur', function() {
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
        $(".rulesCard").touchstart(function() {
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
                    $("#infoSelectedCard").remove();
                });
                $this.addClass("selected");
                $("body").append("<div id='infoSelectedCard'>" + Game.cards[$this.attr("card")].desc);
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

        $(".rulesCard form").submit(function() {
            $(this).find("input").blur();
            return false;
        });
    }

    $(".rulesCard").on("tap", function() {
        var $this = $(this);
        setTimeout(function() { //w8 documents events
            $(document).one("tap", function() {
                $this.removeClass("selected");
                $("#infoSelectedCard").remove();
            });
            $this.addClass("selected");
            $("body").append("<div id='infoSelectedCard'>" + Game.cards[$this.attr("card")].desc);
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
                $("#chat").blur();

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
                    $("#console").css("margin-bottom", "-20%");
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
                    $("#console").css("margin-bottom", "inherit");
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


$(document).on("swipeup swipedown", function() {
    Game.swipeEvent = true;
}).on("touchstart", function() {
    Game.swipeEvent = false;
});

$("#list").scroll(function() {
    onPlayersScroll();
});

function onPlayersScroll() { //only touch
    if (parseInt($("#list > div").css("top")) < 0) {
        $("#header").addClass("thin");
    } else {
        $("#header").removeClass("thin");
    }
}
