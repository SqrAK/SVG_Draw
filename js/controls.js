/**
 * Created by Alice on 16.02.2018.
 */
$(document).ready(function () {


    //Для главного меню
    // $('a').on('click', function(e){
    //     e.preventDefault();
    // });

    $('.main-menu-list').hover(function () {
        // clearTimeout($.data(this,'timer'));
        // $('ul',this).stop(true,true).slideDown(200);
    }, function () {
        $.data(this,'timer', setTimeout($.proxy(function() {
            $('ul',this).stop(true,true).slideUp(200);
        }, this), 100));
    });

    $(".main-menu-list__item").click(function () {

        // $(".main-menu-list__item ul").css("display", "none");
        $('ul', this).stop(true, true).slideDown(200);
    });


});



function saveSvgToPng() {
    var svg = document.querySelector('svg');
    var canvas = document.createElement('canvas');
    canvas.height = svg.getAttribute('height');
    canvas.width = svg.getAttribute('width');
    canvg(canvas, svg.parentNode.innerHTML.trim());
    var dataURL = canvas.toDataURL('image/png');
    var data = atob(dataURL.substring('data:image/png;base64,'.length)),
        asArray = new Uint8Array(data.length);

    for (var i = 0, len = data.length; i < len; ++i) {
        asArray[i] = data.charCodeAt(i);
    }

    var blob = new Blob([asArray.buffer], {type: 'image/png'});
    saveAs(blob, 'export_' + Date.now() + '.png');
}


// window.onbeforeunload = function (evt) {
//     var message = "Document 'foo' is not saved. You will lost the changes if you leave the page.";
//     if (typeof evt == "undefined") {
//         evt = window.event;
//     }
//     if (evt) {
//         evt.returnValue = message;
//     }
//     return message;
// }


