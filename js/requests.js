
Game.request = {
    send: null //creation in JS_connection
    ,
    selectPlayer: function (id) {
        console.log("select")
        Game.request.send({
            action: "selectPlayer",
            id: id
        }, true);
    }
    ,
    unSelectPlayer: function () {
        Game.request.send({
            action: "unSelectPlayer"
        }, true);
    }
    ,
    nightSelect: function (obj, noWait) {
        obj.action = "nightSelect";
        Game.request.send(obj, noWait);
    }
    ,
    nightUnselect: function (obj) {
        obj.action = "nightUnselect";
        Game.request.send(obj);
    }
    ,
    nightExtra: function () {
        Game.request.send({
            action: "nightExtra"
        }, true);
    }
    ,
    endNightTurn: function () {
        Game.request.send({
            action: "endNightTurn"
        }, true);
        sleep(); //girl
    }
    ,
    setName: function (name) {
        Game.request.send({
            action: "setName",
            name: name
        });
    }
    ,
    startGame: function () {
        Game.request.send({
            action: "startGame",
            game: Game.info.id
        });
    }
    ,
    restartGame: function () {
        Game.request.send({
            action: "restartGame",
            game: Game.info.id
        });
    }
    ,
    dayEnd: function () {
        Game.request.send({
            action: "dayEnd"
        }, true);
        $("body").removeClass("discus");
    }
    ,
    getAll: function () {
        Game.request.send({
            action: "getAll"
        });
    }
    ,
    suicide: function (message) {
        if (Game.user.status < 0) {
            return; //prevent multiple suicide logs
        }
        Game.user.status = -1;

        var obj = {action: "suicide"};
        if (message) {
            obj.message = message;
        }
        Game.request.send(obj);
    }
    ,
    deletePlayer: function (id) {
        Game.request.send({
            action: "deletePlayer",
            id: id
        }, true);
    }
    ,
    chat: function (text) {
        Game.request.send({
            action: "chat",
            text: text.replace(/'/g, "").replace(/"/g, "")
        }, true);
    }
    ,
    addUser: function () { //start game function only
        if (typeof Game.userId === "undefined") {
            Game.userId = null;
        }
        if (typeof Game.userName === "undefined") {
            Game.userName = null;
        }        
        Game.request.send({
            action: "addUser",
            id: Game.id,
            userId: Game.userId, //device stored userId
            userName: Game.userName
        });
    }
    ,
    nightStart: function () {
        Game.request.send({
            action: "nightStart"
        });
    }
    ,
    setPassword: function (password) {
        Game.request.send({
            action: "setPassword",
            password: password
        }, true);
    }
    ,
    setDayTime: function (time) {
        Game.request.send({
            action: "setDayTime",
            time: time ? time : "NULL"
        }, true);
    }
    ,
    setForcedVotes: function (isChecked) {
        Game.request.send({
            action: "setForcedVotes",
            value: isChecked
        }, true);
    }
    ,
    setEndTurnRule: function (isChecked) {
        Game.request.send({
            action: "setEndTurnRule",
            value: isChecked
        }, true);
    }
    ,
    cardRequest: function () {
        Game.request.send({
            action: "cardRequest"
        });
    }
    ,
    setMessage: function (message, id) {
        Game.request.send({
            action: "setMessage",
            message: message,
            id: id
        }, true);
    }
    ,
    messageReceived: function () {
        Game.request.send({
            action: "messageReceived"
        }, true);
    }
    ,
    saveCards: function (cards) {
//        console.log(JSON.stringify(cards))
//        cards = JSON.stringify(cards).replace(/\"/g,"'");
        cards = JSON.stringify(cards);
//        console.log(cards)
        Game.request.send({
            action: "saveCards",
            cards: cards
        }, true);
    }
    ,
    exitGame: function (callback) {
        Game.request.send({
            action: "exitGame"
        }, true, callback);
    }
};
