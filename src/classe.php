<?php

class Episode
{
    private $name; 

    private $info; 
    
    private $eng_sub;

    private $eng_sub2;

    private $episode;

    //f1 Load All Episodes
    public function loadAllEpisodes(){
        include "conn.php";

        // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    try{
        $req = $conn -> prepare('select id , name , info , eng_sub from episode ORDER BY id DESC');
        $req -> execute();
        
        while($data = $req -> fetch())
        {
            ?>
                   <a href="./episode.php?id=<?php print $data['id'] ?>" > <?php print $data["info"] ?></a>         <br>
            <?php
        }
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }

    }
    //f1 end

    //f2 Load Last 8 episodes    
    public function loadLastEpisodes(){

        include "conn.php";

        // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }


    try{
        $req = $conn -> prepare('select name , info , eng_sub , episode from episode ORDER BY id DESC LIMIT 8');
        $req -> execute();
        
    
        while($data = $req -> fetch())
        {
            ?>
                               <li class="new">
                                    <a style="font-size:2rem; color:red;" href="./episode.php?id=<?php print $data["episode"]; ?>">
                                      
                                    
                                    <p style=" font-size:1.5rem; color:gray; max-height:40px; min-height:40px; overflow:hidden;" class="f14 iconGrayBox iconCategory"><?php print $data["episode"] ?> <?php print $data["name"] ?></p>
                                    <p class="img">
                                            <img src="./images/<?php print $data["episode"]; ?>.jpg" alt="one piece episode" title="one piece episode <?php print $data["episode"]; ?> streaming online for free" />
                                        </p>

                                      
                                        <p style=" font-size:1.5rem; color:gray; max-height:40px; min-height:40px; overflow:hidden;" class="f14 iconGrayBox iconCategory"><?php print $data["info"] ?></p>
                                        <div class="info">
                                           
                                        </div>
                                    </a>
                                </li>
            <?php
        }
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }

  
    
    }
    //f2 end
    
    //f3 Load informations about specific episode
    public function loadEpisode($id)
    {

        include "conn.php";

        // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }


    try{
        $req = $conn -> prepare('select name , info , eng_sub , episode , eng_sub2 from episode where episode = ?');
        $req -> execute(array($id));
        
    
        while($data = $req -> fetch())
        {
            $this -> setName($data['name']);
            $this -> setInfo($data['info']);
            $this -> setEng_sub($data['eng_sub']);
            $this -> setEng_sub2($data['eng_sub2']);
            $this -> setEpisode($data['episode']);
        }
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }

    }
    //f3 end 


    //f4 Load Distinct Arcs 
    public function loadArcs(){
        include "conn.php";

        // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }


    try{


        
        $req = $conn -> prepare('select DISTINCT arc from episode order by arc desc');
        $req -> execute();
        
        while($data = $req -> fetch())
        {

            // if ($data['arc'] == '43Silver Mine Arc (HS)') {
            if ($data['arc'] == 'xxx') {
               return;
            }

            

            ?>

            <h2 class="all_arc"><?php $str = substr($data['arc'], 2);  print $str;  ?></h2>

            <p class="arc">

            <?php


            $req2 = $conn -> prepare('select * from episode where arc = ? order by episode desc');
            $req2 -> execute(array($data['arc']));



            while($data2 = $req2 -> fetch()){

                ?>

         <a href="./episode.php?id=<?php print $data2['episode']; ?>">• <?php print $data2['episode']; ?>   <?php print $data2['name'];  ?> </a>
    
                <?php
    


            }

            



            ?>
            <!-- p.arc close balise -->
            </p>
           
            <?php 
        }
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }
    } 


    public function getlatestepisode(){
        include "conn.php";

        // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    try{
        $req = $conn -> prepare('select id , name , info , episode , eng_sub from episode ORDER BY ID DESC LIMIT 1');
        $req -> execute();
        
        while($data = $req -> fetch())
        {
          return $data['episode'];
        }
    }

    catch(PDOException $e) {
        echo "Error: " . $e->getMessage();
    }

    }


    /**
     * Get the value of name
     */ 
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set the value of name
     *
     * @return  self
     */ 
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get the value of info
     */ 
    public function getInfo()
    {
        return $this->info;
    }

    /**
     * Set the value of info
     *
     * @return  self
     */ 
    public function setInfo($info)
    {
        $this->info = $info;

        return $this;
    }

    /**
     * Get the value of eng_sub
     */ 
    public function getEng_sub()
    {
        return $this->eng_sub;
    }

    /**
     * Set the value of eng_sub
     *
     * @return  self
     */ 
    public function setEng_sub($eng_sub)
    {
        $this->eng_sub = $eng_sub;

        return $this;
    }

    /**
     * Get the value of eng_sub2
     */ 
    public function getEng_sub2()
    {
        return $this->eng_sub2;
    }

    /**
     * Set the value of eng_sub2
     *
     * @return  self
     */ 
    public function setEng_sub2($eng_sub2)
    {
        $this->eng_sub2 = $eng_sub2;

        return $this;
    }

    /**
     * Get the value of episode
     */ 
    public function getEpisode()
    {
        return $this->episode;
    }

    /**
     * Set the value of episode
     *
     * @return  self
     */ 
    public function setEpisode($episode)
    {
        $this->episode = $episode;

        return $this;
    }
}
