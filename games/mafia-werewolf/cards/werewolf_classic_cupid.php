<?php
//CUPID
//lang
$card->text = array(
    "en" => array(
        "name" => "cupid",
        "rules" => "make two people fall in love following each other until death",
        "quote" => "do you want to play?",
        "inLove" => "you are now in love with ",
        "loving" => "alert! you are in love with ",
        "ifDies" => ", if he dies, you will too.",
        "isWerewolf" => " And is a WEREWOLF..",
        "suicide" => "kills himself for the love to"
    ),
    "es" => array(
        "name" => "cupido",
        "rules" => "enamora dos jugadores",
        "quote" => "quieres jugar?",
        "inLove" => "ahora estás enamorado de ",
        "loving" => "cuidado! estás enamorado de ",
        "ifDies" => ", si él muere tú también lo harás.",
        "isWerewolf" => " Y es un HOMBRE-LOBO..",
        "suicide" => "ha muerto por amor a"
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
    $ifDies = $text['ifDies'];
    $idDiv = "$('#" . $to . "')";
    $js = "$idDiv.bind('tap.smltown_rules',function(){"
            . "if(3==SMLTOWN.Game.info.status){" //day status
            . "return false"
            . "}});" //prevent vote
            . "$idDiv.bind('tap.smltown_rules',function(){"
            . "SMLTOWN.Message.flash('$loving $toName $ifDies')"
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

    //suicide
    if ($player1->status != $player2->status) {
        $text = $this->getText();
        $suicide = $text['suicide'];

        if ($player1->status > $player2->status) {
            $this->setPlayer(array("status" => -1), $lovers[0]);
            $this->setMessage("$player1->name $suicide $player2->name");
        } else {
            $this->setPlayer(array("status" => -1), $lovers[1]);
            $this->setMessage("$player2->name $suicide $player1->name");
        }
        //remove rules
        $this->setPlayer(array("rulesPHP" => ''));
        return false; //stop
    }

    //WIN!
    $alive = $this->getPlayers(array('status' => "1"));
    $protected = $this->getPlayers(array('status' => "2"));
    $count = count($alive) + count($protected);

    if ($count != 2) {
        return;
    }

    $id1 = false;
    $id2 = false;

    for ($i = 0; $i < count($alive); $i++) {
        if ($player1->id == $alive[$i]->id) {
            $id1 = true;
        }
        if ($player2->id == $alive[$i]->id) {
            $id2 = true;
        }
    }
    for ($i = 0; $i < count($protected); $i++) {
        if ($player1->id == $protected[$i]->id) {
            $id1 = true;
        }
        if ($player2->id == $protected[$i]->id) {
            $id2 = true;
        }
    }

    if ($id1 && $id2) {
        $this->setPlayers(array("status = -1"), array("status = 0"));
        $this->addPlayerRulesJS(""
                . "$('#' + $lovers[0] + ' .smltown_extra').html('<symbol style=\"color:red; opacity:0.5\">N</symbol>');"
                . "$('#' + $lovers[1] + ' .smltown_extra').html('<symbol style=\"color:red; opacity:0.5\">N</symbol>');"
                , true);
        $this->endGame();
        return false;
    }
};
?>

<script>

    SMLTOWN.Action.night.select = function(selectedId) {
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
        SMLTOWN.Message.notify(name1 + " and " + name2 + " are now in love", function() {
            SMLTOWN.Action.sleep();
            SMLTOWN.Action.cleanVotes();

            SMLTOWN.Server.request.nightSelect({
                id1: id1,
                id2: id2
            }, true); //without response
        });

        return false; //not let add votes
    };

    SMLTOWN.Action.night.unselect = function() {
        if (!$(".smltown_preselect").length) { //remove selection if unselect same
            $(".smltown_check").removeClass("smltown_check");
            $(".smltown_votes").html("");
        }
        return false; //prevent default
    };

</script>
