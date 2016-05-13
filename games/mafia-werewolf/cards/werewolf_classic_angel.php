<?php
//ANGEL
//lang
$card->text = array(
    "en" => array(
        "name" => "Guargian Angel",
        "rules" => "protect someone every night",
        "cantYourself" => "Guardian Angel can't protect yourself",
    ),
    "es" => array(
        "name" => "Ángel Guardián",
        "rules" => "protege a alguien cada noche",
        "cantYourself" => "El Angel Guardian no puede protegerse a si mismo",
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

    SMLTOWN.temp.text = {
        en: {
            "cantYourself": "Guardian Angel can't protect yourself",
            "cantTwice": "can't protect twice same player"
        },
        es: {
            "cantYourself": "El Angel Guardian no puede protegerse a si mismo",
            "cantTwice": "no puedes proteger dos veces seguidas al mismo jugador"
        }
    };

    SMLTOWN.Action.night.select = function (selectedId) {
        //can't select previous
        if (SMLTOWN.user.id == selectedId) {
            SMLTOWN.Message.flash(SMLTOWN.temp.text[SMLTOWN.lang].cantYourself);
            return false;
        }
        if (SMLTOWN.temp.protected == selectedId) {
            SMLTOWN.Message.flash(SMLTOWN.temp.text[SMLTOWN.lang].cantTwice);
            return false;
        }
        //set selection
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
