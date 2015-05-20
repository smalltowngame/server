<?php

class Tables {

    //TABLES OBJECT
    public $tables = array(
        'games' => array(
            'id' => "int(11) UNSIGNED NOT NULL AUTO_INCREMENT",
            'name' => "varchar(255) UNIQUE not null",
            'password' => "varchar(255)",
            'status' => "int(11) NOT NULL",
            'cards' => "text",
            'night' => "varchar(255)",
            'time' => "bigint(20)",
            'dayTime' => "int(11)",
            'openVoting' => "int(1)",
            'endTurn' => "int(1)",
            'admin' => "int(1) NOT NULL default 0",
            'chat' => "text NOT NULL default ''",
            'lastConnection' => "timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP",
            'PRIMARY KEY' => "(id)"
        ),
        'players' => array(
            'id' => "varchar(255) UNIQUE NOT NULL",
            'name' => "varchar(255)",
            'lastConnection' => "timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP",
            'PRIMARY KEY' => "(id)"
        ),
        'plays' => array(
            'id' => "int(11) UNSIGNED NOT NULL AUTO_INCREMENT", //phpmyqdmin edit
            'userId' => "varchar(255) NOT NULL",
            'gameId' => "int(11) UNSIGNED NOT NULL",
            'admin' => "int(11)",
            'card' => "varchar(255)",
            'rulesPHP' => "text",
            'rulesJS' => "text",
            'status' => "int(11)",
            'sel' => "int(11)",
            'message' => "varchar(255)",
            'reply' => "text NOT NULL default ''",
            'PRIMARY KEY' => "(id)"
        )
    );

    function createDB() {
        require 'DB_access.php'; //not once?
        $enlace = mysqli_connect("localhost", $database_user, $database_pass);
        if (!$enlace) {
            echo 'IS YOUR MYSQL WORKING? - WRONG DB CREDENTIALS?';
            die();
        }

        $sql = 'CREATE DATABASE smalltown';
        if (mysqli_query($enlace, $sql)) {
            echo "smalltown data base was created successfully. \n";
        } else {
            echo mysql_error() . "\n";
        }
    }

    function createTables() {
        foreach ($this->tables as $tablename => $array) {            
            $sth = sql($this->createTableSring($tablename, $array));
            echo $this->createTableSring($tablename, $array);
            if ($sth->rowCount() > 0) { //nothing changes
                echo "Table $tablename created successfully. ";
            }
        }
    }

    function createTableSring($tablename, $array) {
        $sql = "CREATE TABLE IF NOT EXISTS $tablename(";
        $last_key = end(array_keys($array));
        foreach ($array as $key => $value) {
            $sql = "$sql $key $value";
            if ($key != $last_key) {
                $sql = "$sql,";
            }
        }
        return "$sql)";
    }

    function addColumn($columnName) {
        foreach ($this->tables as $tablename => $array) {
            foreach ($array as $colNames => $value) {
                if ($columnName == $colNames) {
                    sql("ALTER TABLE $tablename ADD $columnName $value");
                    return;
                }
            }
        }
    }

}

//default
include_once 'DB.php';
$tables = new Tables;
$tables->createDB();
$tables->createTables();
