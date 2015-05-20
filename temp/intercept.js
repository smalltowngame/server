
var Intercepted = {};
function intercept(funcName, callback, before) {
    var array = funcName.split(".");
	var func;
    if (array.length > 1) {
        func = window[array[0]];
        for (var i = 1; i < array.length; i++) {
            func = func[array[i]];
            if (typeof func === "undefined") {
                console.log("error parsing function on intercept with name: " + funcName);
                return false;
            }
        }
        funcName = array[array.length - 1];
    } else {
        func = window[funcName];
    }
    
    if (typeof window[funcName] !== "function") {
        return;
    }
    Intercepted[funcName] = func;
    func = function (args) {
        if (before) {
            callback(Intercepted[funcName](arguments));
        } else {
            callback(arguments);
            return Intercepted[funcName](arguments);
        }
    };
}
