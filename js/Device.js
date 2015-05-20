
var DeviceHandler = function(func, var1, var2) {
    //if (typeof Device == "undefined") {
    //    return false;
    //}
    if(Device && !func){
        return true; //check is device app
    }
    if (!Device[func]) {
        setLog("\n your app version doesn't support: " + func, "error");
        return false;
    }
    try {
        if (typeof var2 != "undefined") {
            return Device[func](var1, var2);
        } else if (typeof var1 != "undefined") {
            return Device[func](var1);
        } else {
            return Device[func]();
        }
    } catch (e) {
        setLog("incorrect function use", "error");
        return false;
    }
    setLog("unexpected error", "error");
    return false;
};

