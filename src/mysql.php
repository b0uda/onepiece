<?php


$servername = "localhost";
$username = "root";
$password = "mysql";
$dbname = "onepiece";








    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        // set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sql = "UPDATE episode SET eng_sub = 'https://www.mp4upload.com/embed-wqxkykbbclyw.html' , eng_sub2 = '' WHERE episode = 685";
        // use exec() because no results are returned
        $conn->exec($sql);
        echo "New record created successfully";
        }



    catch(PDOException $e)
        {
        echo $sql . "<br>" . $e->getMessage();
        }





$conn = null;




?>

