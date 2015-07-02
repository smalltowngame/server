<?php
//HUNTER
//lang
$card['text'] = array(
    "en" => array(
        "name" => "hunter",
        "rules" => "shoot someone before die"
    )
);

////CARD PROPERTIES
$card['serie'] = "classic werewolf";
$card['max'] = 1;

$card['nightSelect'] = function($utils) {
    $selectId = $utils->requestValue("id");
    $utils->kill($selectId);
    $name = $utils->getPlayerName($selectId);
    $me = $utils->getPlayerName();
    $utils->setMessage("player $name was killed by $me, the hunter");
    $utils->setPlayer(array("status" => -1)); //after message
    return true;
};

$card['statusGameChange'] = function($utils) { //statusGameChange have empty userId    
    $status = $utils->getPlayer("status");
    if ($status == 0) { //dying
//        $utils->send_response($utils->getUserId(), "extra");
        $utils->send_response($utils->getUserId(), "SMLTOWN.Action.night.extra");
        return false; //stop game 
    }
};
?>

<script>

    SMLTOWN.Action.night.extra = function() {
        SMLTOWN.Action.wakeUp("You are in danger! Shot fast to defend you!");
        //store select function outside
        SMLTOWN.selectFunction = SMLTOWN.Action.night.select;
    };
    
    
    SMLTOWN.Action.night.select = function(selectedId) {
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
