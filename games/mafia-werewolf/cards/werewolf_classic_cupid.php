<?php
//CUPID
//lang
$card->text = array(
    "en" => array(
        "name" => "cupid",
        "rules" => "make two people fall in love",
        "inLove" => "you are now in love with ",
        "loving" => "you are in love with ",
        "isWerewolf" => " And is a werewolf.."
    ),
    "es" => array(
        "name" => "cupido",
        "rules" => "enamora dos jugadores",
        "inLove" => "ahora estás enamorado de ",
        "loving" => "estás enamorado de ",
        "isWerewolf" => " Y es un Hombre-lobo.."
    )
);

////CARD
$card->initiative = -1;
$card->max = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card->nightSelect = function() {
    $id1 = $this->requestValue['id1'];
    $id2 = $this->requestValue['id2'];

    $this->cupidRules($id1, $id2);
    $this->cupidRules($id2, $id1);

    $this->addPlayerRulesPHP("$id1,$id2");
};

$card->cupidRules = function($me, $to) {
    $toName = $this->getPlayerName($to);
    $text = $this->getText();

    //saveMessage
    $message = $text['inLove'] . "$toName!";

    //if werewolf
    $card = $this->getPlayer("card", $to);
    $cardArray = split("_", $card);
    if (count($cardArray) == 3) {
        if (strpos($cardArray[2], 'werewolf') !== false) {
            $message .= $text['isWerewolf'];
        }
    }

    $this->setMessage($message, $me);

    $loving = $text['loving'];
    $idDiv = "$('#" . $to . "')";
    $js = "$idDiv.bind('click.smltown_rules',function(){"
            . "if(3==SMLTOWN.Game.info.status){" //day status
            . "return false"
            . "}});" //prevent vote
            . "$idDiv.bind('click.smltown_rules',function(){"
            . "SMLTOWN.Message.flash('$loving $toName')"
            . "});"; //remember is in love

    $this->addPlayerRulesJS($js, $me);
};

$card->statusGameChange = function() { //statusGameChange have empty userId
    $rules = $this->getPlayer("rulesPHP");
    if (empty($rules)) {
        return;
    }

    $lovers = explode(",", $rules);

    $player1 = $this->getPlayer(array("name", "status"), $lovers[0]);
    $player2 = $this->getPlayer(array("name", "status"), $lovers[1]);

    if ($player1->status != $player2->status) {
        if ($player1->status > $player2->status) {
            $this->setPlayer(array("status" => -1), $lovers[0]);
            $this->setMessage("$player1->name kills himself for the love to $player2->name");
        } else {
            $this->setPlayer(array("status" => -1), $lovers[1]);
            $this->setMessage("$player2->name kills himself for the love to $player1->name");
        }
        //remove rules
        $this->setPlayer(array("rulesPHP" => ''));
        return false; //stop
    }
};

?>

<script>

    SMLTOWN.Action.night.select = function (selectedId) {
        console.log(selectedId)
        var first = $(".smltown_check"); //check if exists

        $("#" + selectedId + " .smltown_votes").html("<symbol>N</symbol>");
        $("#" + selectedId).addClass("smltown_check"); //manual check

        if (first.length == 0) {
            return false; //wait next select
        }

        var id1 = first.attr("id");
        var id2 = selectedId;
        var name1 = SMLTOWN.players[id1].name;
        var name2 = SMLTOWN.players[id2].name;

        //cupid needs end turn manually!
        SMLTOWN.Message.notify(name1 + " and " + name2 + " are now in love", function () {
            SMLTOWN.Action.sleep();
            SMLTOWN.Action.cleanVotes();

            SMLTOWN.Server.request.nightSelect({
                id1: id1,
                id2: id2
            }, true); //without response
        });

        return false; //not let add votes
    };

    SMLTOWN.Action.night.unselect = function () {
        if (!$(".smltown_preselect").length) { //remove selection if unselect same
            $(".smltown_check").removeClass("smltown_check");
            $(".smltown_votes").html("");
        }
        return false; //prevent default
    };

</script>
