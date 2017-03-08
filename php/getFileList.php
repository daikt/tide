<?php

  $dir = "../matsuoka/image/" ;

  // ディレクトリの存在を確認し、ハンドルを取得
  if( is_dir( $dir ) && $handle = opendir( $dir ) ) {

    // ループ処理
    while( ($file = readdir($handle)) !== false ) {
      // ファイルのみ取得
      if( filetype( $path = $dir . $file ) == "file" ) {
        $json[] = array("image" => $path);
      }
    }

    sort($json);

    $json = json_encode($json);
    header("Content-Type: text/javascript; charset=utf-8");
    print_r($json);

  }

?>
