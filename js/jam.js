$(function() {

  var extent = [0, 0, 900, 500];
  var projection = new ol.proj.Projection({
    code: 'xkcd-image',
    units: 'pixels',
    extent: extent
  });

  var map = new ol.Map({
    layers: [],
    target: 'map',
    view: new ol.View({
      projection: projection,
      center: ol.extent.getCenter(extent),
      zoom: 2,
      minZoom: 2,
      maxZoom: 4
    })
  });

  // サーバから画像ファイル名リストを取得する
  $.ajax({
    url: "/tide/php/getFileList.php",
    cache: false,
    error: function(msg) {
      console.log(msg);
    },
    success: function(json) {

      var data = $.parseJSON(json);

      // レイヤリスト生成
      var layers = [];
      var imgs = [];
      for (var i=0; data[i]; i++) {
        var imgfile = "/tide" + data[i].image.substr(2);
        console.log(imgfile);
        var tmp_layer = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            url: imgfile,
            projection: projection,
            imageExtent: extent
          })
        });
        layers.push(tmp_layer);
        imgs.push(imgfile);
      }

      // レイヤを切換えて表示する
      var j=0;
      var timer = setInterval(function(){
        map.addLayer(layers[j]);
        $('#fn_area label').text(imgs[j]);
        // 画面がチラつくので５個前から削除する
        if (j > 5) {
          map.removeLayer(layers[j-6]);
        }
        j++;
        if (j >= layers.length){
          clearInterval(timer);
        }
      }, 100);

    }
  });

});
