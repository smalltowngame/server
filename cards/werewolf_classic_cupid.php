<?php
//CUPID
////CARD PROPERTIES

$card['name'] = "cupid";
$card['initiative'] = -1;
$card['rules'] = "make two people fall in love";
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
    $id1 = $utils->requestValue("id1");
    $id2 = $utils->requestValue("id2");

    function cupidRules($utils, $me, $to) { //function first, needs utils
        $toName = $utils->getPlayerName($to);

        $idDiv = "$('#" . $to . "')";
        $js = "$idDiv.click(function(){if(Game.info.status==1){return false}});" //prevent vote
                . "$idDiv.click(function(){flash('you are in love with $toName')});"; //remember is in love

        $php = "$me,$to";

        $utils->addPlayerRules("JS", $js, $me);
        $utils->addPlayerRules("PHP", $php, $me);
    }

    cupidRules($utils, $id1, $id2);
    cupidRules($utils, $id2, $id1);

    return true;
};

$card['statusGameChange'] = function($utils) { //statusGameChange have empty userId
    $rules = $utils->getPlayer("rulesPHP");
    if(empty($rules)){
        return;
    }
    
    $lovers = explode(",", $rules);
    $player1 = $utils->getPlayer(array("name", "status"), $lovers[0]);
    $player2 = $utils->getPlayer(array("name", "status"), $lovers[1]);
    if ($player1->status != $player2->status) {
        if ($player1->status > $player2->status) {
            $utils->setPlayer(array("status" => -1), $lovers[0]);
            $utils->setMessage("$player1->name kills himself for the love to $player2->name");
        } else {
            $utils->setPlayer(array("status" => -1), $lovers[1]);
            $utils->setMessage("$player2->name kills himself for the love to $player1->name");
        }
        //remove rules
        $utils->setPlayer(array("rulesPHP" => ''));
    }
};
?>

<script>

    Game.night.select = function (selectedId) {
        var first = $(".userCheck"); //check if exists

        $("#" + selectedId + " .votes").html("<symbol>N</symbol>");
        $("#" + selectedId).addClass("userCheck");

        if (first.length == 0) {
            return false; //wait next select
        }

        var id1 = first.attr("id");
        var id2 = selectedId;

        var name1 = $("#" + id1 + " .name").text();
        var name2 = $("#" + id2 + " .name").text();

        //cupid needs end turn manually!
        notify(name1 + " and " + name2 + " are now in love", function () {
            sleep();
            endTurn();

            var message1 = "You are now in love with " + name2 + "!";
            Game.request.setMessage(message1, id1);

            var message2 = "You are now in love with " + name1 + "!";
            Game.request.setMessage(message2, id2);

            Game.request.nightSelect({
                id1: id1,
                id2: id2
            }, true); //without response
        });

        return false;
    };

    Game.night.unselect = function (selectedId) {
        $("#" + selectedId + " .votes").html("");
    };

</script>
