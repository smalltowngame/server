<?php
//ANGEL
//lang
$card->text = array(
    "en" => array(
        "name" => "Guargian Angel",
        "rules" => "protect someone every night"
    ),
    "es" => array(
        "name" => "Ángel Guardián",
        "rules" => "protege a alguien cada noche"
    )
);

////CARD PROPERTIES

$card->initiative = 0;
$card->max = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card->nightSelect = function() {
    $selectId = $this->requestValue['id'];
    
    $this->setPlayer(array("rulesJS" => "SMLTOWN.temp.protected=$selectId"));

    // RESOLVE TURN
    $player = $this->getPlayer(array("name"), $selectId);
    $this->setPlayer(array('status' => 2), $selectId);
    return $player->name . " was protected.";
};
?>

<script>

    SMLTOWN.Action.night.select = function(selectedId) {
        //can't select previous
        if (SMLTOWN.user.id == selectedId) {
            SMLTOWN.Message.flash("Guardian Angel can't protect yourself");
            return false;
        }
        if (SMLTOWN.temp.protected == selectedId) {
            SMLTOWN.Message.flash("can't protect twice same player");
            return false;
        }
        //set selection
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
