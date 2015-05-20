<?php
//GIRL

$card['name'] = "girl";
$card['initiative'] = 1;
$card['rules'] = "can be converted by werewolfs";
$card['max'] = 1;

$card['extra'] = function($utils) {
	$userId = $utils->getUserId();
    $playerStatus = $utils->getPlayer("status");
    if ($playerStatus == 0) {
		$utils->setMessage("You have been attacked by the werewolfs, but you only have hurt. You become a werewolf!", $userId);
        $utils->setPlayer(['card' => "werewolf_classic_werewolf", 'status' => 1]);
    }else{
		return false;
	}
};
?>
