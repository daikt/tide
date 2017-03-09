$(function() {

  // 8 user colors.
  var user_colors = [
    'rgba(255,   0,   0, 1.0)',  // Red
    'rgba(  0, 255,   0, 1.0)',  // Green
    'rgba(  0, 255, 255, 1.0)',  // Cyan
    'rgba(255, 165,   0, 1.0)',  // Orange
    'rgba(255,   0, 255, 1.0)',  // Magenda
    'rgba(  0, 128, 128, 1.0)',  // Teal
    'rgba(176, 224, 230, 1.0)',  // PowderBlue
    'rgba(178,  34,  34, 1.0)'   // FireBrick
  ];

  // constants
  var MAX_USER = 8;
  var CALCULATED_DATA_PATH = "/tide/data/track";
  var CGI_PATH = "/tide/php/getFileList.php";
  var GOAL_ICON = "/tide/img/goal_64.png";
  var GOAL_NAME = "JAMSTEC Island";
  var GOAL_POINT = [590, 244];
  var OFFSET_i = 1150.0;
  var OFFSET_j = 850.0;
  var OFFSET_LONLAT_i = 115.0;
  var OFFSET_LONLAT_j = 10.1;

  // user variable
  var user_num = 0;
  var user_data = [];

  // layers
  var imglayer = null;
  var dotlayers = [];
  var icoLayer = null;

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
  var imgfiles = [];
  var ist_arr = [];
  $.ajax({
    url: CGI_PATH,
    cache: false,
    error: function(msg) {
      console.log(msg);
    },
    success: function(json) {

      // レイヤリスト生成
      var data = $.parseJSON(json);
      for (var i=0; data[i]; i++) {
        var imgfile = "/tide" + data[i].image.substr(2);
        var ist = new ol.source.ImageStatic({
                   url: imgfile,
                   projection: map.getView().getProjection(),
                   imageExtent: extent
                 });
        imgfiles.push(imgfile);
        ist_arr.push(ist);
      }

      // add image layer.
      imglayer = new ol.layer.Image({
        source: ist_arr[0],
        name: 'img'
      });
      map.addLayer(imglayer);

      // set goal layer.
      var icoStyle = new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          opacity: 0.75,
          src: GOAL_ICON
        })),
        text: new ol.style.Text({
          fill: new ol.style.Fill({color: "#0000ff"}),
          stroke: new ol.style.Stroke({color: "#ffffff", width: 2}),
          scale: 1.6,
          textAlign: "center",
          textBaseline: "top",
          offsetY: 0,
          text: GOAL_NAME,
          font: "Courier New, monospace"
        })
      });
      var icoFeature = new ol.Feature({
        geometry: new ol.geom.Point(GOAL_POINT)  // goal point
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

    // --- change base map. ---
    var m=1;
    timer = setInterval(function(){
      imglayer.setSource(ist_arr[m]); // change image
      var ta = imgfiles[m].substr(30,4);
      $('#time_area').html('20xx/' + ta.substr(0,2) + '/' + ta.substr(2,2));
      m++;
      if (m >= imgfiles.length){
        stopTimer();
      }
    }, 240);

    // --- move each users's dots. ---
    j=1; // timer cycle counter
    timer_dot = setInterval(function(){

      // add dots
      var dist_arr = [];
      var dist_arr_sort = [];
      for (var i=0; i<dotlayers.length; i++) {

        if (j >= user_data[i].value.length - 1) {
          // data file ended.
          continue;
        }

        var coor = getCoor(user_data[i].value[j]);
        var dot = new ol.geom.Circle(coor, 1);
        var ft = new ol.Feature(dot);
        dotlayers[i].get('source').addFeature(ft);

        var dist = getDistance(user_data[i].value[j]);
        dist_arr.push(dist);
        dist_arr_sort.push(dist);
      }

      // sort ranking
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
    $('#ctrl_panel').css('height', '437px');
    $('#ranking').css('width', '270px');
    $('#ranking').css('height', '360px');
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
        tmp.value = dat.split('\n');
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
        var markerStyle = new ol.style.Style({
          fill: new ol.style.Fill({
            color: user_colors[user_num]
          })
        });

        // set source to layer.
        var markerLayer = new ol.layer.Vector({
          source: markerSource,
          style: markerStyle,
          name: 'dot_' + user_num
        });

        dotlayers.push(markerLayer);
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
    imglayer.setSource(ist_arr[0]); 
    for (var i=0; i<dotlayers.length; i++) {
      dotlayers[i].get('source').clear();
    }
    user_data = [];
    user_num = 0;

    $('#ranking').css('width', '226px');
    $('#ranking').css('height', '0px');
    $('#ctrl_panel').css('height', '0px');
    $('#ranking table').remove();
    $('#ranking p').remove();
  });

  // ---------------------------------
  // Set
  // ---------------------------------
  $('#set_btn').click(function(){
    $('#ranking').css('width', '226px');
    $('#ranking').css('height', '320px');
    $('#ctrl_panel').css('height', '320px');
    $('#ranking table').remove();
    $('#ranking p').remove();
    for (var i=0; i<MAX_USER; i++) {
      var user_no = (i + 1);
      $('#ranking').append(
        $('<p></p>').append('<label id="lb' + i + '"># ' + user_no + ' </label>')
                    .append('<input id="un' + i + '" type="text" size="20" maxlength="10">')
      );
      $('#lb' + i).css('color', user_colors[i]).css('font-weight', 'bold');
    }
    return false;
  });

  // ---------------------------------
  // Stop
  // ---------------------------------
  $('#stop_btn').click(function(){
    stopTimer();
  });

  // ---------------------------------
  // stop timers.
  // ---------------------------------
  function stopTimer() {
    if (timer != null) {
      clearInterval(timer);
    }
    if (timer_dot != null) {
      clearInterval(timer_dot);
    }
  }

});