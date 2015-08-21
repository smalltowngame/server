<?php

class CardUtils {

    use Response,
        Utils,
        Connection;

    public $gameId = null;
    public $playId = null;
    public $values = null;

    function __construct($gameId, $playId, $values) {
        $this->gameId = $gameId;
        $this->playId = $playId;
        $this->requestValue = $values;
    }

    public function getPlayId() {
        return $this->playId;
    }

    public function getGame($select) {
        $gameId = $this->gameId;

        $values = array("select" => $select);
        $res = petition("SELECT :select FROM smltown_games WHERE id = $gameId", $values);
        if (count($res) > 0) {
            return $res[0][$select];
        }
    }

    public function getPlayerName($playId = null) {
        if (!isset($playId)) {
            $playId = $this->playId;
        }
        $values = array(
            'playId' => $playId
        );
        $player = petition("SELECT name FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE id = :playId)", $values);
        if (count($player) > 0) {
            if (count($player) > 1) {
                echo "multiple players with id = $playId";
            }
            return $player[0]->name;
        }
        return "";
    }

    public function getPlayers($wheres = null, $selects = null) {
        $gameId = $this->gameId;

        $sql = "SELECT ";

        if ($selects) {
            $sql .= selectArray($selects);
        } else {
            $sql .= " id, card, status, sel";
        }

        $sql .= " FROM smltown_plays WHERE gameId = $gameId";

        $values = array();
        foreach ($wheres as $key => $value) {
            if ($key != "card" && $key != "status" && $key != "sel") { //injection prevent
                echo "error: no valid key getPlayers on CardUtils";
                die();
            }
            $values[$key] = $value;
            $sql .= " AND $key = :$key";
        }
        return petition($sql, $values);
    }

    public function getPlayersCard($card, $like = null, $dead = null) {
        $gameId = $this->gameId;

        $values = array();
        $sql = "SELECT * FROM smltown_plays WHERE gameId = $gameId AND card";

        if ($like) { //all kind
            $values['card'] = "%_$card";
            $sql .= " LIKE ";
        } else {
            $values['card'] = "$card";
            $sql .= " =";
        }
        $sql .= " :card";

        if (!isset($dead) || !$dead) { //include dead players
            $sql .= " AND status > 0";
        }

        return petition($sql, $values);
    }

    public function getPlayer($selects = null, $playId = null) {
        $gameId = $this->gameId;
        if (!$playId) {
            $playId = $this->playId;
        }
        $values = array(
            'playId' => $playId
        );

        $sql = "SELECT smltown_plays.id";

//        echo 33;
        if (!is_array($selects)) {
            echo "; playId = $playId; ";
            if ($selects) { //single value
//                echo "; selects = $selects; ";
                $sql .= ", $selects";
            } else {
                $sql .= ", name, admin, card, rulesJS, rulesPHP, status, sel, message";
            }
            //IS ARRAY
        } else {
            for ($i = 0; $i < count($selects); $i++) {
                $sql .= " ,$selects[$i]";
            }
        }
        $plays = petition("$sql FROM smltown_plays"
                //add players name table
                . " LEFT OUTER JOIN smltown_players"
                . " ON smltown_plays.userId = smltown_players.id"
                //
                . " WHERE smltown_plays.id = :playId", $values);
        if (count($plays) == 0) {
            echo "error to get player with id = $playId";
            return;
        }
        $result = $plays[0];
        if ($selects && !is_array($selects)) {
//            echo "; result = " . json_encode($result);
//            echo "; end = " . $result->$selects;
            return $result->$selects; //return only the atribute
        }
        return $result;
    }

    public function setPlayer($array, $playId = null) {
        $gameId = $this->gameId;

        if (!$playId) {
            $playId = $this->playId;
        }

        $values = array('playId' => $playId);
        $sql = "UPDATE smltown_plays SET";
        $i = 0;
        foreach ($array as $key => $value) {
            if (!$key == "card" && !$key == "status" && !$key == "sel") { //injection prevent
                return "error: no valid key";
            }
            $values[$key] = $value;
            $sql .= " $key = :$key";

            $i++;
            if ($i < count($array)) {
                $sql .= ",";
            }
            if ($key == "card") {
                
            }
        }
        $sql .= " WHERE gameId = $gameId AND id = :playId";
        sql($sql, $values);

        foreach ($array as $key) {
            if ($key == "card") {
                $this->updateUsers($playId, $key);
            }
        }
    }

    public function setPlayers($array, $wheres = null) {
        $gameId = $this->gameId;

        $sql = "UPDATE smltown_plays SET";
        $i = 0;
        foreach ($array as $value) {
            $sql .= " $value";
            $i++;
            if ($i < count($array)) {
                $sql .= ",";
            }
        }
        $sql .= " WHERE gameId = $gameId";

        foreach ($wheres as $value) {
            $sql .= " AND $value";
        }

        sql($sql);
    }

    public function addPlayerRulesJS($rules, $playId = null) {
        $gameId = $this->gameId;
        if (!isset($playId)) {
            $playId = $this->playId;
        }

        $values = array(
            'playId' => $playId,
            'rules' => $rules
        );
        sql("UPDATE smltown_plays SET rulesJS = CONCAT(rulesJS, ';' , :rules)"
                . " WHERE gameId = $gameId AND id = :playId", $values);
        $this->updateUsers($playId, "rulesJS");
    }

    public function addPlayerRulesPHP($rules, $playId = null) {
        $gameId = $this->gameId;
        if (!isset($playId)) {
            $playId = $this->playId;
        }

        $values = array(
            'playId' => $playId,
            'rules' => $rules
        );
        sql("UPDATE smltown_plays SET rulesPHP = :rules"
                . " WHERE gameId = $gameId AND id = :playId", $values);
    }

    public function kill($playId) {
        return $this->hurtPlayer($playId);
    }

    public function suicide() {
        $playId = $this->playId;
        return $this->killPlayer($playId);
    }

    public function endGame() {
        $gameId = $this->gameId;
//        $endStatus = count($this->TURNS);
        $endStatus = 5; //PATCH. TODO: $this->TURNS (only breaks on websocket!)
        echo "status = $endStatus";
        $this->updatePlayers(null, array("status", "card"));
        sql("UPDATE smltown_games SET status = $endStatus WHERE id = $gameId");
        $this->updateGame();
    }

    public function requestValue($value) {
        return $this->requestValue->$value;
    }

    public function response($type, $obj = array()) {
        $playId = $this->playId;
        $obj['type'] = $type;
        $this->send_response(json_encode($obj), $playId);
    }

//    public function getPlayIdByCard($card) {
//        $gameId = $this->gameId;
//        $values = array('card' => $card);
//        return petition("SELECT id FROM smltown_plays WHERE gameId = $gameId AND card = $card", $values);
//    }

    public function setMessage($message, $id = null) {
        $this->saveMessage($message, $id);
    }

    public function update_players($value) {
        $this->updatePlayers(null, $value);
    }

    public function setGame($array) {
        $gameId = $this->gameId;

        $sql = "UPDATE smltown_games SET ";
        $i = 0;
        foreach ($array as $value) {
            $sql .= " $value";
            $i++;
            if ($i < count($array)) {
                $sql .= ",";
            }
        }
        sql("$sql WHERE id = $gameId");
    }

}
