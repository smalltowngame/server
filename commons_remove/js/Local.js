
SMLTOWN.Local = {
    gameRequests: {}
    ,
    XMLHttpRequestTimeout: 500
    ,
    pingGames: function () {
        this.stopRequests();
        //more timeout
        this.XMLHttpRequestTimeout += 500000 / this.XMLHttpRequestTimeout;
        console.log("tiemout: " + this.XMLHttpRequestTimeout);

        $this = this;
        window.onbeforeunload = function () {
            $this.stopRequests();
            return null;
        };

        $("#smltown_loadingGames").addClass("smltown_loader");

        //setTimeout(function() {
        //ImgPing["localhost"].img.removeAttr("src");
        //},2000);
        //
//        if ($(".smltown_game.smltown_local").length) {
//            this.XMLHttpPing("", "localhost");
//        }

        for (var i = 2; i <= 255; i++) {
            this.XMLHttpPing("192.168.1.", i);
        }
    }
    ,
    XMLHttpPing: function (ipBase, i) {
        var $this = this;
        var gameReq = {};
        gameReq = new XMLHttpRequest();
        gameReq.ip = ipBase + i;
        gameReq.href = "http://" + gameReq.ip + ":8080/smalltown/";
        gameReq.open('HEAD', gameReq.href + "index.php", true); //async
        gameReq.timeout = this.XMLHttpRequestTimeout;
//                gameReq.ontimeout = function () {
//                    console.log("Timed out!!!");
//                }
        gameReq.send();
        gameReq.onreadystatechange = function () { //localhost finder
            if (this.readyState == 4) {
                if (this.status == 200) {
                    console.log(gameReq.ip)

                    this.smalltownHeader = this.getResponseHeader('smalltown');
                    var url = this.href;
                    if (isNaN(this.smalltownHeader)) {
                        //search localhost repeated games and refuse
                        if ("localhost" != i //not this one
                                && $this.gameRequests["localhost"]
                                && this.smalltownHeader == $this.gameRequests["localhost"].smalltownHeader) {
                            console.log("game name: " + $this.gameRequests["localhost"].smalltownHeader + " repeated");
                            return;
                        }                        
                        url += this.smalltownHeader + "/";
                    }
                    
                    //if LOCALHOST found
                    var nameHeader = "";
                    var headers = this.getAllResponseHeaders();
                    if(headers.indexOf("smltown_name") > -1){
                        nameHeader = this.getResponseHeader('smltown_name');
                    } else {
                        console.log("not smltown_name header found on local game");
                    }
                    //SMLTOWN.Games.addLocalGamesRow(url, this.ip, nameHeader);
                }

                if ($this.areXMLHttpRequestFinished()) {
                    $("#smltown_loadingGames").removeClass("smltown_loader");
                }
            }
        };
        this.gameRequests[i] = gameReq;
    }
    ,
    areXMLHttpRequestFinished: function () {
        for (var key in this.gameRequests) {
            if (this.gameRequests[key].readyState < 4) {
                return false;
            }
        }
        return true;
    }
    ,
    stopRequests: function () {
        for (var key in SMLTOWN.Local.gameRequests) {
            if (this.gameRequests[key].abort) {
                this.gameRequests[key].abort();
                //console.log("abort");
            }
        }
        //$("#smltown_loadingGames").removeClass("smltown_loader");
    }
//    ,
//    ImgPing: function(ipBase, i) {
//        var $this = this;
//        this.ip = ipBase + i;
//        this.href = "http://" + this.ip + ":8080/smalltown";
//        this.img = $("<img src = '" + this.href + "/ping'>");
//        this.img.one("load", function() {
//            addLocalGamesRow($this.href, $this.ip, "local");
//        });
//    }
};
