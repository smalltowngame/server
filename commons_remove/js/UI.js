
//    setGameEvents: function (div, game) {
//        var _this = this;
//        var xOrigin, x, dif;
//
//        var content = div.find(".smltown_content");
//        content.on("tap", function () {
//            _this.clickGameEvent(div)
//        });
//
//        content.on(touchstart, function (e) {
//            //reset all
//            $(".smltown_game smltown_content").css("transform", "translateX(0)");
//            if (e.originalEvent.touches) {
//                e = e.originalEvent.touches[0];
//            }
//            xOrigin = e.pageX;
//            dif = 0;
//            $(document).on(touchmove, function (e) {
//                _this.movedGame = true;
//                if (e.originalEvent.touches) {
//                    e = e.originalEvent.touches[0];
//                }
//                x = e.pageX;
//                dif = x - xOrigin;
//                _this.swipeGame(content, dif);
//
//                div.removeClass("smltown_fixedGame");
//                if (dif > 50) {
//                    content.off("tap");
//                }
//            });
//
//            $(document).one(touchend, function () {
//                $(document).off(touchmove);
//
//                if (dif > content.width() / 2) {
//                    content.addClass("smltown_removeGame");
//
//                    if (parseInt(game.own)) {
//                        _this.removeGame(div);
//
//                    } else if (parseInt(game.playing)) {
//                        _this.exitGame(game.id);
//                        game.playing = 0;
//                        game.players = parseInt(game.players) - 1;
//
//                        var newDiv = _this.makeRow(game);
//                        newDiv.removeClass("smltown_fixedGame");
//                        var newContent = newDiv.find(".smltown_content");
//                        newContent.addClass("smltown_removeGame");
//
//                        //change div
//                        setTimeout(function () {
//                            div.replaceWith(newDiv);
//                        }, 500);
//
//                        //return div to original position
//                        setTimeout(function () {
//                            newDiv.addClass("smltown_fixedGame");
//                            this.movedGame = false;
//                        }, 1000);
//
//                        //reset class
//                        setTimeout(function () {
//                            newContent.removeClass("smltown_removeGame");
//                        }, 1500);
//
//                        return;
//                    }
//
//                    setTimeout(function () {
//                        div.remove();
//                    }, 500);
//
//                } else {
//                    div.addClass("smltown_fixedGame");
//                    _this.movedGame = false;
//                }
//            });
//        });
//    }
//    ,

SMLTOWN.UI = {
    swipeDiv: function (div, callbackStart, callbackEnd, eventTime) {

        var touchstart = ('ontouchstart' in document.documentElement ? "touchstart" : "touchstart mousedown");
        var touchmove = ('ontouchmove' in document.documentElement ? "touchmove" : "touchmove mousemove");
        var touchend = ('ontouchend' in document.documentElement ? "touchend" : "touchend mouseup");
        var xOrigin, x, dif, started;

        div.on(touchstart, function (e) {

            if (e.originalEvent.touches) {
                e = e.originalEvent.touches[0];
            }
            xOrigin = e.pageX;
            dif = 0;
            $(document).on(touchmove, function (e) {
                if (eventTime) {
                    eventTime[0] = true;
                }
                if (e.originalEvent.touches) {
                    e = e.originalEvent.touches[0];
                }
                x = e.pageX;
                dif = x - xOrigin;

                //SWIPE
                if (dif < 0) {
                    dif = 0;
                }
                div.css("transform", "translateX(" + dif + "px)");
                var opacity = 1 - dif / div.width();
                div.css("opacity", opacity);

                if (dif > 50) {
                    div.off("tap");
                }
                
                if(0 != dif && !started){
                    started = true;
                    callbackStart();                    
                }
            });

            $(document).one(touchend, function () {
                $(document).off(touchmove);

                if (dif > div.width() / 2) {
                    var removed = true;
                    callbackEnd(removed);

                    div.addClass("smltown_removeGame");
                    div.css({
                        '-webkit-transition': "500ms",
                        '-moz-transition': "500ms",
                        'transition': "500ms",
                        'opacity': "0",
                        '-webkit-transform': "translateX(120%)",
                        '-moz-transform': "translateX(120%)",
                        'transform': "translateX(120%)"
                    });

                    setTimeout(function () {
                        div.remove();
                    }, 500);

                } else {
                    var removed = false;
                    callbackEnd(removed);
                    
                    div.css({
                        'opacity': 1,
                        '-webkit-transform': "translateX(0px)",
                        '-moz-transform': "translateX(0px)",
                        'transform': "translateX(0px)"
                    });
                    if (eventTime) {
                        eventTime[0] = false;
                    }
                }
            });
        });
    }
};
