$(function() {

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
        if (i >= data.length){
          clearInterval(timer);
        }
      }, 100);

    }
  });


});
