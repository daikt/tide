$(function() {

  // 8 user colors.
  var user_colors = [
    'rgba(255,   0,   0, 1.0)',  // red
    'rgba(  0, 255,   0, 1.0)',  // green
    'rgba(  0,   0, 255, 1.0)',  // blue
    'rgba(  0, 255, 255, 1.0)',  // cyan
    'rgba(255, 165,   0, 1.0)',  // orange
    'rgba(  0, 128, 128, 1.0)',  // teal
    'rgba(255,   0, 255, 1.0)',  // magenda
    'rgba(128,   0, 128, 1.0)'   // purple
  ];

  var MAX_USER = 8;
  var user_num = 0;

  var extent = [0, 0, 900, 500];
  var projection = new ol.proj.Projection({
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
  var layers = [];
  var imgs = [];
  $.ajax({
    url: "/tide/php/getFileList.php",
    cache: false,
    error: function(msg) {
      console.log(msg);
    },
    success: function(json) {

      // レイヤリスト生成
      var data = $.parseJSON(json);
      for (var i=0; data[i]; i++) {
        var imgfile = "/tide" + data[i].image.substr(2);
        //console.log(imgfile);
        var tmp_layer = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            url: imgfile,
            projection: map.getView().getProjection(),
            imageExtent: extent
          })
        });
        layers.push(tmp_layer);
        imgs.push(imgfile);
      }
      map.addLayer(layers[0]);

    }
  });

  // Start
  var timer=null;
  $('#start_btn').click(function(){
      // レイヤを切換えて表示する
      var j=1;
      timer = setInterval(function(){
        map.addLayer(layers[j]);
        $('#fn_area label').text(imgs[j]);
        // 画面がチラつくので５個前から削除する
        if (j > 5) {
          map.removeLayer(layers[j-6]);
        }
        j++;
        //j=layers.length;
        if (j >= layers.length){
          clearInterval(timer);
        }
      }, 100);
  });

  // Reset
  $('#reset_btn').click(function(){
    console.log("reset click.");
    //location.reload();
    if (timer != null) {
      clearInterval(timer);
    }
    map.getLayers().clear();
    map.addLayer(layers[0]);
    user_num = 0;
  });

  // confirm user points.
  map.on('click', function(evt) {

    if (user_num >= MAX_USER) {
      console.log("max user over.");
      return false;
    }

    var OFFSET_i = 1150;
    var OFFSET_j = 850;
    var tmp = [
      Math.floor(evt.coordinate[0] + OFFSET_i),
      Math.floor(evt.coordinate[1] + OFFSET_j)
    ];
    console.log("tmp = " + tmp);
    var file_name = "/" + tmp[1] + "/" + tmp[0] + "_" + tmp[1] + ".dat";
    console.log("file_name = " + file_name);

    var coordinate = evt.coordinate;
    console.log(coordinate);

    // Create a circle feature
    var circle = new ol.geom.Circle(coordinate, 1); // radius is 1px.
    var circleFeature = new ol.Feature(circle);

    // set features to marker source.
    var markerSource = new ol.source.Vector({
      features: [circleFeature]
    });

    // set marker style.
    user_color = user_colors[user_num++];
    var markerStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: user_color
      })
    });

    // set source to layer.
    var markerLayer = new ol.layer.Vector({
      source: markerSource,
      style: markerStyle
    });

    map.addLayer(markerLayer);


  });

});
