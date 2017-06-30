
SMLTOWN.Transform = {
//ON WINDOW RESIZE AND LOAD ////////////////////////////////////////////////
    contentHeights: {//android 2.3 BUG on height content div
        updateConsole: function() {
            var $this = this;
            setTimeout(function() {
                $this.smltown_consoleLog = $("#smltown_consoleText").height();
            }, 500);
        }
        ,
        smltown_consoleLog: 0
    }
    ,
    windowResize: function() {
        //DEFINE HTML HEIGHT FOR PLUGINS
        if (!$("#smltown").length) {
            var rest = SMLTOWN.Util.getViewport().height - $("#smltown_html").offset().top;
            $("#smltown_html").css("height", rest + "px");
        }

        if (9 * $("#smltown_html").width() >= 16 * $("#smltown_html").height()) {
            $("#smltown_html").addClass("smltown_static smltown_staticMenu");
        } else if (3 * $("#smltown_html").width() >= 4 * $("#smltown_html").height()) { //horizontal
//        } else if ($("#smltown_html").width() > $("#smltown_html").height()) { //horizontal
            $("#smltown_html").addClass("smltown_static");
        } else {
            $("#smltown_console").removeClass("smltown_consoleExtended");
        }

        //game width persistent style
        var totalWidth = $("#smltown_html").width();
        var cols = parseInt(totalWidth / 350);
        var width;
        if (cols) {
            width = totalWidth / cols - 14 + "px";
        } else {
            width: "inherit"
        }

        $("#gameWidth").remove();
        $("<style id='gameWidth' type='text/css'> .smltown_game{ width:" + width + "} </style>").appendTo("head");
    }
    ,
    gameResize: function() {

        //SCROLL
        if (SMLTOWN.touch) {
            console.log("SMLTOWN.touch = " + SMLTOWN.touch)
            $("#smltown_list, #smltown_menuContent, #smltown_consoleLog").css("overflow-y", "hidden");
        } else {
            $("#smltown_list, #smltown_menuContent, #smltown_consoleLog").css("overflow-y", "auto");
        }

        //if (3 * $("#smltown_html").width() >= 4 * $("#smltown_html").height()) { //horizontal
        if ($("#smltown_html").width() < 500 || $("#smltown_html").width() < $("#smltown_html").height()) {
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
        } else if (9 * $("#smltown_html").width() < 16 * $("#smltown_html").height()) {
            console.log("3:4");

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
            this.chatFocusOut = function() {
                //
            };
            $("#smltown_chatInput").focus();
        } else {
            console.log("9:16");

            $("#smltown_html").addClass("smltown_static smltown_staticMenu");
            $("#smltown_body").css({
                'width': $("#smltown_html").width() - $("#smltown_menuContent").width(),
                'margin-left': $("#smltown_menuContent").width()
            });

            var rest = $("#smltown_html").width() - $("#smltown_menuContent").width();
            var listWidth = rest / 2;
            if (listWidth > 600) {
                listWidth = 600;
            }
            $("#smltown_list").css({
                'width': listWidth
            });
            $("#smltown_console").css({
                'width': rest - listWidth
            });

            $("#smltown_header").css({
                'width': $("#smltown_menuContent").width() + $("#smltown_list").width()
            });
            $("smltown_menuIcon").hide();
            //chat
            this.chatFocusOutSave = this.chatFocusOut;
            this.chatFocusOut = function() {
                //
            };
            $("#smltown_chatInput").focus();
        }

        $("#smltown_filter").css({
            'width': $("#smltown_list").width()
        });
        
        //remove menu margin on very small screens
        if ($("#smltown_html").width() < 250) {
            $("#smltown_menuContent").addClass("smltown_removeMenuMargin");
        } else {
            $("#smltown_menuContent").removeClass("smltown_removeMenuMargin");
        }

        //RESIZE CARD
        var height = $("#smltown_html").height();
        var width = $("#smltown_html").width();
        if (width > height) {
            width = height * 0.8;
            $("#smltown_card").css({
                'width': width
            });
        } else {
            $("#smltown_card").css({
                'width': "100%"
            });
        }
        $("#smltown_card .smltown_cardText").height(height - width);
        $("#smltown_card").css({
            right: -$("#smltown_card").width()
        });
    }
    ,
    //ON INPUT CHAT FOCUS OUT ////////////////////////////////////////////////
    chatFocusOut: function() { //LET DEVICES FUNCTION CALL!!!
        $('#smltown_chatInput').blur();
        $("#smltown_console").removeClass("smltown_consoleExtended");
        this.chatUpdate();
    }
    ,
    chatUpdate: function() {
        if (!SMLTOWN.touch) {
            var Y = $("#smltown_consoleLog > div").height();
            //$('#smltown_consoleLog > div').animate({scrollTop: Y});
            $('#smltown_consoleLog > div').scrollTop(Y);
        } else {
            $('#smltown_consoleLog > div').css("transform", "translateY(0)");
        }
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
            $("#smltown_game").addClass("smltown_thinHeader");
        } else {
            $("#smltown_game").removeClass("smltown_thinHeader");
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
};
