<?php
$arrContextOptions=array(
    "ssl"=>array(
        "verify_peer"=>false,
        "verify_peer_name"=>false,
    ),
);  

$response = file_get_contents($_GET['url'], false, stream_context_create($arrContextOptions));

echo $response; ?>