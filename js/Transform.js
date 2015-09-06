
SMLTOWN.Transform = {
//ON WINDOW RESIZE AND LOAD ////////////////////////////////////////////////
    contentHeights: {//android 2.3 BUG on height content div
        updateConsole: function () {
            var $this = this;
            setTimeout(function () {
                $this.smltown_consoleLog = $("#smltown_consoleText").height();
            }, 500);
        }
        ,
        smltown_consoleLog: 0
    }
    ,
    windowResize: function () {
        //DEFINE HTML HEIGHT FOR PLUGINS
        var rest = SMLTOWN.Util.getViewport().height - $("#smltown_html").offset().top;
        $("#smltown_html").css("height", rest + "px");

        if (9 * $(window).width() >= 16 * $(window).height()) {
            $("#smltown_html").addClass("smltown_static smltown_staticMenu");
        } else if (3 * $(window).width() >= 4 * $(window).height()) { //horizontal
//        } else if ($(window).width() > $(window).height()) { //horizontal
            $("#smltown_html").addClass("smltown_static");
        } else {
            $("#smltown_console").removeClass("smltown_consoleExtended");
        }
    }
    ,
    gameResize: function () {

        if (9 * $(window).width() >= 16 * $(window).height()) {
            console.log("9:16");
            //screen 9:16
            $("#smltown_html").addClass("smltown_static smltown_staticMenu");
            $("#smltown_body").css({
                'width': $("#smltown_html").width() - $("#smltown_menuContent").width(),
                'margin-left': $("#smltown_menuContent").width()
            });
            $("#smltown_console").css({
                'width': ($("#smltown_html").width() - $("#smltown_menuContent").width()) / 2
            });
            $("#smltown_list").css({
                'width': ($("#smltown_html").width() - $("#smltown_menuContent").width()) / 2
            });
            $("#smltown_header").css({
                'width': $("#smltown_menuContent").width() + $("#smltown_list").width()
            });
            $("smltown_menuIcon").hide();
            //chat
            this.chatFocusOutSave = this.chatFocusOut;
            this.chatFocusOut = function () {
                //
            };
            $("#smltown_chatInput").focus();
            //
//        } else if (3 * $(window).width() >= 4 * $(window).height()) { //horizontal
        } else if ($(window).width() > $(window).height()) { //horizontal
            console.log("3:4");
            //screen 3:4
            $("#smltown_html").addClass("smltown_static");
            $("#smltown_html").removeClass("smltown_staticMenu");
            $("#smltown_body").css({
                'width': "50%",
                'margin-left': "inherit"
            });
            $("#smltown_header").css({
                'width': "inherit"
            });
            $("#smltown_console").css({
                'width': "50%"
            });
            $("#smltown_list").css({
                'width': "100%"
            });

            $("smltown_menuIcon").hide();
            //chat
            this.chatFocusOutSave = this.chatFocusOut;
            this.chatFocusOut = function () {
                //
            };
            $("#smltown_chatInput").focus();
            //
        } else {
            $("#smltown_html").removeClass("smltown_static smltown_staticMenu");
            $("#smltown_console").removeClass("smltown_consoleExtended");
            $("#smltown_body").css({
                'width': "100%",
                'margin-left': "inherit"
            });
            $("#smltown_header").css({
                'width': "inherit"
            });
            $("#smltown_console").css({
                'width': "inherit"
            });
            $("#smltown_list").css({
                'width': "100%"
            });
            //
            if (this.chatFocusOutSave) {
                this.chatFocusOut = this.chatFocusOutSave;
            }
            //
            $("smltown_menuIcon").show();
        }

        $("#smltown_filter").css({
            'width': $("#smltown_list").width()
        });

        this.contentHeights.updateConsole();
        //RESIZE CARD
        var height = $("#smltown_html").height();
        var width = $("#smltown_html").width();
        if (width > height) {
            width = height * 0.8;
            $("#smltown_card > div").width(width);
        } else {
            $("#smltown_card > div").width("");
        }
        $("#smltown_card .smltown_cardText").height(height - width);
        $("#smltown_card").css({
            right: -$("#smltown_card").width()
        });
    }
    ,
    //ON INPUT CHAT FOCUS OUT ////////////////////////////////////////////////
    chatFocusOut: function () { //LET DEVICES FUNCTION CALL!!!
        $('#smltown_chatInput').blur();
        $("#smltown_console").removeClass("smltown_consoleExtended");
        this.chatUpdate();
    }
    ,
    chatUpdate: function () {
        SMLTOWN.Transform.contentHeights.updateConsole();
        //if scroll
        $("#smltown_console").animate({
            scrollTop: $("#smltown_consoleText > div > div").height() + 50
        }, 500);
    }
    ,
    //GAME EVENTS FUNCTIONS ///////////////////////////////////////////////////
    cardSwipeRotate: function () {
        $("#smltown_card").removeClass("smltown_visible");
        setTimeout(function () {
            $("#smltown_card > div").removeClass("smltown_rotate");
        }, 400);
    }
    ,
    cardRotateSwipe: function () {
        if ($("#smltown_card > div").hasClass("smltown_rotate")) {
            $("#smltown_card > div").removeClass("smltown_rotate");
        }
        setTimeout(function () {
            $("#smltown_card").removeClass("smltown_visible");
        }, 200);
    }
    ,
    updateHeader: function () { //only touch
        var Y = parseInt($("#smltown_list > div").css('transform').split(',')[5]);
        if (Y < 0) {
            $("#smltown_game").addClass("smltown_thinHeader");
        } else {
            $("#smltown_game").removeClass("smltown_thinHeader");
        }
    }
    ,
    animateAuto: function (div, callback) {
        var elem = div.clone().css({"height": "auto"}).appendTo(div.parent());
        var height = elem.css("height");
        elem.remove();
        div.css("height", height);
        if (callback) {
            callback(parseInt(height));
        }
    }
    ,
    animateButtons: function (div) {
        var childs = div.find(" > div:visible").length;
        div.css("height", childs * 50);
    }
    ,
    removeAuto: function (sel) { //remove auto height
        sel.removeClass("smltown_auto");
        sel.stop().css("height", ""); //stop animations
    }
};
