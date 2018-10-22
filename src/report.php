<?php

include "conn.php";

     // Check connection
     if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    try{
        $req = $conn -> prepare('INSERT INTO report(email , message , episode) VALUES( "' . $_POST["email"] . '" , "' . $_POST["message"] . '" , "' . $_POST["episode"] . ' " )');                           
        $req -> execute();
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }
