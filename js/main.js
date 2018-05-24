/**
 * Created by Alice on 19.11.2017.
 */
'use strict';
var w = 15;
var h = 10;

var PIX_IN_CM = 37.79527559055;


function Board() {
    this.draw = false;
    this.drag = false;
    this.type = 'move';
    this.svg = null;
    this.select = null;
    this.color = '#000000';
    this.stroke = 1;
    this.drawPoly = false;
    this.shift = false;
    this.selectRect = null;
    this.clickFigure = false;
    this.textureSRC = '';

    this.backupSize = 10;
    this.backupOffset = 0;
    this.backupCurr = 0;
    this.backup = [];

    this.buffer = null;

    this.firstPoly = true;

    this.bargello = false;


}

Board.prototype.reset = function () {
    this.draw = false;
    this.drag = false;
    this.type = 'move';

};

var BOARD = null;
var posX = 0, posY = 0;

function init() {
    if (SVG.supported) {
        BOARD = new Board();

        BOARD.backup = new Array(BOARD.backupSize);
        var svg = SVG('main-canvas').size(w * PIX_IN_CM, h * PIX_IN_CM).addClass("canvas");

        $('.canvas-width__number').val(w);
        $('.canvas-width__range').val(w);
        $('.canvas-height__number').val(h);
        $('.canvas-height__range').val(h);

        svg.on('mousedown', mouseDown);
        svg.on('mousemove', mouseMove);
        svg.on('mouseup', mouseUp);
        svg.on('mouseleave', mouseLeave);

        BOARD.backup[BOARD.backupCurr] = svg;

        BOARD.svg = svg;
    } else {
        alert('SVG not supported');
    }
}

$('.canvas-height__range').change(function () {
    $('.canvas-height__number').val($(this).val());
    h = $(this).val();
    checkCanvasSize();
    BOARD.svg.size(w * PIX_IN_CM, h * PIX_IN_CM);
    checkRedrawBarg();
});

$('.canvas-height__number').change(function () {
    $('.canvas-height__range').val($(this).val());
    h = $(this).val();
    checkCanvasSize();
    BOARD.svg.size(w * PIX_IN_CM, h * PIX_IN_CM);
    checkRedrawBarg();
});

$('.canvas-width__number').change(function () {
    $('.canvas-width__range').val($(this).val());
    w = $(this).val();
    checkCanvasSize();
    BOARD.svg.size(w * PIX_IN_CM, h * PIX_IN_CM);
    checkRedrawBarg();
});

$('.canvas-width__range').change(function () {
    $('.canvas-width__number').val($(this).val());
    w = $(this).val();
    checkCanvasSize();
    BOARD.svg.size(w * PIX_IN_CM, h * PIX_IN_CM);
    checkRedrawBarg();
});

function checkRedrawBarg() {

    if (BOARD.bargello) {
        drawRects();
    }
}

function checkCanvasSize() {
    var svg = document.getElementById('main-canvas');
    console.log();
    var newW = (svg.scrollWidth - 30) / w;
    var newH = (svg.scrollHeight - 50) / h;

    PIX_IN_CM = newH < newW ? newH : newW;
}


function downFigure() {
    BOARD.clickFigure = true;
    var id = this.id();
    var insideGroup = false;

    if (BOARD.select) {
        if (BOARD.select.type == "g") {
            if (BOARD.select.children().length > 1) {
                BOARD.select.children().forEach(function (item) {
                    if (id == item.node.id) {
                        insideGroup = true;
                    }
                });
            }
        }
    }

    if (!insideGroup) {
        if (BOARD.select) {
            if (BOARD.select.type == "g") {
                if (BOARD.select.children().length > 1) {
                    BOARD.select.selectize(false).resize(false).draggable(false);
                    changeRectAfterGroup(BOARD.select);
                    BOARD.select.ungroup();
                    BOARD.select = null;
                }
            }
        }

        if (BOARD.select == this) {

        } else {

            if (BOARD.select) {
                BOARD.select.selectize(false).resize(false).draggable(false);
                BOARD.select.selectize(false, {deepSelect: true}).resize(false).draggable(false);
                BOARD.select = null;
            }

            $(".figure-align").css({'display': 'flex'});
            this.selectize().resize().draggable();
            BOARD.select = this;
            changeViewProperty(BOARD.select.type);
            synch();
        }
    }
}

function upFigure() {
    BOARD.clickFigure = false;
}

function undoSvg() {
    if (BOARD.backupOffset < BOARD.backupSize - 1) {
        BOARD.backupOffset++;
        BOARD.backupCurr--;

        if (BOARD.backupCurr < 0)
            BOARD.backupCurr = BOARD.backupSize - 1;
        redrawSvg(BOARD.backup[BOARD.backupCurr]);
    }
}

function redoSvg() {
    if (BOARD.backupOffset > 0) {
        BOARD.backupOffset--;
        BOARD.backupCurr++;

        if (BOARD.backupCurr == BOARD.backupSize)
            BOARD.backupCurr = 0;
        redrawSvg(BOARD.backup[BOARD.backupCurr]);
    }
}

function changeBackup() {
    BOARD.backupOffset = 0;

    var svg = document.getElementsByTagName('svg')[0];

    BOARD.backupCurr++;
    if (BOARD.backupCurr == BOARD.backupSize)
        BOARD.backupCurr = 0;
    BOARD.backup[BOARD.backupCurr] = svg.innerHTML;
}

function redrawSvg(elements) {
    resetAllSelect();
    var svg = document.getElementsByTagName('svg')[0];
    svg.innerHTML = elements;
    BOARD.svg.each(function (i, children) {
        if(!this.hasClass('select-rect-svg')){
            this.on("mousedown", downFigure);
            this.on("mouseup", upFigure);
        }

    })
}

function resetAllSelect() {

    if (BOARD.select) {
        BOARD.select.selectize(false).resize(false).draggable(false);
        BOARD.select.selectize(false, {deepSelect: true}).resize(false).draggable(false);
        if (BOARD.select.type == "g") {
            if (BOARD.select.children().length > 1) {
                changeRectAfterGroup(BOARD.select);
                BOARD.select.ungroup();
            }
        }
        if (BOARD.select.type != "polygon")
            BOARD.select = null;
        changeViewProperty(BOARD.type);
        $(".figure-align").hide();
    }

}

function mouseDown(e) {
    if (event.which == 1 && !BOARD.clickFigure) {

        resetAllSelect();

        var x = e.offsetX == undefined ? e.layerX : e.offsetX;
        var y = e.offsetY == undefined ? e.layerY : e.offsetY;

        var fill;
        if ($('#colorSelector').hasClass('color-selector')) {
            fill = $('#colorSelector div').css('background-color');
        } else {
            var pattern = BOARD.svg.pattern(20, 20, function (add) {
                add.image(BOARD.textureSRC)
            });
            fill = pattern;
        }

        var stroke = $(".stroke-color-property__color").val();

        posX = x;
        posY = y;

        var figure = null;
        switch (BOARD.type) {
            case 'move':
                BOARD.drag = true;
                BOARD.selectRect = BOARD.svg.rect(1, 1)
                    .move(x, y)
                    .fill("none")
                    .attr({'stroke-dasharray': 7})
                    .stroke({color: "#666666"});
                break;
            case 'line':
                BOARD.draw = true;
                figure = BOARD.svg.line(x, y, x, y)
                    .stroke({width: BOARD.stroke, color: stroke});
                break;
            case 'rect':
                BOARD.draw = true;
                figure = BOARD.svg.rect(1, 1)
                    .move(x, y)
                    .fill(fill)
                    .stroke({width: BOARD.stroke, color: stroke});
                break;
            case 'ellipse':
                BOARD.draw = true;
                figure = BOARD.svg.ellipse(1, 1)
                    .move(x, y)
                    .fill(fill)
                    .stroke({width: BOARD.stroke, color: stroke});
                break;
            case 'polygon':
                if (!BOARD.drawPoly) {
                    figure = BOARD.svg.polygon(`${x},${y} ${x + 1},${y + 1}`).fill(fill).stroke({
                        width: BOARD.stroke,
                        color: stroke
                    });
                } else {
                    BOARD.select.array().value.push([x, y]);
                    figure = BOARD.select.plot(BOARD.select.array());
                }
                BOARD.drawPoly = true;
                break;
            case 'circle':
                break;
            default:
                break;
        }
        BOARD.select = figure;
    }
    BOARD.clickFigure = false;
}

function documentMouseUp(e) {
    var x = e.clientX == undefined ? e.layerX : e.clientX;
    var y = e.clientY == undefined ? e.layerY : e.clientY;
    if (e.which == 1) {
        $(".rbm-menu").hide();
    }
    if (e.which == 3) {
        $(".rbm-menu").css({'top': y, 'left': x});
        $(".rbm-menu").show();
    }
}

function mouseUp(e) {
    if (BOARD.draw) {
        // changeBackup();
        rectFigure(BOARD.select);
    }

    if (BOARD.select && !BOARD.drawPoly) {
        BOARD.select.selectize().resize().draggable();
        $(".figure-align").css({'display': 'flex'});
        if(BOARD.select.type !='g'){
            BOARD.select.on("mousedown", downFigure);
            BOARD.select.on("mouseup", upFigure);
        }
    }
    if (BOARD.selectRect) {
        getFigures(BOARD.selectRect);
        BOARD.selectRect.remove();
        BOARD.selectRect = null;
    }

    BOARD.draw = false;
    BOARD.drag = false;
}

function mouseMove(e) {
    var x = e.offsetX == undefined ? e.layerX : e.offsetX;
    var y = e.offsetY == undefined ? e.layerY : e.offsetY;

    if (BOARD.drawPoly) {
        var length = BOARD.select.array().value.length;

        BOARD.select.array().value[length - 1][0] = x;
        BOARD.select.array().value[length - 1][1] = y;
        BOARD.select.plot(BOARD.select.array());
    }

    if (!BOARD.draw && !BOARD.drag)
        return;

    var width = x - posX;
    var height = y - posY;
    switch (BOARD.type) {
        case 'move':
            x = width < 0 ? posX + width : posX;
            y = height < 0 ? posY + height : posY;
            BOARD.selectRect.attr({width: Math.abs(width), height: Math.abs(height), x: x, y: y});
            break;
        case 'line':
            BOARD.select.attr({x2: x, y2: y});
            break;
        case 'rect':
            x = width < 0 ? posX + width : posX;
            y = height < 0 ? posY + height : posY;
            BOARD.select.attr({width: Math.abs(width), height: Math.abs(height), x: x, y: y});
            break;
        case 'ellipse':
            width = width / 2;
            height = height / 2;
            var r = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            if (!BOARD.shift) {
                BOARD.select.attr({rx: Math.abs(width), ry: Math.abs(height), cx: posX + width, cy: posY + height});
            } else {
                BOARD.select.attr({rx: r, ry: r, cx: posX, cy: posY});
            }
            break;
        default:
            break;
    }
}

function mouseLeave() {
    mouseUp();
}

function synch() {
    var str = BOARD.select.attr('stroke');
    var fill = BOARD.select.attr('fill');
    var strWid = BOARD.select.attr('stroke-width');

    //цвет контура
    $(".stroke-color-property .stroke-color").val(str);

    //цвет заливки
    $(".fill-property .fill-color").val(fill);

    //ширина контура
    $(".stroke-property .stroke-width-ran").val(strWid);
    $(".stroke-property .stroke-width-num").val(strWid);
    //
    $(".size-property .size-width-num").val(BOARD.select.attr('width'));
    $(".size-property .size-height-num").val(BOARD.select.attr('height'));
    //
    $(".rotate-property .rotate-num").val(BOARD.select.transform().rotation);
    $(".rotate-property .rotate-ran").val(BOARD.select.transform().rotation);
}

function getFigures(rect) {

    resetAllSelect();

    var elements = [];

    BOARD.svg.each(function (i, children) {
        if (this.data('startX') > rect.x()
            && this.data('startY') > rect.y()
            && this.data('endX') < rect.x() + rect.width()
            && this.data('endY') < rect.y() + rect.height()) {
            elements.push(this);
            // BOARD.select.add(this);
        }
    });

    if (elements.length > 1) {
        var group = BOARD.svg.group();
        for (var i = 0; i < elements.length; i++) {
            group.add(elements[i]);
        }
        BOARD.select = group;
        BOARD.select.selectize().resize().draggable();
    } else if (elements.length == 1) {

        BOARD.select = elements[0];
        BOARD.select.selectize().resize().draggable();
        $(".figure-align").css({'display': 'flex'});
        changeViewProperty(BOARD.select.type);
        synch();

    }
}

function rectFigure(figure) {
    if (figure.type != 'g') {
        var x = figure.transform().x;
        var y = figure.transform().y;
        var bbox = figure.bbox();
        figure.data({
            startX: bbox.x + x,
            startY: bbox.y + y,
            endX: bbox.x + bbox.width + x,
            endY: bbox.y + bbox.height + y
        });
    }
}

function changeRectAfterGroup(group) {
    var x = group.transform().x;
    var y = group.transform().y;
    group.children().forEach(function (item) {
        var bbox = item.bbox();
        item.data({
            startX: bbox.x + x,
            startY: bbox.y + y,
            endX: bbox.x + bbox.width + x,
            endY: bbox.y + bbox.height + y
        });
    });
}


$('#colorSelector').ColorPicker({
    color: '#000000',
    id: '#colorSelector',
    onShow: function (colpkr) {
        $(colpkr).fadeIn(500);
        return false;
    },
    onHide: function (colpkr) {
        $(colpkr).fadeOut(500);
        return false;
    },
    onChange: function (hsb, hex, rgb) {
        $('#colorSelector div').css('background', '#' + hex);
        BOARD.color = '#' + hex;
        var color = '#' + hex;
        if (BOARD.select) {
            BOARD.select.fill(color);
        }
        // $(".stroke-color-property .stroke-color").val(BOARD.color);
    },
    onChangeTexture: function (texture) {
        var src = texture[0].src;

        $('#colorSelector div').css({'background': 'url("' + src + '")'});

        BOARD.textureSRC = src;

        var pattern = BOARD.svg.pattern(20, 20, function (add) {
            add.image(src)
        });

        if (BOARD.select) {
            BOARD.select.fill(pattern);
        }
    }
});

// $('#colorSelector686').ColorPicker({
//     color: '#000000',
//     id: '#colorSelector686',
//     onShow: function (colpkr) {
//         $(colpkr).fadeIn(500);
//         return false;
//     },
//     onHide: function (colpkr) {
//         $(colpkr).fadeOut(500);
//         return false;
//     },
//     onChange: function (hsb, hex, rgb) {
//         $('#colorSelector div').css('backgroundColor', '#' + hex);
//         BOARD.color = '#' + hex;
//         $(".stroke-color-property .stroke-color").val(BOARD.color);
//     }
// });


$(".colorpicker .colorpicker_buttons a.link_color").click(function () {
    $('#colorSelector').ColorPickerChangeType("color");

});

$(".colorpicker .colorpicker_buttons a.link_texture").click(function () {
    $('#colorSelector').ColorPickerChangeType("texture");
});


// $(".menu-strip").click(function () {
//     if (BOARD.select) {
//         BOARD.select.selectize(false).resize(false).draggable(false);
//         BOARD.select.selectize(false, {deepSelect: true}).resize(false).draggable(false);
//         BOARD.select = null;
//     }
// });

$(".menu-strip .undo").click(function () {
    undoSvg();
});

$(".menu-strip .redo").click(function () {
    redoSvg();
});

//Для меню с инструментами
$(".menu-tools ul li").click(function () {
    if (BOARD.select) {
        // BOARD.select.selectize(false).resize(false).draggable(false);
        // BOARD.select.selectize(false,  {deepSelect:true}).resize(false).draggable(false);
        // changeViewProperty(BOARD.type);
    }
    BOARD.reset();
    $(".menu-tools ul li.instrument").removeClass("active");
    BOARD.type = $(this).attr('class').split(/\s+/)[0];
    if (BOARD.type == "polygon" && BOARD.firstPoly) {
        alert("Для того, чтобы закончить рисование полигона, нажмите Enter");
        BOARD.firstPoly = false;
    }
    $(this).addClass("active");
    changeViewProperty(BOARD.type);
});

$(".menu-tools ul li.template").click(function () {
    $(".template-panel").show(200);
});

$('.menu-tools ul li.template').hover(function () {
    // clearTimeout($.data(this,'timer'));
    // $('ul',this).stop(true,true).slideDown(200);
}, function () {
    $.data(this, 'timer', setTimeout($.proxy(function () {
        // $('.template',this).stop(true,true).slideUp(200);
        $('.template-panel').stop(true, true).hide(200);
    }, this), 100));
});

$(".fig-type").click(function () {
    $(".fig-type").removeClass("active");
    $(this).addClass("active");
    var classNow = $(this).attr('class').split(/\s+/)[1];
    $('.list-fig').hide();
    $('.list-fig.' + classNow).css("display", "flex");
});

//при переключении инструмента
function changeViewProperty(type) {
    switch (type) {
        case "rect":
            $('.rotate-property').show();
            $(".stroke-color-property").show();
            $(".fill-property").css({'display': 'flex'});
            $(".stroke-property").show();
            break;
        case "polygon":
        case "ellipse":
            $('.rotate-property').hide();
            $(".stroke-color-property").show();
            $(".fill-property").css({'display': 'flex'});
            $(".stroke-property").show();
            break;
        case "line":
            $(".stroke-property").show();
            $(".stroke-color-property").show();
            $(".fill-property").hide();
            break;
        case 'fill':
            $(".fill-property").css({'display': 'flex'});

            $('.rotate-property').hide();
            $(".stroke-property").hide();
            $(".stroke-color-property").hide();
            break;
        case 'bargello':
            $('.bargello-property').show();
            break;
        case "move":
        default:
            $('.rotate-property').hide();
            $(".stroke-property").hide();
            $(".stroke-color-property").hide();
            $(".fill-property").hide();
            break;
    }
    if (BOARD.bargello) {
        $('.bargello-property').show();
    } else {
        $('.bargello-property').hide();
    }
}

$(".figure-align .align-position").click(function () {
    var classNow = $(this).attr('class').split(/\s+/)[1];
    var width = BOARD.select.data('endX') - BOARD.select.data('startX');
    var height = BOARD.select.data('endY') - BOARD.select.data('startY');

    switch (classNow) {
        case "tl":
            BOARD.select.move(0, 0);
            break;
        case "tc":
            BOARD.select.move(BOARD.svg.attr('width') / 2 - width / 2, 0);
            break;
        case "tr":
            BOARD.select.move(BOARD.svg.attr('width') - width, 0);
            break;
        case "cl":
            BOARD.select.move(0, BOARD.svg.attr('height') / 2 - height / 2);
            break;
        case "cc":
            BOARD.select.move(BOARD.svg.attr('width') / 2 - width / 2, BOARD.svg.attr('height') / 2 - height / 2);
            break;
        case "cr":
            BOARD.select.move(BOARD.svg.attr('width') - width, BOARD.svg.attr('height') / 2 - height / 2);
            break;
        case "bl":
            BOARD.select.move(0, BOARD.svg.attr('height') - height);
            break;
        case "bc":
            BOARD.select.move(BOARD.svg.attr('width') / 2 - width / 2, BOARD.svg.attr('height') - height);
            break;
        case "br":
            BOARD.select.move(BOARD.svg.attr('width') - width, BOARD.svg.attr('height') - height);
            break;
    }
});

$(".layer-full__visible").click(function () {

    $(this).toggleClass("layer-full__visible_active");
});

//При изменении ширины меняем на фигурке
$(".stroke-property .stroke-width-num").change(function () {
    var val = $(this).val();
    BOARD.stroke = val;
    changeStrokeWid(val);
    $(".stroke-property .stroke-width-ran").val(val)
});

//Ширина фигурки только range
$(".stroke-property .stroke-width-ran").change(function () {
    var val = $(this).val();
    BOARD.stroke = val;
    changeStrokeWid(val);
    $(".stroke-property .stroke-width-num").val(val);
});


$(".size-property .size-width-num").change(function () {
    var val = $(this).val();
    BOARD.select.width(val);
});


$(".size-property .size-height-num").change(function () {
    var val = $(this).val();
    BOARD.select.height(val);
});


$(".rotate-property .rotate-num").change(function () {
    var val = $(this).val();
    changeRotateFig(val);
    $(".rotate-property .rotate-ran").val(val)
});


$(".rotate-property .rotate-ran").change(function () {
    var val = $(this).val();
    changeRotateFig(val);
    $(".rotate-property .rotate-num").val(val);
});

function changeRotateFig(angle) {
    if (BOARD.select) {
        BOARD.select.rotate(angle);
    }
}


function changeStrokeWid(width) {
    if (BOARD.select)
        BOARD.select.attr({'stroke-width': width});
}

//заливка
$(".fill-property__color").change(function () {
    var color = $(this).val();
    if (BOARD.select) {
        BOARD.select.fill(color);
    }
});

//цвет контура
$(".stroke-color-property .stroke-color").change(function () {
    var color = $(this).val();
    if (BOARD.select) {
        BOARD.select.stroke(color);
    }
});


$(".stroke-color-property__title").click(function () {
    if (BOARD.select.attr('stroke') == 'none') {
        var val = $('.stroke-color-property__color').val();
        if (BOARD.select) {
            BOARD.select.stroke(val);
        }
        $(".stroke-color-property__title").css('text-decoration', 'none');
    } else {
        if (BOARD.select) {
            BOARD.select.stroke('none');
        }
        $(".stroke-color-property__title").css('text-decoration', 'underline');
    }

});

$(".fill-property__title").click(function () {
    if (BOARD.select.attr('fill') == 'none') {
        var val = $('.fill-property__color').val();
        if (BOARD.select) {
            BOARD.select.fill(val);
        }
        $(".fill-property__title").css('text-decoration', 'none');
    } else {
        if (BOARD.select) {
            BOARD.select.fill('none');
        }
        $(".fill-property__title").css('text-decoration', 'underline');
    }

});


function keyDownHandler(e) {
    switch (e.keyCode) {
        case 13:
        case 32:

            if (BOARD.drawPoly) {
                BOARD.drawPoly = false;
                BOARD.select.array().value.pop();
                BOARD.select.plot(BOARD.select.array());
                BOARD.select.selectize({deepSelect: true}).resize().draggable();
                BOARD.select.selectize().resize().draggable();
            }
            break;
        //shift
        case 16:
            BOARD.shift = true;
            BOARD.select.resize({'snapToAngle': 15});
            break;
        case 37:
            if (BOARD.select) {
                BOARD.select.dmove(-1, 0);
            }
            break;
        case 38:
            if (BOARD.select) {
                BOARD.select.dmove(0, -1);
            }
            break;
        case 39:
            if (BOARD.select) {
                BOARD.select.dmove(1, 0);
            }
            break;
        case 40:
            if (BOARD.select) {
                BOARD.select.dmove(0, 1);
            }
            break;
    }
}

function deleteFigure() {
    if (BOARD.select) {
        BOARD.select.selectize(false).resize(false).draggable(false);
        BOARD.select.selectize(false, {deepSelect: true}).resize(false).draggable(false);
        changeViewProperty(BOARD.type);
        $(".figure-align").hide();
        BOARD.select.remove();
        BOARD.select = null;
    }
}

function keyUpHandler(e) {
    //если нажата делете и есть выбранная фигура
    if (e.keyCode == 46) {
        deleteFigure();
    }
    if (e.keyCode == 16) {
        BOARD.shift = false;
        BOARD.select.resize({'snapToAngle': 0.1});
    }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mouseup", documentMouseUp, false);

function selectFigure() {
    BOARD.select.selectize().resize().draggable();
    // BOARD.select.on("click", clickFig);
    BOARD.select.on("mousedown", downFigure);
    BOARD.select.on("mouseup", upFigure);
    changeViewProperty(BOARD.select.type);
    synch();
}


function resetSelect() {
    if (BOARD.select) {
        BOARD.select.selectize(false).resize(false).draggable(false);
        BOARD.select.selectize(false, {deepSelect: true}).resize(false).draggable(false);
        BOARD.select = null;
    }


}

$(".simple .fig-1").mouseup(function () {
    resetSelect();
    var fig = BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000");
    BOARD.select = fig;
    selectFigure();

});

$(".simple .fig-2").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000"));
    group.add(BOARD.svg.line(0, 50, 50, 0).stroke("#000000"));
    BOARD.select = group;

    selectFigure();

});

$(".simple .fig-3").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000"));
    group.add(BOARD.svg.line(0, 50, 25, 25).stroke("#000000"));
    group.add(BOARD.svg.line(0, 0, 25, 25).stroke("#000000"));
    BOARD.select = group;

    selectFigure();
});

$(".simple .fig-4").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000"));
    group.add(BOARD.svg.line(0, 50, 50, 0).stroke("#000000"));
    group.add(BOARD.svg.line(0, 0, 50, 50).stroke("#000000"));
    BOARD.select = group;

    selectFigure();
});

$(".simple .fig-5").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000"));
    var circ = BOARD.svg.path('M0,50 v-25 a0,25 0 1,0 25,50 Z');
    circ.fill('none');
    circ.stroke({color: '#f06', width: 1});
    group.add(circ);


    // <path d="M300,200 h-150 a150,150 0 1,0 150,-150 z"
    // fill="red" stroke="blue" stroke-width="5" />

    BOARD.select = group;

    selectFigure();
});


$(".simple .fig-6").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.rect(50, 50).fill("#ffffff").stroke("#000000"));
    group.add(BOARD.svg.line(0, 50, 50, 0).stroke("#000000"));
    group.add(BOARD.svg.line(0, 0, 50, 50).stroke("#000000"));
    BOARD.select = group;

    selectFigure();
});

$(".simple .fig-7").click(function () {
    resetSelect();
    var group = BOARD.svg.group();
    group.add(BOARD.svg.circle(50).stroke("#000000").fill("#ffffff"));
    group.add(BOARD.svg.line(25, 0, 25, 50).stroke("#000000").rotate(45));
    BOARD.select = group;

    selectFigure();
});

function cutFigure() {
    copyElement();
    deleteFigure();
}

function copyElement() {
    if (BOARD.select) {
        BOARD.buffer = BOARD.select;
    }
}

function pasteElement() {

    if (BOARD.buffer) {
        var clone;
        if (BOARD.buffer.node.parentElement) {
            if(BOARD.buffer.type != 'g'){
                clone = BOARD.buffer.clone();
            }else{
                clone = BOARD.svg.group();
                var child = BOARD.buffer.children();
                for(var i = 0; i < child.length; i++){
                    var elem =child[i].clone();
                    elem.on("mousedown", downFigure);
                    elem.on("mouseup", upFigure);
                    clone.add(elem);
                }
            }


        } else {
            clone = BOARD.buffer.addTo(BOARD.svg);
        }
        resetAllSelect();
        if(clone.type != 'g'){
            clone.on("mousedown", downFigure);
            clone.on("mouseup", upFigure);
            clone.move(0, 0);
        }else{
            clone.dmove(20,-20);
        }


        clone.selectize().resize().draggable();
        BOARD.select = clone;
        changeViewProperty(BOARD.select.type);
    }
}

function sendToServ() {
    var figures = [];
    BOARD.svg.children().forEach(function (item) {
        var figure = {};
        figure.type = item.type;
        switch (figure.type) {
            case 'line':
                figure.x1 = item.attr('x1');
                figure.x2 = item.attr('x2');
                figure.y1 = item.attr('y1');
                figure.y2 = item.attr('y2');
                break;
            case 'rect':
                figure.x = item.attr('x');
                figure.y = item.attr('y');
                figure.width = item.attr('width');
                figure.height = item.attr('height');
                break;
            case 'ellipse':
                figure.cx = item.attr('cx');
                figure.cy = item.attr('cy');
                figure.rx = item.attr('rx');
                figure.ry = item.attr('ry');
                break;
            case 'polygon':
                figure.points = item.array().value;
                break;
        }
        figures.push(figure);
    });
}

$('.bargello-property_cnt-row').change(function () {
    drawRects();
});

$('.bargello-property_cnt-col').change(function () {
    drawRects();
});

$('.bargello-property_size-col').change(function () {
    w = +$('.bargello-property_cnt-col').val() * +$(this).val();
    $('.canvas-width__number').val(w);
    BOARD.svg.size(w * PIX_IN_CM, h * PIX_IN_CM);
    drawRects();
});

function normalMode() {
    BOARD.bargello = false;
    BOARD.svg.clear();
    showDrawInstruments();
}

function bargello() {
    $('.bargello-property_size-col').val(w / +$('.bargello-property_cnt-col').val());
    BOARD.bargello = true;
    changeViewProperty('bargello');
    hideDrawInstruments();
    drawRects();
}

function hideDrawInstruments() {
    $('.instrument.line').hide();
    $('.instrument.rect').hide();
    $('.instrument.ellipse').hide();
    $('.instrument.polygon').hide();
    $('.instrument.template').hide();
    $('.instrument.fill').show();
    BOARD.svg.off('mousedown', mouseDown);
    BOARD.svg.off('mousemove', mouseMove);
    BOARD.svg.off('mouseup', mouseUp);
    BOARD.svg.off('mouseleave', mouseLeave);
}

function showDrawInstruments() {
    $('.instrument.line').show();
    $('.instrument.rect').show();
    $('.instrument.ellipse').show();
    $('.instrument.polygon').show();
    $('.instrument.template').show();
    $('.instrument.fill').hide();
    BOARD.svg.on('mousedown', mouseDown);
    BOARD.svg.on('mousemove', mouseMove);
    BOARD.svg.on('mouseup', mouseUp);
    BOARD.svg.on('mouseleave', mouseLeave);
}


var stepDargello;
function drawRects() {
    BOARD.svg.clear();

    var cntRow = +$('.bargello-property_cnt-row').val();
    var cntCol = +$('.bargello-property_cnt-col').val();

    var width = w * PIX_IN_CM;
    var height = h * PIX_IN_CM;

    var widthRect = width / cntCol;
    var heightRect = height / cntRow;

    stepDargello = widthRect / 5;

    for (var i = 0; i < cntCol; i++) {
        for (var j = 0; j < cntRow; j++) {
            var fig = BOARD.svg.rect(widthRect, heightRect)
                    .move(i * widthRect, j * heightRect)
                    .fill("#ffffff")
                    .stroke({color: "#000000"})
                    .addClass('bargello-col' + i)
                    .addClass('bargell-row' + j)
                ;
            fig.on('click', clickOnColBargello);
            fig.on('mousedown', mouseDownOnBargello);
            fig.on('mousemove', mouseMoveOnBargello);
            BOARD.svg.on('mouseup', mouseUpOnBargello);
        }
    }
}

function clickOnColBargello() {
    if ($('.instrument.fill').hasClass('active')) {
        var className = '.' + this.node.classList[0];
        var fill;
        if ($('#colorSelector').hasClass('color-selector')) {
            fill = $('#colorSelector div').css('background-color');
        } else {
            var pattern = BOARD.svg.pattern(20, 20, function (add) {
                add.image(BOARD.textureSRC)
            });
            fill = pattern;
        }
        $(className).css({'fill': fill});
    }

}

var mouseDownBarg = false;
function mouseDownOnBargello() {
    mouseDownBarg = true;
}

function mouseUpOnBargello() {
    mouseDownBarg = false;
}


var predX = 0;
function mouseMoveOnBargello(e) {

    if (mouseDownBarg && $('.instrument.move').hasClass('active')) {

        var cntCol = +$('.bargello-property_cnt-col').val();

        var x = e.offsetX == undefined ? e.layerX : e.offsetX;
        if (Math.abs(x - predX) > 10) {

            var way = x - predX > 0 ? 1 : -1;

            var className = '.' + this.node.classList[1];
            var elements = SVG.select(className);
            for (var i = 0; i < elements.members.length; i++) {
                var num;
                if (elements.members[i].x() < 0) {
                    num = (i + cntCol - 1) % cntCol;
                    console.log(elements.members[num].x() + elements.members[num].width());
                    elements.members[i].attr('x', elements.members[num].x() + elements.members[num].width());
                }
                if (elements.members[i].x() + elements.members[i].width() > w * PIX_IN_CM) {
                    num = (i + cntCol + 1) % cntCol;
                    elements.members[i].attr('x', elements.members[num].x() - elements.members[num].width());
                }
            }
            elements.dmove(way * stepDargello);
            predX = x;

        }
    }
}


