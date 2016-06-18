<?php

class Tables {

    //TABLES OBJECT
    private $tables = array(
        'smltown_games' => array(
            'id' => "int(11) UNSIGNED NOT NULL AUTO_INCREMENT",
            'name' => "varchar(255) UNIQUE not null",
            'password' => "varchar(255)",
            //game status
            'type' => "varchar(255) DEFAULT 'mafia-werewolf'",
            'status' => "int(11) NOT NULL DEFAULT 0",
            'cards' => "text",
            'night' => "varchar(255)",
            'timeStart' => "bigint(20)",
            'time' => "bigint(20)",
            //admin options
            'dayTime' => "int(11)",
            'openVoting' => "int(1)",
            'endTurn' => "int(1) DEFAULT 1",            
            //data
            'players' => "int(11)",
            //
            'ISO' => "varchar(255)",
            'lastConnection' => "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP",
            'PRIMARY KEY' => "(id)"
        ),
        'smltown_players' => array(
            'id' => "varchar(255) UNIQUE NOT NULL",
            'email' => "varchar(255)",
            'name' => "varchar(255)",
            'lang' => "varchar(255)",
            'ISO' => "varchar(255)",
            'picture' => "varchar(255)",
            'type' => "varchar(255)",
            'socialId' => "varchar(255) UNIQUE",
            'facebook' => "varchar(255) UNIQUE",
            'gameId' => "int(11)",
            'friends' => "text NOT NULL DEFAULT ''",
            'reply' => "text NOT NULL DEFAULT ''",
            'websocket' => "int(11) DEFAULT 0",
            'lastConnection' => "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP",
            'PRIMARY KEY' => "(id)"
        ),
        'smltown_plays' => array(
            'id' => "int(11) UNSIGNED NOT NULL AUTO_INCREMENT", //phpmyqdmin edit
            'userId' => "varchar(255) NOT NULL",
            'gameId' => "int(11) UNSIGNED NOT NULL",
            'admin' => "int(11) NOT NULL DEFAULT -1",
            'card' => "varchar(255)",
            'rulesPHP' => "text",
            'rulesJS' => "text",
            'status' => "int(11)",
            'sel' => "int(11)",
            'message' => "text",
            'social' => "varchar(255)",
            'reply' => "text NOT NULL DEFAULT ''",
            'PRIMARY KEY' => "(id)"
        )
    );

    private function getTables() {
        //add dinamical values
        require_once dirname(__FILE__) . '/../config.php';
        if (!isset($publicGames)) {
            $publicGames = 1;
        }
        $this->tables['smltown_games']['public'] = "int(1) DEFAULT $publicGames";
        return $this->tables;
    }

    public function createDB() {
        $config = dirname(__FILE__) . '/../config.php';
        if (!file_exists($config)) {
            echo "console.log('updating config.php?')";
            return;
        }
        
        //require -> inside this function
        require dirname(__FILE__) . '/../config.php';
        
        $enlace = mysqli_connect("localhost", $database_user, $database_pass);
        if (!$enlace) {
            echo 'IS YOUR MYSQL WORKING? - WRONG DB CREDENTIALS?';
            return;
        }
        //$dbh = new PDO('mysql:host=localhost',$database_user,$database_pass); 
        //if (!$dbh) {
        //    echo 'IS YOUR MYSQL WORKING? - WRONG DB CREDENTIALS?';
        //    return;
        //}
        //
        
        $sql = 'CREATE DATABASE smalltown';
        if (mysqli_query($enlace, $sql)) {
            echo "smalltown data base was created successfully. \n";
        } else {
            echo mysql_error() . "\n";
        }
        //try{
        //    $dbh->exec($sql);
        //    echo "smalltown data base was created successfully. \n";
        //}catch(PDOException $e){
        //    die("DB ERROR: ". $e->getMessage());
        //}
    }

    public function createTables() {
        $tables = $this->getTables();
        foreach ($tables as $tablename => $array) {
            $sth = sql($this->createTableSring($tablename, $array));
            echo $this->createTableSring($tablename, $array);
            if ($sth->rowCount() > 0) { //nothing changes
                echo "Table $tablename created successfully. ";
            }
        }
    }

    public function createTableSring($tablename, $array) {
        $sql = "CREATE TABLE IF NOT EXISTS $tablename(";
        $keys = array_keys($array);
        $last_key = end($keys);
        foreach ($array as $key => $value) {
            $sql = "$sql $key $value";
            if ($key != $last_key) {
                $sql = "$sql,";
            }
        }
        return "$sql)";
    }

    public function addColumn($columnName) {
        $tables = $this->getTables();
        foreach ($tables as $tablename => $array) {
            foreach ($array as $colNames => $value) {
                if ($columnName == $colNames) {
                    $sth = sql("SHOW COLUMNS FROM $tablename LIKE '$columnName'");
                    $exists = ($sth->rowCount()) ? TRUE : FALSE;

                    if (!$exists) {
                        petition("ALTER TABLE $tablename ADD $columnName $value");
                    }
                }
            }
        }
    }

}

//default
include_once dirname(__FILE__) . '/DB.php';
$tables = new Tables;
$tables->createDB();
$tables->createTables();
