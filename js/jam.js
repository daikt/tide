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
  var CALCULATED_DATA_PATH = "/tide/matsuoka/data/track";
  var OFFSET_i = 1150.0;
  var OFFSET_j = 850.0;
  var OFFSET_LONLAT_i = 115.0;
  var OFFSET_LONLAT_j = 10.1;
  var GOAL_POINT = [590, 244];
  var user_num = 0;
  var user_data = [];

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

  // delete unuse DOM.
  $('.ol-overlaycontainer-stopevent').remove();

  // サーバから画像ファイル名リストを取得する
  var layers = [];
  var imgs = [];
  var icoLayer;
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

      // set goal layer.
      var icoStyle = new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          opacity: 0.75,
          src: '/tide/img/goal_64.png'
        }))
      });
      var icoFeature = new ol.Feature({
        geometry: new ol.geom.Point(GOAL_POINT),  // goal point
        name: 'JAMSTEC Island',
      });
      icoFeature.setStyle(icoStyle);
      var icoSource = new ol.source.Vector({
        features: [icoFeature]
      });
      icoLayer = new ol.layer.Vector({
        source: icoSource,
        name: 'goal'
      });
      map.addLayer(icoLayer);

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
      var ta = imgs[j].substr(34,4);
      $('#time_area').html('20xx/' + ta.substr(0,2) + '/' + ta.substr(2,2));
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
      var dist_arr = [];
      var dist_arr_sort = [];
      for (var i=0; i<srcs.length; i++) {

        if (j >= user_data[i].value.length - 1) {
          // data file ended.
          continue;
        }

        var tmp_pnt = getCoor(user_data[i].value[j]);
        //console.log(tmp_pnt + " j=" + j);
        var dot = new ol.geom.Circle(tmp_pnt, 1);
        var ft = new ol.Feature(dot);
        srcs[i].addFeature(ft);

        var dist = getDistance(user_data[i].value[j]);
        dist_arr.push(dist);
        dist_arr_sort.push(dist);

        //var dist = getDistance(user_data[i].value[j]);
        //$('#lbdist' + i).html(Math.floor(dist) + " km");
      }

      //// move dots only
      //for (var i=0; i<geoms.length; i++) {
      //  var tmp_pnt = getCoor(user_data[i].value[j]);
      //  geoms[i].setCenter(tmp_pnt);
      //  console.log(tmp_pnt + " j=" + j);
      //}

      dist_arr_sort.sort(function(a, b) {
        return (parseInt(a) > parseInt(b)) ? 1 : -1;
      });
      for (var k=0; k<dist_arr_sort.length; k++) {
        $('#lbdist' + k).html(Math.floor(dist_arr_sort[k]) + " km");

        for (var l=0; l<dist_arr.length; l++) {
          if (dist_arr_sort[k] === dist_arr[l]) {
            $('#lb' + k).css('color', user_colors[l]);
            $('#lb' + k).html(user_names[l]);
            $('#lbsepa' + k).css('color', user_colors[l]);
            $('#lbdist' + k).css('color', user_colors[l]);
          }
        }

      }
      j++;
    }, 10);

    // take into username.
    var user_names = [];
    for (var i=0; i<user_num; i++) {
      user_names.push($('#un' + i).val());
    }

    // create ranking area.
    $('#ranking table').remove();
    $('#ranking p').remove();
    $('#ranking').append('<table></table>');
    $('#ranking table').append('<tr><td><label id="time_area" style="color: white; font-weight=bold; font-size=20px;"></label></td></tr>');
    for (var i=0; i<user_num; i++) {

      var suffix = "th";
      if (i === 0) {
        suffix = "st";
      } else if (i === 1) {
        suffix = "nd";
      } else if (i === 2) {
        suffix = "rd";
      }
      var rank = (i + 1);
      rank = rank + suffix + ":";

      $('#ranking table').append(
        $('<tr height="40"></tr>')
          .append('<td style="color: white; font-weight=bold; font-size=20px;">' + rank + '</td>')
          .append('<td width="90"><label id="lb' + i + '">' + user_names[i] + '</label></td>')
          .append('<td><label id="lbsepa' + i + '"> : </label></td>')
          .append('<td><label id="lbdist' + i + '">999</label></td>')
      );
      $('#lb' + i).css('color', user_colors[i]).css('font-weight', 'bold').css('font-size', '20px');
      $('#lbsepa' + i).css('color', user_colors[i]).css('font-weight', 'bold').css('font-size', '20px');
      $('#lbdist' + i).css('color', user_colors[i]).css('font-weight', 'bold').css('font-size', '20px');
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
    var lon = parseFloat(arr[0]);
    var lat = parseFloat(arr[1]);
    var lonj = parseFloat((GOAL_POINT[0] * 0.1) + OFFSET_LONLAT_i);
    var latj = parseFloat((GOAL_POINT[1] * 0.1) + OFFSET_LONLAT_j);

    var lon_km = Math.sqrt((lon-lonj)*(lon-lonj))/360.0*400075.0
                   * Math.cos((lat+latj)*0.5*3.141593/180.0);
    var lat_km = Math.sqrt((lat-latj)*(lat-latj))/180.0*20037.5;
    var ret = Math.sqrt(lon_km*lon_km+lat_km*lat_km);

    return ret;
  }

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
        alert("範囲外です。選択し直してください");
        console.log(msg);
      },
      success: function(dat) {
        var tmp = new Object();
        tmp.value = dat.split('\n');;
        user_data.push(tmp);

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
      }
    });
  });

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
    map.addLayer(icoLayer);
    user_data = [];
    user_num = 0;

    $('#ranking table').remove();
    $('#ranking p').remove();
  });

  // ---------------------------------
  // Set
  // ---------------------------------
  $('#set_btn').click(function(){
    $('#ranking table').remove();
    $('#ranking p').remove();
    for (var i=0; i<MAX_USER; i++) {
      var user_no = (i + 1);
      $('#ranking').append(
        $('<p></p>').append('<label id="lb' + i + '"># ' + user_no + ' </label>')
                    .append('<input id="un' + i + '" type="text" size="20">')
      );
      $('#lb' + i).css('color', user_colors[i]).css('font-weight', 'bold');
    }
    return false;
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
