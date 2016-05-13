
SMLTOWN.Server.request = {
    send: function() {
        smltown_error("server connection is not established yet");
    } //creation in JS_connection
    ,
    selectPlayer: function(id) {
        SMLTOWN.Server.request.send({//not found .this?
            action: "selectPlayer",
            id: id
        }, true);
    }
    ,
    unSelectPlayer: function() {
        SMLTOWN.Server.request.send({//not found .this?
            action: "unSelectPlayer"
        }, true);
    }
    ,
    nightSelect: function(obj, noWait) {
        obj.action = "nightSelect";
        this.send(obj, noWait);
    }
    ,
    nightUnselect: function(obj) {
        obj.action = "nightUnselect";
        this.send(obj);
    }
    ,
    nightExtra: function() {
        this.send({
            action: "nightExtra"
        }, true);
    }
    ,
    endNightTurn: function() {
        this.send({
            action: "endNightTurn"
        }, true);
        SMLTOWN.Action.sleep(); //like girl Card
    }
    ,
    setName: function(name) {
        this.send({
            action: "setName",
            name: name
        });
    }
    ,
    setPicture: function(picture) {
        this.send({
            action: "setPicture",
            picture: picture
        });
    }
    ,
    startGame: function() {
        this.send({
            action: "startGame"
        });
    }
    ,
    restartGame: function() {
        this.send({
            action: "restartGame"
        });
    }
    ,
    endTurn: function() {
        this.send({
            action: "endTurn"
        }, true);
    }
    ,
    openVotingEnd: function() {
        this.send({
            action: "openVotingEnd"
        }, true);
    }
    ,
    getAll: function() {
        this.send({
            action: "getAll"
        });
    }
    ,
    deletePlayer: function(id) {
        this.send({
            action: "deletePlayer",
            id: id
        }, true);
    }
    ,
    chat: function(text) {
        var obj = {
            action: "chat",
            text: text.replace(/'/g, "\'").replace(/"/g, "\""),
            name: SMLTOWN.user.name
        };

        if (SMLTOWN.Game.info.night && SMLTOWN.Game.info.night == SMLTOWN.user.card) {
            obj.action = "nightChat"
        }
        this.send(obj, true);
    }
//    ,
//    addUser: function(type, id) { //start game function only
//        var obj = {
//            action: "addUser",
//            lang: SMLTOWN.lang
//        };
//
//        if (SMLTOWN.user.name) {
//            obj.name = SMLTOWN.user.name;
//        }
//        if (type) {
//            obj.type = type;
//        }
//        if (id) {
//            obj.socialId = id;
//        }
//        this.send(obj, true);
//    }
    ,
    addFacebookUser: function(id) {
        this.send({
            action: "addFacebookUser",
            facebookId: id
        }, true);
    }
    ,
    addUserInGame: function(gameId, password) { //start game function only
        if ("undefined" == typeof password) {
            password = null;
        }
        this.send({
            action: "addUserInGame",
            gameId: gameId,
            password: password,
            userId: SMLTOWN.Util.getCookie("smltown_userId")
        }, null, null, "joiningGame", 10000);

        setTimeout(function() {
            if (window.inGame && $.isEmptyObject(SMLTOWN.players)) {
                smltown_error("trying again..");
                location.reload();
            }
        }, 10000);
    }
    ,
    playGame: function() {
        this.send({
            action: "playGame"
        });
    }
    ,
    spectatorMode: function() {
        this.send({
            action: "spectatorMode"
        });
    }
    ,
    nightStart: function() {
        this.send({
            action: "nightStart"
        });
    }
    ,
    setPassword: function(password) { //admin
        this.send({
            action: "setPassword",
            password: password
        }, true);
    }
    ,
    setPublicGameRule: function(isChecked) {
        this.send({
            action: "setPublicGameRule",
            value: isChecked
        }, true);
    }
    ,
    setDayTime: function(time) {
        this.send({
            action: "setDayTime",
            time: time ? time : "NULL"
        }, true);
    }
    ,
    setOpenVoting: function(isChecked) {
        this.send({
            action: "setOpenVoting",
            value: isChecked
        }, true);
    }
    ,
    setEndTurnRule: function(isChecked) {
        this.send({
            action: "setEndTurnRule",
            value: isChecked
        }, true);
    }
    ,
    cardRequest: function() {
        this.send({
            action: "cardRequest"
        });
    }
    ,
    setMessage: function(message, id) {
        this.send({
            action: "setMessage",
            message: message,
            id: id
        }, true);
    }
    ,
    messageReceived: function(stop) {
        if (!stop) {
            stop = 0;
        }
        this.send({
            action: "messageReceived",
            stop: stop
        }, true);
    }
    ,
    saveCards: function(cards) {
//        console.log(JSON.stringify(cards))
//        cards = JSON.stringify(cards).replace(/\"/g,"'");
        cards = JSON.stringify(cards);
//        console.log(cards)
        this.send({
            action: "saveCards",
            cards: cards
        }, true);
    }
    ,
    becomeAdmin: function() {
        this.send({
            action: "becomeAdmin"
        }, true);
    }
    ,
    dayEnd: function() {
        this.send({
            action: "dayEnd"
        }, true); //not loading
    }
    ,
    setSocialStauts: function(status) { //feed done
        this.send({
            action: "setSocialStauts",
            status: status
        }, true); //not loading
    },
    setPlayerNotifications: function(jsonFriends, message) {
        this.send({
            action: "setPlayerNotifications",
            friends: jsonFriends,
            message: message
        }, true);
    }
    ,
    addFriend: function(socialId) {
        this.send({
            action: "addFriend",
            socialId: socialId
        }, true);
    }
    ,
    checkTranslation: function(lang, kind, some) {
        this.send({
            action: "checkTranslation",
            lang: lang,
            kind: kind,
            text: some
        }, true);
    }
    ,
    //needs inside app to update players game
    exitGame: function(id, callback) {
        this.send({
            action: "exitGame",
            gameId: id
        }, true, callback);
    }

};
