$(function() {

  // 8 user colors.
  var user_colors = [
    'rgba(255,   0,   0, 1.0)',  // Red
    'rgba(  0, 255,   0, 1.0)',  // Green
    'rgba(  0, 255, 255, 1.0)',  // Cyan
    'rgba(255, 165,   0, 1.0)',  // Orange
    'rgba(  0, 128, 128, 1.0)',  // Teal
    'rgba(255,   0, 255, 1.0)',  // Magenda
    'rgba(176, 224, 230, 1.0)',  // PowderBlue
    'rgba(178,  34,  34, 1.0)'   // FireBrick
  ];

  var MAX_USER = 8;
  var user_num = 0;
  var user_data = [];
  var CALCULATED_DATA_PATH = "/tide/matsuoka/data/track";
  var OFFSET_i = 1150.0;
  var OFFSET_j = 850.0;
  var OFFSET_LONLAT_i = 115.0;
  var OFFSET_LONLAT_j = 10.1;

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
          }),
          name: 'image_' + i
        });
        layers.push(tmp_layer);
        imgs.push(imgfile);
      }
      map.addLayer(layers[0]);

    }
  });

  // ---------------------------------
  // Start
  // ---------------------------------
  var timer=null;
  var timer_dot=null;
  $('#start_btn').click(function(){

    console.log("start click.");

    /*
    // --- ベースマップを切り替える ---
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
    */

    var layers = map.getLayers();
    var length = layers.getLength();
    //var geoms = [];
    var srcs = [];
    for (var i = 0; i < length; i++) {
      var lt = layers.item(i).get('name').substr(0,3);
      if (lt === "dot") {
        var tmpLayer = layers.item(i);
        var src = tmpLayer.get('source');
        //var fts = src.getFeatures();
        //var fts_len = fts.length;
        //var geom = fts[0].getGeometry();
        //geoms.push(geom);
        srcs.push(src);
      }
    }

    // --- move each users's dots. ---
    j=1; // timer cycle counter
    timer_dot = setInterval(function(){

      // add dots
      for (var i=0; i<srcs.length; i++) {
        var tmp_pnt = getCoor(user_data[i].value[j]);
        //console.log(tmp_pnt + " j=" + j);
        var dot = new ol.geom.Circle(tmp_pnt, 1);
        var ft = new ol.Feature(dot);
        srcs[i].addFeature(ft);

        var dist = getDistance(user_data[i].value[j]);
        $('#lbdist' + i).html(Math.floor(dist));
      }

      //// move dots only
      //for (var i=0; i<geoms.length; i++) {
      //  var tmp_pnt = getCoor(user_data[i].value[j]);
      //  geoms[i].setCenter(tmp_pnt);
      //  console.log(tmp_pnt + " j=" + j);
      //}

      j++;

    }, 10);

    // take into username.
    var user_names = [];
    for (var i=0; i<user_num; i++) {
      user_names.push($('#un' + i).val());
    }

    // create ranking area.
    $('#ranking p').remove();
    $('#ranking table').remove();
    $('#ranking').append('<table></table>');
    for (var i=0; i<user_num; i++) {
      $('#ranking table').append(
        $('<tr height="40"></tr>')
          .append('<td width="50"><label id="lb' + i + '">' + user_names[i] + '</label></td>')
          .append('<td><label id="lbsepa' + i + '"> : </label></td>')
          .append('<td><label id="lbdist' + i + '">999</label></td>')
      );
      $('#lb' + i).css('color', user_colors[i]);
      $('#lbsepa' + i).css('color', user_colors[i]);
      $('#lbdist' + i).css('color', user_colors[i]);
    }

  });

  // ---------------------------------
  // get display point.
  // ---------------------------------
  function getCoor(dat) {
    var arr = dat.split('\t');
    var tmp_i = ((arr[0] - OFFSET_LONLAT_i) * 10);
    var tmp_j = ((arr[1] - OFFSET_LONLAT_j) * 10);
    var ret = [Math.floor(tmp_i), Math.floor(tmp_j)];
    return ret;
  }

  // ---------------------------------
  // get distance specified point.
  // ---------------------------------
  function getDistance(dat) {
    var arr = dat.split('\t');
    return arr[2];
  }

  // ---------------------------------
  // Reset
  // ---------------------------------
  $('#reset_btn').click(function(){
    console.log("reset click.");
    //location.reload();
    if (timer != null) {
      clearInterval(timer);
    }
    if (timer_dot != null) {
      clearInterval(timer_dot);
    }
    map.getLayers().clear();
    map.addLayer(layers[0]);
    user_data = [];
    user_num = 0;

    $('#ranking p').remove();
    $('#ranking table').remove();
  });

  // ---------------------------------
  // confirm user points.
  // ---------------------------------
  map.on('click', function(evt) {

    if (user_num >= MAX_USER) {
      console.log("max user over.");
      return false;
    }

    var tmp = [
      Math.floor(evt.coordinate[0] + OFFSET_i),
      Math.floor(evt.coordinate[1] + OFFSET_j)
    ];
    console.log("tmp = " + tmp);
    var fpath = CALCULATED_DATA_PATH + "/" + tmp[1] + "/" + tmp[0] + "_" + tmp[1] + ".dat";
    console.log("fpath = " + fpath);

    // read the user selected point data.
    $.ajax({
      url: fpath,
      cache: false,
      error: function(msg) {
        console.log(msg);
      },
      success: function(dat) {
        //console.log(dat);
        var tmp = new Object();
        tmp.value = dat.split('\n');;
        user_data.push(tmp);
      }
    });

    // create a circle feature.
    var coordinate = evt.coordinate;
    console.log(coordinate);
    var circle = new ol.geom.Circle(coordinate, 1); // radius is 1px.
    var circleFeature = new ol.Feature(circle);
    circleFeature.setId(user_num);

    // set features to marker source.
    var markerSource = new ol.source.Vector({
      features: [circleFeature]
    });

    // set marker style.
    user_color = user_colors[user_num];
    var markerStyle = new ol.style.Style({
      fill: new ol.style.Fill({
        color: user_color
      })
    });

    // set source to layer.
    var markerLayer = new ol.layer.Vector({
      source: markerSource,
      style: markerStyle,
      name: 'dot_' + user_num
    });

    map.addLayer(markerLayer);
    user_num++;

  });

  // ---------------------------------
  // Set
  // ---------------------------------
  $('#set_btn').click(function(){
    $('#ranking p').remove();
    $('#ranking table').remove();
    for (var i=0; i<MAX_USER; i++) {
      var user_no = (i + 1);
      $('#ranking').append(
        $('<p></p>').append('<label id="lb' + i + '"># ' + user_no + ' </label>')
                    .append('<input id="un' + i + '" type="text" size="20">')
      );
      $('#lb' + i).css('color', user_colors[i]);
    }
  });

  // ---------------------------------
  // Stop
  // ---------------------------------
  $('#stop_btn').click(function(){
    if (timer != null) {
      clearInterval(timer);
    }
    if (timer_dot != null) {
      clearInterval(timer_dot);
    }
  });

});
