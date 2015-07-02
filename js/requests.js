
SMLTOWN.Server.request = {
    send: function() {
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
//    suicide: function(message) {
//        if (SMLTOWN.user.status < 0) {
//            return; //prevent multiple suicide logs
//        }
//        SMLTOWN.user.status = -1;
//
//        var obj = {action: "suicide"};
//        if (message) {
//            obj.message = message;
//        }
//        this.send(obj);
//    }
//    ,
    deletePlayer: function(id) {
        this.send({
            action: "deletePlayer",
            id: id
        }, true);
    }
    ,
    chat: function(text) {
        this.send({
            action: "chat",
            text: text.replace(/'/g, "").replace(/"/g, "")
        }, true);
    }
    ,
    addUser: function() { //start game function only
        this.send({
            action: "addUser"
        });
    }
    ,
    addUserInGame: function(password) { //start game function only
        if ("undefined" == typeof password) {
            password = null;
        }
        this.send({
            action: "addUserInGame",
            password: password
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
    messageReceived: function() {
        this.send({
            action: "messageReceived"
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
//    ,
//    exitGame: function(callback) {
//        this.send({
//            action: "exitGame"
//        }, true, callback);
//    }

};
