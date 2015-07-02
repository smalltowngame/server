
SMLTOWN.Time = {
    runCountdown: function() { //start day game countdown
        if (this.countdownInterval) {
            console.log("this.countdownInterval = " + this.countdownInterval)
            return;
        }
        var $this = this;

        var timeout = 0;
        //countdown
        if (this.end) {
            this.start = SMLTOWN.Game.info.timeStart;
            this.dayTime = this.end - this.start;
            console.log(this.end + " - " + this.start);
            console.log(this.dayTime);
            timeout = this.end * 1000 - Date.now();
            this.sunPath();
        }

        //http://stackoverflow.com/questions/3468607/why-does-settimeout-break-for-large-millisecond-delay-values
        if (timeout > 2147483647 || timeout < -2147483647) {
            smltown_error("error: day time is too big. day time will be 0");
            timeout = 0;
        }

        this.countdownInterval = setTimeout(function() {
            //last seconds only
            clearInterval($this.lastSeconds);
            $this.lastSeconds = setInterval(function() {
                console.log("last seconds")
                var countdown = ($this.end - (Date.now() / 1000)) | 0; // |0 to remove decimals

                if (countdown < 1) {
                    $this.clearCountdown();
                    $this.setSunPosition();

                    if ("1" == SMLTOWN.Game.info.openVoting) {
                        console.log("openVoting!!!!!!!!!!!!!!!!!!!")
                        SMLTOWN.Server.request.openVotingEnd(); //if openVoting, not wait after last second
                        return;
                    } else {
                        $("#smltown_statusGame").smltown_text("waitPlayersVotes");
                    }
                    if (SMLTOWN.user.status && SMLTOWN.user.status > 0) {
                        SMLTOWN.Message.notify(
                                "Select one player for the lynching!"
                                + "<p>(speak is now forbidden)</p>"
                                , true);
                        $("#smltown_sun").css("z-index", 0);
                    }
                }
            }, 1000);

        }, timeout); // in milliseconds!

    }
    ,
    clearCountdown: function() { //remove countdown
        //console.log("clearCountdown");
        clearTimeout(this.sunInterval);
        clearInterval(this.lastSeconds);
        clearTimeout(this.countdownInterval);
        this.countdownInterval = false;
    }
    ,
    countdownInterval: false,
    countdownCorrector: false
    ,
    start: null,
    end: null,
    dayTime: null
    ,
    sunPath: function() {
        var $this = this;
        var update = this.dayTime / 16 * 1000;

        clearInterval(this.sunInterval);
        this.sunInterval = setInterval(function() {
            $this.setSunPosition();
        }, update); //every second
        this.setSunPosition();
    }
    ,
    setSunPosition: function() {
        var pathLength = $("#smltown_body").width();
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
            if (!perOne) { //if error stop
                clearInterval(this.sunInterval);
                return;
            }
            x = perOne * pathLength - 64;
            dayLight = parseInt(perOne * 16) + 1;
            relSep = Math.abs(this.dayTime / 2 - (this.end - now)) / this.dayTime * 2;
        }

        var y = Math.pow(relSep, 2) * pathLength / 2; //pow cuadratic movement

        console.log("day position: " + dayLight);
        $("#smltown_sun div").css("transform", "translate(" + x + "px, " + y + "px)");
        $("#smltown_sun").attr("class", "daylight" + dayLight);
    }
};
