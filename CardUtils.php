<?php

class CardUtils {

    private static $obj = null;
    private static $gameId = null;
    private static $userId = null;

    function __construct($obj) {
        if (isset($obj))
            self::$obj = $obj;
        if (isset($obj->gameId))
            self::$gameId = $obj->gameId;
        if (isset($obj->userId))
            self::$userId = $obj->userId;
    }

    public function getUserId() {
        return self::$userId;
    }
	
	public function getGame($select){
		$gameId = self::$gameId;
		$values = array("select" => $select);
		$res = petition("SELECT :select FROM games WHERE id = $gameId", $values);
		if(count($res) > 0){
			return $res[0][$select];
		}
	}

    public function getPlayerName($id = null) {
        if (!isset($id)) {
            $id = self::$userId;
        }
        $values = array(
            'id' => $id
        );
        $player = petition("SELECT name FROM players WHERE id = :id", $values);
        if (count($player) > 0) {
            if (count($player) > 1) {
                echo "multiple players with id = $id";
            }
            return $player[0]->name;
        }
        return "";
    }

    public function getPlayers($wheres = null, $selects = null) {
        $gameId = self::$gameId;
        $sql = "SELECT";

        if ($selects) {
            $sql = "$sql " . selectArray($selects);
        } else {
            $sql = "$sql userId, card, status, sel";
        }

        $sql = "$sql FROM plays WHERE gameId = $gameId";

        $values = array();
        foreach ($wheres as $key => $value) {
            if ($key != "card" && $key != "status" && $key != "sel") { //injection prevent
                echo "error: no valid key getPlayers on CardUtils";
                die();
            }
            $values[$key] = $value;
            $sql = "$sql AND $key = :$key";
        }
        return petition($sql, $values);
    }

    public function getPlayersCard($card, $like = null, $dead = null) {
        $gameId = self::$gameId;
        $values = array();
        $sql = "SELECT * FROM plays WHERE gameId = $gameId AND card";

        if ($like) { //all kind
            $values['card'] = "%_$card";
            $sql = "$sql LIKE ";
        } else {
            $values['card'] = "$card";
            $sql = "$sql =";
        }
        $sql = "$sql :card";

        if (!isset($dead) || !$dead) { //include dead players
            $sql = "$sql AND status > 0";
        }

        return petition($sql, $values);
    }

    public function getPlayer($selects = null, $id = null) {
        $gameId = self::$gameId;
        if (!$id) {
            if (!self::$userId) {
                echo "Bad use of cardUtils->getPlayer. not self:userId is defined when requests: " . json_encode($selects);
                return false;
            }
            $id = self::$userId;
        }
        $values = array(
            'userId' => $id
        );
	
        $sql = "SELECT userId";

        if (!is_array($selects)) {
            if ($selects) { //single value
                $sql = "$sql ,$selects";
            } else {
                $sql = "$sql, name, admin, card, rulesJS, rulesPHP, status, sel, message";
            }
            //IS ARRAY
        } else {
            for ($i = 0; $i < count($selects); $i++) {
                $value = $selects[$i];
                $sql = "$sql ,$selects[$i]";
            }
        }
        $result = petition("$sql FROM plays, players WHERE gameId = $gameId AND plays.userId = :userId AND players.id = :userId", $values)[0];
        if ($selects && !is_array($selects)) {
            return $result->$selects; //return only the atribute
        }
        return $result;
    }

    public function setPlayer($array, $id = null) {
        $gameId = self::$gameId;
        if (!$id) {
            $id = self::$userId;
        }
		
		$updateValues = array("card", "status", "rulesJS");

        $values = array('userId' => $id);
        $sql = "UPDATE plays SET";
        $i = 0;
        foreach ($array as $key => $value) {
            if (!$key == "card" && !$key == "status" && !$key == "sel") { //injection prevent
                return "error: no valid key";
            }
            $values[$key] = $value;
            $sql = "$sql $key = :$key";

            $i++;
            if ($i < count($array)) {
                $sql = "$sql,";
            }
            if ($key == "card") {
                
            }
        }
        $sql = "$sql WHERE gameId = $gameId AND userId = :userId";
        sql($sql, $values);

        foreach ($array as $key) {
            if ($key == "card") {
                updateUsers($gameId, $id, $key);
            }
        }
		
		
    }

    public function addPlayerRules($kind, $rules, $id = null) {
        $kind = strtoupper($kind);
        $gameId = self::$gameId;
        if (!isset($id)) {
            $id = self::$userId;
        }
        $values = array(
            'userId' => $id,
            'rules' => $rules
        );
        sql("UPDATE plays SET rules$kind ="
			. " CASE WHEN rules$kind = '' THEN CONCAT(rules$kind, ';', :rules) ELSE :rules END"
			. " WHERE gameId = $gameId AND userId = :userId", $values);
        updateUsers($gameId, $id, "rules$kind");
    }

    public function kill($id) {
        $gameId = self::$gameId;
        return hurtPlayer($gameId, $id);
    }

    public function suicide() {
        $gameId = self::$gameId;
        $userId = self::$userId;
        return killPlayer($gameId, $userId);
    }

    public function endGame() {
        $gameId = self::$gameId;
        sql("UPDATE games SET status = 3 WHERE id = $gameId");
        updateGame($gameId);
    }

    public function requestValue($value) {
        $obj = self::$obj;
        return $obj->$value;
    }

    public function send_response($userId, $type, $obj = array()) {
        $gameId = self::$gameId;
        $obj['type'] = $type;
        send_response(json_encode($obj), $gameId, $userId);
    }

    public function getUserIdByCard($card) {
        $values = array('card' => $card);
        return petition("SELECT userId FROM plays WHERE card = $card", $values);
    }

    public function setMessage($message, $id = null) {
        $gameId = self::$gameId;
        saveMessage($message, $gameId, $id);
    }

//    public function updatePlayers($array, $wheres, $userId = null) {
//        $gameId = self::$gameId;
//        if (null == $userId) {
//            $userId = self::$userId;
//        }
//        $res = array(
//            'type' => "update",
//            'players' => petition("SELECT userId, "
//                    . "CASE WHEN $wheres THEN $array ELSE null END as $array "
//                    . "FROM plays WHERE gameId = $gameId")
//        );
//        send_response(json_encode($res), $gameId, $userId);
//    }
}
