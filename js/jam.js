$(function() {

  var map = new OpenLayers.Map(
    "map",
    {
      // 地図の表示段階数
      numZoomLevels: 4
      // 地図の表示解像度
      //resolutins: [0.25, 0.5, 1.0, 2.0]
    }
  );

  var layer = new OpenLayers.Layer.Image(
    "Image LAyer",
    "/tide/matsuoka/image/initial.bmp",
    new OpenLayers.Bounds(0,0,900,500), // 画像を投影する矩形の左下・右上座標
    new OpenLayers.Size(900,500)
  );

  map.addLayers([layer]);
  map.setCenter(new OpenLayers.LonLat(450, 250));


/*
  $.ajax({
    url: "/tide/php/getFileList.php",
    cache: false,
    error: function(msg) {
      console.log(msg);
    },
    success: function(json) {

      var data = $.parseJSON(json);
      var i=0;
      var timer = setInterval(function(){
        var imgfile = "/tide" + data[i++].image.substr(2);
        console.log(imgfile);
        $('#tide_image').attr('src', imgfile);
        $('#fn_area label').text(imgfile);
        if (i >= data.length){
          clearInterval(timer);
        }
      }, 100);

    }
  });
*/


});
