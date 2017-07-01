
SMLTOWN.Time = {
    runCountdown: function () { //start day game countdown
        var $this = this;
        console.log("run countdown")
        if (this.countdownInterval) {
            clearTimeout(this.countdownInterval);
        }

        var timeout = 0;
        //countdown
        if ("undefined" == typeof this.end || null == this.end) {
            $("#smltown_sun").hide();
            return;
        } else if (this.end > 0) {
            this.start = SMLTOWN.Game.info.timeStart;
            this.dayTime = this.end - this.start;
//            console.log(this.end + " - " + this.start);
//            console.log(this.dayTime);
            timeout = this.end * 1000 - Date.now();
        }
        this.sunPath();

        //http://stackoverflow.com/questions/3468607/why-does-settimeout-break-for-large-millisecond-delay-values
        if (timeout > 2147483647 || timeout < -2147483647) {
            smltown_error("error: day time number is too big. day time will set to 0 (timeout = " + timeout + ")");
            timeout = 0;
        }

        this.countdownInterval = setTimeout(function () {
            //last seconds only
            clearInterval($this.lastSeconds);
            $this.lastSeconds = setInterval(function () {
                $this.dayEnd();
            }, 1000);
            $this.dayEnd(); //first of all

        }, timeout); // in milliseconds!
    }
    ,
    dayEnd: function () {
        console.log("last seconds");
        var countdown = this.end - (Date.now() / 1000);
        if (countdown > 0) {
            return;
        }

        this.clearCountdowns();
        this.setSunPosition($("#smltown_sun"), $("#smltown_body").width());

        if ("1" == SMLTOWN.Game.info.openVoting) {
            console.log("openVoting!!!!!!!!!!!!!!!!!!!")
            SMLTOWN.Server.request.openVotingEnd(); //if openVoting, not wait after last second
            return;
        } else {
            $("#smltown_statusGame").smltown_text("waitPlayersVotes");
        }
        if (0 < SMLTOWN.user.status) {
            SMLTOWN.Server.request.dayEnd();
            SMLTOWN.Message.notify("_lynch", true);
            $("#smltown_sun").css("z-index", 0); //let vote
        }
    }
    ,
    clearCountdowns: function () { //remove countdown
        console.log("clearCountdowns");
        clearTimeout(this.sunInterval);
        clearInterval(this.lastSeconds);
        clearTimeout(this.countdownInterval);
        this.countdownInterval = false;
    }
    ,
    countdownInterval: false
    ,
    start: null,
    end: null,
    dayTime: null
    ,
    sunPath: function () {
        var _this = this;
        var update = this.dayTime / 16 * 1000;

        var sunDiv = $("#smltown_sun");
        var pathLength = $("#smltown_body").width();

        clearInterval(this.sunInterval);
        this.sunInterval = setInterval(function () {
            _this.setSunPosition(sunDiv, pathLength);
        }, update);
        _this.setSunPosition(sunDiv, pathLength);
    }
    ,
    setSunPosition: function (sunDiv, pathLength) {
        var now = Date.now() / 1000 | 0;
        //console.log(now - this.start + " , " + this.dayTime + " , " + pathLength);

        var x, dayLight, relSep;
        if (!this.end || now > this.end) {
            relSep = 1;
            clearInterval(this.sunInterval);
            x = pathLength - 64;
            dayLight = 16;

        } else {
            var perOne = (now - this.start) / this.dayTime;
            if (isNaN(perOne)) { //if error stop
                clearInterval(this.sunInterval);
                return;
            }
            x = perOne * pathLength - 64;
            dayLight = parseInt(perOne * 16) + 1;
            relSep = Math.abs(this.dayTime / 2 - (this.end - now)) / this.dayTime * 2;
        }

        var y = Math.pow(relSep, 2) * pathLength / 2 + 50; //pow cuadratic movement

        console.log("day position: " + dayLight);
        sunDiv.attr("class", "daylight" + dayLight);
        sunDiv.find("div").css("transform", "translate(" + x + "px, " + y + "px)");
    }
};
