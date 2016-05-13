<?php
//HUNTER
//lang
$card->text = array(
    "en" => array(
        "name" => "hunter",
        "rules" => "shoot someone before die",
        "shoot" => "You are in danger! Shot fast to defend you!"
    ),
    "es" => array(
        "name" => "cazador",
        "rules" => "dispara a alguien antes de morir",
        "shoot" => "Dispara a alguien antes de morir!"
    )
);

////CARD PROPERTIES
$card->max = 1;

$card->nightSelect = function() {
    $selectId = $this->requestValue["id"];
    $this->kill($selectId);
    $name = $this->getPlayerName($selectId);
    $me = $this->getPlayerName();
    $this->setMessage("player $name was killed by $me, the hunter");
    $this->setPlayer(array("status" => -1)); //after message
    return true;
};

$card->statusGameChange = function() { //statusGameChange have empty userId    
    $status = $this->getPlayer("status");
    if (0 == intval($status)) { //dying
        return $this->getText()['shoot']; //stop game 
    }
};
?>

<script>

    SMLTOWN.Action.night.statusGameChange = function (message) {
        SMLTOWN.Message.notify(message, false);        
        //store select function outside
        SMLTOWN.Action.playerSelect = SMLTOWN.Action.night.select;
        //SMLTOWN.Action.wakeUp();
    };

    SMLTOWN.Action.night.select = function (selectedId) {
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
