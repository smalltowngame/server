<?php

// create default config.php if not exists
include_once 'config.php';

global $pdo;

//database credentials
if (!isset($database_location)) {
    $database_location = "localhost";
}
if (!isset($database_name)) {
    $database_name = "smalltown";
}
if (!isset($database_user)) {
    $database_user = "root";
}
if (!isset($database_pass)) {
    $database_pass = "";
}
if (isset($database_port) && !empty($database_port)) {
    $database_name .= ";port=$database_port";
}

try {
    $pdo = new PDO("mysql:host=$database_location;dbname=$database_name", $database_user, $database_pass);
} catch (PDOException $e) {
    include 'php/tables.php';

    try {
        $pdo = new PDO("mysql:host=$database_location;dbname=$database_name", $database_user, $database_pass);
    } catch (PDOException $e) {
        echo "Error!: " . $e->getMessage() . "<br/>";
    }
}

function petition($str, $values = null) {
    $sth = sql($str, $values);
    return $sth->fetchALL(PDO::FETCH_CLASS);
}

function sql($str, $values = null) {
    global $pdo;

    if (!isset($pdo)) {
        $error = "error: Wrong data base credentials on 'config.php' file.";
        global $admin_contact;
        if (isset($admin_contact) && !empty($admin_contact) && false != $admin_contact) {
            $error .= "<br/>Please contact with the site admin: " . $admin_contact;
        }
        exit($error);
    }

    try {
        $sth = $pdo->prepare($str);
        $stmt = $sth->execute($values);

        if (!$stmt) {
            PDOerror($sth, $str);
            exit;
        }
        return $sth;
    } catch (PDOException $e) {
        echo "111hjg";
        response(false, "ERROR: couldn't connect: " . print_r($e->getMessage()));
    }
}

function transaction($array) {
    global $pdo;
    $pdo->beginTransaction();
    $res = "";
    try {
        foreach ($array as $str) {
            $sth = $pdo->prepare($str);
            $stmt = $sth->execute(null);
            if (!$stmt) {
                PDOerror($sth, $str);
                exit;
            }
            $obj = $sth->fetchALL(PDO::FETCH_CLASS);

            if (!empty($obj)) {
                $obj = $obj[0];
            }
            foreach ($obj as $key => $value) {
                $res .= $value;
            }
        }

        $pdo->commit();

        return $res;
        //
    } catch (PDOException $e) {
        echo "transaction error";
    }
}

function PDOerror($sth, $str = '') {
    echo "\n PDO::errorInfo() (code:" + $sth->errorCode() + ") :\n";
    print_r($sth->errorInfo());
    echo " in: " . $str;

    if ($sth->errorCode() == '42S02') { //if table not exists
        include 'tables.php';
        echo "\n Tables has been created again.";
        //
    } else if ($sth->errorCode() == '42S22') { //if col error
        $array = $sth->errorInfo()[2];
        $col = split("'", $array)[1];
        $arrayName = split("\.", $col);
        $name = $arrayName[count($arrayName) - 1];
        include_once 'tables.php';
        $tables = new Tables;
        $tables->addColumn($name);
    }
}

function response($success, $str) {
    if ($success) {
        return $str;
    } else {
        return '{"type":"error","data":"' . $str . '"}';
    }
}

// SQL FUNCTIONS
$count = 0;

function addWHERE($name, $value) {
    if (!empty($value)) {
        global $str, $values, $count;
        if ($count > 0) {
            $str .= "AND ";
        }
        $str .= " WHERE " . $name . " = :" . $name;
        $values[$name] = $value;
        $count++;
    }
}

function getPOST($attr) {
    if (isset($_POST["$attr"]) && !empty($_POST["$attr"])) {
        return $_POST["$attr"];
    } else {
        return false;
    }
}
