<?php

$res = array();
$res["status"] = 0;

try{
  //$ret = $db->getMarkerStructure($GRIASAuth->getUserID());
  $dir = "../matsuoka/image/" ;

  // ディレクトリの存在を確認し、ハンドルを取得
  if( is_dir( $dir ) && $handle = opendir( $dir ) ) {
    // ループ処理
    while( ($file = readdir($handle)) !== false ) {
      // ファイルのみ取得
      if( filetype( $path = $dir . $file ) == "file" ) {
        echo $path ;
      }
    }
  }

  $json_array = json_decode($ret[0]["marker_structure"], true);

  if($json_array != false){
    $res["result"] = $json_array;
  }else{
    $res["status"] = 1;
  }
}catch(Exception $e){
  $res["status"] = 1;
}

header("Content-Type: application/json; charset=utf-8");
echo json_encode($res);

?>
