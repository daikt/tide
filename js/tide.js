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
  var GOAL_NAME = "GOAL Island";
  var GOAL_POINT = [590, 244];
  //var GOAL_POINT = [380, 254];
  var OFFSET_i = 1150.0;
  var OFFSET_j = 850.0;
  var OFFSET_LONLAT_i = 115.0;
  var OFFSET_LONLAT_j = 10.1;
  var TIMER_IMG = 72; // msec
  var TIMER_DOT = 3;  // msec
  var TIMER_PRE = 30; // msec
  var END_DISTANCE = 200; // (km):if dot goes into this value, game is over.

  // user variable
  var user_num = 0;
  var user_names = [];
  var user_data = [];

  // layers
  var prelayer = null;
  var imglayer = null;
  var dotlayers = [];
  var icoLayer = null;

  // timer
  var timer_img = null;
  var timer_dot = null;
  var timer_pre= null;

  // display status
  var DISP_STS_SET = 0;
  var DISP_STS_EXECUTE = 1;
  var DISP_STS_END = 2;
  var disp_sts = DISP_STS_SET;

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
      //center: ol.extent.getCenter(extent),
      center: [370, 300],
      zoom: 3,
      minZoom: 2,
      maxZoom: 4
    })
  });

  // delete unuse DOM.
  $('.ol-overlaycontainer-stopevent').remove();

  set();

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
        var chkname = imgfile.split("/");
        if (chkname[chkname.length-1] === "Thumbs.db") {
          continue;
        }
        var ist = new ol.source.ImageStatic({
                   url: imgfile,
                   projection: map.getView().getProjection(),
                   imageExtent: extent
                 });
        imgfiles.push(imgfile);
        ist_arr.push(ist);
      }

      // --- prefetch base map. ---
      prelayer = new ol.layer.Image({
        source: ist_arr[0],
        name: 'img'
      });
      map.addLayer(prelayer);
      var n=1;
      timer_pre= setInterval(function(){
        //console.log("### pre : " + n);
        prelayer.setSource(ist_arr[n]); // change image
        n++;
        if (n >= imgfiles.length){
          clearInterval(timer_pre);
          timer_pre = null;
          prelayer = null;
        }
      }, TIMER_PRE);

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
  $('#start_btn').click(function(){
    console.log("start click.");

    if (!(timer_img === null) && !(timer_dot === null)) {
      console.log("executing...");
      return false;
    }
    if (user_num === 0) {
      alert("開始点を選択してください");
      return false;
    }
    if (disp_sts === DISP_STS_END) {
      return false;
    }
    btnCtrl(DISP_STS_EXECUTE);

    // --- change base map. ---
    var m=1;
    timer_img = setInterval(function(){
      imglayer.setSource(ist_arr[m]); // change image
      var ta = imgfiles[m].substr(30,4);
      $('#date').html('20xx/' + ta.substr(0,2) + '/' + ta.substr(2,2));
      m++;
      if (m >= imgfiles.length){
        stopTimer();
      }
    }, TIMER_IMG);

    // --- move each users's dots. ---
    j=1; // timer cycle counter
    timer_dot = setInterval(function(){

      // add dots
      var dist_arr = [];
      var dist_arr_sort = [];
      var cnt = 0;
      for (var i=0; i<dotlayers.length; i++) {
        cnt = j;
        if (j >= user_data[i].value.length - 1) {
          // data file ended.
          cnt = (user_data[i].value.length - 2);
        } else {
          var coor = getCoor(user_data[i].value[cnt]);
          var dot = new ol.geom.Circle(coor, 1);
          var ft = new ol.Feature(dot);
          dotlayers[i].get('source').addFeature(ft);
        }

        var dist = getDistance(user_data[i].value[cnt]);
        if (dist < END_DISTANCE) {
          stopTimer();
        }
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
      dist_arr = [];
      dist_arr_sort = [];
      j++;
    }, TIMER_DOT);

    // take into username.
    for (var i=0; i<user_num; i++) {
      user_names.push($('#un' + i).val());
    }

    // create ranking area.
    $('#ctrl_panel').css('height', (40 * user_num));
    $('#ranking').css('width', '270px');
    $('#ranking').css('height', (40 * user_num));
    $('#ranking table').remove();
    $('#ranking p').remove();
    $('#ranking').append('<table></table>');
    $('#date').css('display', '');
    $('#ranking').css('clear', '');
    for (var i=0; i<user_num; i++) {
      var suffix = "th ";
      if (i === 0) {
        suffix = "st ";
      } else if (i === 1) {
        suffix = "nd ";
      } else if (i === 2) {
        suffix = "rd ";
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
    console.log("map click.");

    if (!(timer_img === null) && !(timer_dot === null)) {
      console.log("executing...");
      return false;
    }
    if (user_num >= MAX_USER) {
      console.log("max user over.");
      return false;
    }
    if (disp_sts != DISP_STS_SET) {
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
  // Set
  // ---------------------------------
  $('#set_btn').click(function(){
    console.log("set click.");
    if (!(timer_img === null) && !(timer_dot === null)) {
      console.log("executing...");
      return false;
    }
    set();
  });

  function set(){
    if (!(user_num === 0)) {
      reset();
    }
    btnCtrl(DISP_STS_SET);

    $('#ranking').css('width', '226px');
    $('#ranking').css('height', '320px');
    $('#ctrl_panel').css('height', '320px');
    $('#ranking table').remove();
    $('#ranking p').remove();
    $('#date').css('display', 'none');
    $('#ranking').css('clear', 'left');
    for (var i=0; i<MAX_USER; i++) {
      var user_no = (i + 1);
      $('#ranking').append(
        $('<p></p>').append('<label id="lb' + i + '"># ' + user_no + ' </label>')
                    .append('<input id="un' + i + '" type="text" size="20" maxlength="10">')
      );
      $('#lb' + i).css('color', user_colors[i]).css('font-weight', 'bold');
    }
  }

  // ---------------------------------
  // reset
  // ---------------------------------
  function reset() {
    //location.reload();
    stopTimer();
    imglayer.setSource(ist_arr[0]); // reset to initial.png
    for (var i=0; i<dotlayers.length; i++) {
      dotlayers[i].get('source').clear();
    }
    user_num = 0;
    user_names = [];
    user_data = [];
    dotlayers = [];

    $('#ranking').css('width', '226px');
    $('#ranking').css('height', '0px');
    $('#ctrl_panel').css('height', '0px');
    $('#ranking table').remove();
    $('#ranking p').remove();
    $('#date').css('display', 'none');
    $('#ranking').css('clear', 'left');
  }

  // ---------------------------------
  // stop timers.
  // ---------------------------------
  function stopTimer() {
    if (timer_img != null) {
      clearInterval(timer_img);
      timer_img = null;
    }
    if (timer_dot != null) {
      clearInterval(timer_dot);
      timer_dot = null;
    }
    btnCtrl(DISP_STS_END);
  }

  // ---------------------------------
  // button status control.
  // ---------------------------------
  function btnCtrl(sts) {
    $('#set_btn').removeAttr('href');
    $('#start_btn').removeAttr('href');
    if (sts === DISP_STS_SET) {
      $('#start_btn').attr('href', '#');
    } else if (sts === DISP_STS_END) {
      $('#set_btn').attr('href', '#');
    }
    disp_sts = sts;
  }

  // ---------------------------------
  // load, resize window.
  // ---------------------------------
  $(window).on('load resize', function(){
    var w = $(window).width();
    var h = $(window).height();
    var new_point = [w/4, h/4];
    map.getView().setCenter(new_point);
  });

});
