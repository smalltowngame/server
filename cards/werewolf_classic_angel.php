<?php
//ANGEL
//lang
$card['text'] = array(
    "en" => array(
        "name" => "angel",
        "rules" => "protect someone every night"
    ),
    "es" => array(
        "name" => "ángel",
        "rules" => "protege"
    )
);

////CARD PROPERTIES
$card['serie'] = "classic werewolf";
$card['initiative'] = 0;
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
    $selectId = $utils->requestValue("id");

    // RESOLVE TURN
    $player = $utils->getPlayer(array("name", "status"), $selectId);
    $status = $player->status;
    if ($status == 0) {
        $utils->setPlayer(array('status' => 2), $selectId);
    }
    return $player->name . " was protected.";
};
?>

<script>

    SMLTOWN.Action.night.select = function(selectedId) {
        //can't select yourself
        if (selectedId == SMLTOWN.user.id) {
            return false;
        }
        //set selection
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
