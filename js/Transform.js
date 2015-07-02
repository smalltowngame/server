
//Modernizr
if (Modernizr.touch) {
    console.log("TOUCH");
    $("#smltown_list, #smltown_menuContent, #smltown_console").css("overflow-y", "hidden");
    $("#smltown_consoleText").css("position", "relative");
}

SMLTOWN.Transform = {
    //ON WINDOW RESIZE AND LOAD ////////////////////////////////////////////////
    contentHeights: {//android 2.3 BUG on height content div
        updateConsole: function() {
            var $this = this;
            setTimeout(function() {
//                if ($("#smltown_console").hasClass("smltown_consoleExtended")) {
//                    $this.smltown_consoleLog = $("#smltown_body").height();
//                } else {
//                    $this.smltown_consoleLog = $("#smltown_body").height() * 0.25;
//                }
                $this.smltown_consoleLog = $("#smltown_consoleText").height();
                //$("#smltown_console").height(this.smltown_console);
            }, 500);
        }
        ,
        smltown_menuContent: 0,
        smltown_consoleLog: 0,
        smltown_list: 0
    }
    ,
    windowResize: function() {
        //DEFINE HTML HEIGHT FOR PLUGINS
        var rest = SMLTOWN.Util.getViewport().height - $("#smltown_html").offset().top;
        $("#smltown_html").css("height", rest + "px");
    }
    ,
    gameResize: function() {
        //RESIZE FUNCTIONS//////////////////////////////////////////////////////
        $("#smltown_html").removeClass("smltown_static smltown_staticCard");

        //WIDTHS
        $("#smltown_body").width("100%");
        $("#smltown_menu, #smltown_card").addClass("smltown_swipe");
        $("#smltown_menu").width("200%");
//        $("#smltown_card").width("inherit");

        //HEIGHTS
        $("#smltown_body").height(($("#smltown_html").height() - $("#smltown_header").height()) + "px");

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

        this.storeGameHeights();
        this.resizeCard();
    }
    ,
    storeGameHeights: function() {
        //RESTORE HEIGHT CONSTANTS
        this.contentHeights.updateConsole();
        this.contentHeights.smltown_menuContent = $("#smltown_body").height();
        this.contentHeights.smltown_list = $("#smltown_body").height() * 0.75 - 30;
    }
    ,
    //ON INPUT CHAT FOCUS OUT ////////////////////////////////////////////////
    chatFocusOut: function() { //LET DEVICES FUNCTION CALL!!!
        $('#smltown_chatInput').val("");
        $("#smltown_console").removeClass("smltown_consoleExtended");
        SMLTOWN.Message.chatUpdate();
    }
    ,
    //GAME EVENTS FUNCTIONS ///////////////////////////////////////////////////
    cardSwipeRotate: function() {
        $("#smltown_card").removeClass("smltown_visible");
        setTimeout(function() {
            $("#smltown_card > div").removeClass("smltown_rotate");
        }, 400);
    }
    ,
    cardRotateSwipe: function() {
        if ($("#smltown_card > div").hasClass("smltown_rotate")) {
            $("#smltown_card > div").removeClass("smltown_rotate");
        }
        setTimeout(function() {
            $("#smltown_card").removeClass("smltown_visible");
        }, 200);
    }
    ,
    updateHeader: function() { //only touch
        var Y = parseInt($("#smltown_list > div").css('transform').split(',')[5]);
        if (Y < 0) {
            $("#smltown_header").addClass("thin");
        } else {
            $("#smltown_header").removeClass("thin");
        }
    }
    ,
    animateAuto: function(div, callback) {
        var elem = div.clone().css({"height": "auto"}).appendTo(div.parent());
        var height = elem.css("height");
        elem.remove();
        div.css("height", height);
        if (callback) {
            callback(parseInt(height));
        }
    }
    ,
    animateButtons: function(div) {
        var childs = div.find(" > div:visible").length;
        div.css("height", childs * 50);
    }
    ,
    removeAuto: function(sel) { //remove auto height
        sel.removeClass("smltown_auto");
        sel.stop().css("height", ""); //stop animations
    }
    ,
    resizeCard: function() {
        var height = $("#smltown_html").height();
        var width = $("#smltown_html").width();
        if (width > height) {
            width = height * 0.8;
            $("#smltown_card > div").width(width);
        }
        $("#smltown_card .smltown_cardText").height(height - width);
    }
};
