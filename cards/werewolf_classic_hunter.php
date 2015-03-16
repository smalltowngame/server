<?php
//HUNTER

$card['name'] = "hunter";
$card['rules'] = "shoot someone before die";
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
        $utils->send_response($utils->getUserId(), "extra");
        return false; //stop game 
    }
};
?>

<script>

    Game.night.extra = function() {
        wakeUp("You are in danger! Shot fast to defend you!");
        Game.selectFunction = Game.night.select;
    };

    Game.night.select = function(selectedId) {
        Game.request.nightSelect({
            id: selectedId
        });
    }

</script>
