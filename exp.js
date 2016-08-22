"use strict";

var img_list = [
	{src: './img/pikachu.png', id: 'pikachu'},
	{src: './img/mew.png', 	   id: 'mew'},
	{src: './img/snory.png',   id: 'snory'},
	{src: './img/lamp.png',    id: 'lamp'},
	{src: './img/pulse.png',   id: 'pulse'},
	{src: './img/e_tear.png',  id: 'e_tear'},
	{src: './img/e_sad.png',   id: 'e_sad'},
	{src: './img/e_unamused.png', 	id: 'e_unamused'},
	{src: './img/e_dizzy.png', 		id: 'e_dizzy'},
	{src: './img/jump_bed.png', 	id: 'jump_bed'},
    {src: './img/blackhole.png',    id: 'blackhole'}
]

// - - - - - - //

function CanvasCtl(id, width, height) {
    
    var obj = {};
    
    obj.width = width;
    obj.height = height;
    
    obj.ratio = width/height;
    obj.scale = 1;
    
    obj.stage = new createjs.Stage(id);
    
    obj.update = function() {
        obj.stage.update();
    };
    
    obj.resize = function (width, height) {
        if (width > height*obj.ratio) {
            obj.stage.canvas.width = height*obj.ratio;
            obj.stage.canvas.height = height;
        } else {
            obj.stage.canvas.width = width;
            obj.stage.canvas.height = width/obj.ratio;
        }
        obj.scale = obj.stage.canvas.width/obj.width;
        obj.stage.scaleX = obj.stage.scaleY = obj.scale;
    };
    
    return obj;
}

function WaveString(length) {
    var obj = {};
    
    // Attributes
    obj.length = length;
    
    obj.tension = 1;
    obj.damping = 0;
    
    obj.end = END.FIXED
    
    // Node array
    obj.arr = [];
    
    for (var i = 0; i < length + 1; i ++) {
        obj.arr[i] = {pos:0, vel:0, acc:0};
    }
    
    obj.head = obj.arr[0];
    obj.tail = obj.arr[length];
    
    // Graphics elements
    obj.shape = new createjs.Shape();
    
    obj.x0 = -1;
    obj.x1 = -1;
    obj.y = -1;
    obj.colour = '#00f';
    
    obj.moveTo = function (left, right, height) {
        obj.x0 = left;
        obj.x1 = right;
        obj.y = height;
    }
    
    obj.setColour = function(colour) {
        obj.m_colour = colour;
    }
    
    obj.reset = function() {
        for (var i = 0; i < obj.length + 1; i ++) {
            obj.arr[i].pos = 0;
            obj.arr[i].vel = 0;
            obj.arr[i].acc = 0;
        }
    }
    
    obj.update = function() {
        var dampRatio = (1 - obj.damping)
		var len = obj.length;
        // update acc based on position;
        for (var i = 1; i < len; i++) {
            obj.arr[i].acc = ((obj.arr[i-1].pos + obj.arr[i+1].pos) / 2 - obj.arr[i].pos) * obj.tension;
        }
        
        // update end node;
        if (obj.end === END.FIXED) {
            obj.tail.pos = 0;
            obj.tail.vel = 0;
            obj.tail.acc = 0;
        } else if (obj.end === END.LOOSE) {
            obj.tail.acc = (obj.arr[len-1].pos - obj.tail.pos) / 2 * obj.tension;
            obj.tail.vel = (obj.tail.vel + obj.tail.acc) * dampRatio;
            obj.tail.pos += obj.tail.vel;
        } else if (obj.end === END.NONE) {
            obj.tail.pos = obj.arr[len-1].pos
        }
        
        // update pos and vel;
        for (var i = 1; i < len; i++) {
            obj.arr[i].vel = (obj.arr[i].vel + obj.arr[i].acc) * dampRatio;
            obj.arr[i].pos += obj.arr[i].vel;
        }
    }
    
    obj.draw = function() {
        // update drawing;
        var x = obj.x0;
        var step = (obj.x1 - obj.x0) / obj.arr.length;
        
        obj.shape.graphics.clear();
        obj.shape.graphics.setStrokeStyle(2).beginStroke(obj.colour);
        
        obj.shape.graphics.moveTo(x, obj.y + obj.head.pos);
        var len = obj.arr.length;
        for (var i = 1; i < len; i++) {
            x += step;
            obj.shape.graphics.lineTo(x, obj.y + obj.arr[i].pos);
        }
        
        obj.shape.graphics.endStroke();
    }
    
    return obj;
}

function StrEnd() {
    
}

// - - - - - WO SHI FEN GE XIAN - - - - - //
var w = 1600, h = 900;
var stage, canvas, modectl, endctl;
var components = [];
var loadQueue = null

var END = {FIXED: 0, LOOSE: 1, NONE: 2};
var MODE = {SHM: 0, DIY: 1};

// UI components
var img = {}, pokemon;

// simulation state
var playing = true;
var f_shm = false;
var damping, tension
var maxTension = 2, maxDamping = 0.08, maxWavelen = 70;

// wave string

var str = WaveString(200);
str.tension = (document.getElementById('tension').value / 100) * maxTension;
str.damping = (document.getElementById('damping').value / 100) * maxDamping;

// shm

var shmctl;
var wavelen = (document.getElementById('wavelen').value / 100) * maxWavelen + 10;
var amp = 60;

str.moveTo((1/10)*w + 10, (7/8)*w + 50, h/2 + 20);
str.draw();

/*************** 
 * MAIN EVENTS *
 ***************/

function update() {
    if (playing) {
        str.update()
    }
    str.draw();
    for (var i = components.length - 1; i > -1 ; i--)
        components[i].update();
}

function init() {
	// set stage
	canvas = CanvasCtl('_canvas', w, h);
    components.push(canvas);
	stage = canvas.stage;

    // set ticker
	createjs.Ticker.framerate = 60;
	createjs.Ticker.addEventListener('tick', update);
	window.addEventListener('resize', resize, false);
    resize();

    // preload images
    loadQueue = new createjs.LoadQueue(false);
    loadQueue.addEventListener('complete', loadMedia);
    loadQueue.loadManifest(img_list);
}

function loadMedia() {
	for (var i = 0; i < img_list.length; i++) {
        var id = img_list[i].id;
		img[id] = new createjs.Bitmap(loadQueue.getResult(id));
    }
    
    // post media load actions
    modectl = ModeCtl(str);
    stage.addChild(str.shape);
    modectl.enable(MODE.SHM);
    endctl = EndCtl(str)
    shmctl = SHMCtl();
    components.push(endctl);
}

function resize() {
	canvas.resize(window.innerWidth * 0.8, window.innerHeight * 0.8);
}

/*****************
 * SCENE LOADERS *
 ****************/

function ModeCtl(str) {
    var obj = {};
    obj.str = str;
    obj.tasks = [];
    
    obj.lamp = img['lamp'].clone();
 	obj.lamp.x = (1/14)*w, obj.lamp.y = h/5
    obj.pulser = img['pulse'];
    obj.pulser.x = (1/10)*w - 32;
    obj.pulser.y = h/2 - 2;
    obj.tear = img['e_tear'];
    obj.tear.x = (1/14)*w + 30;
    obj.tear.y = h/2
    obj.hit = new createjs.Shape();
    obj.hit.graphics.beginFill("#000").drawCircle(0, 0, obj.tear.image.width, obj.tear.image.height);
    obj.tear.hitArea = obj.hit;
    
    obj[MODE.SHM] = {
        init: (function(){
            stage.addChild(obj.pulser);
            obj.str.head.pos = 0;
        }),
        exit: (function(){stage.removeChild(obj.pulser); if (f_shm) handleSHM();})
    }
    
    
    obj[MODE.DIY] = {
        init: (function(){
            document.getElementById('btn_pulse').style.display = 'none';
            document.getElementById('wavelen').style.display = 'none';
            document.getElementById('btn_shm').style.display = 'none';
            document.getElementById('pokemonType').style.display = 'none';
            document.getElementById('wavelen_text').style.display = 'none';
            stage.addChild(obj.lamp, obj.tear);
            obj.tear.y = h/2 + (str.head.pos) * canvas.scale;
            obj.tear.on('pressmove', function(e) {
                obj.tear.y = e.stageY / canvas.scale - 30;
                str.head.pos = e.stageY / canvas.scale - 30 - h/2;
            })
        }),
        exit: (function(){
            stage.removeChild(obj.lamp, obj.tear);
            document.getElementById('btn_pulse').style.display = '';
            document.getElementById('wavelen').style.display = '';
            document.getElementById('btn_shm').style.display = '';
            document.getElementById('pokemonType').style.display = '';
            document.getElementById('wavelen_text').style.display = '';
        })
    }
    
    obj.mode = null;
    obj.enable = function (mode) {
        if (obj.mode != null)
            obj[obj.mode].exit();
        obj.mode = mode;
        obj[mode].init();
    }
    
    return obj;
}

function EndCtl(str) {
    var obj = {};
    obj.str = str;
    obj.tasks = [];
    
    obj.lamp = img['lamp'].clone();
    obj.lamp.x = (7/8)*w, obj.lamp.y = h/5;
    
    img['e_sad'].x = (7/8)*w + 30;
    img['e_sad'].y = h/2;
    obj[END.FIXED] = {
        init: (function(){stage.addChild(obj.lamp, img['e_sad'])}),
        exit: (function(){stage.removeChild(obj.lamp, img['e_sad'])})
    }
    
    img['e_dizzy'].x = (7/8)*w + 30;
    img['e_dizzy'].y = h/2;
    obj[END.LOOSE] = {
        init: (function(){stage.addChild(obj.lamp, img['e_dizzy']); obj.tasks.push(function() {img['e_dizzy'].y = h/2 + str.tail.pos;})}),
        exit: (function(){stage.removeChild(obj.lamp, img['e_dizzy']); obj.tasks.pop();})
    }
    
    img['blackhole'].x = (7/8)*w - 50;
    img['blackhole'].y = h/2 - 60;
    obj[END.NONE] = {
        init: (function(){stage.addChild(img['blackhole'])}),
        exit: (function(){stage.removeChild(img['blackhole'])})
    }
    
    obj.endType = obj.str.end;
    obj[obj.endType].init();
    
    obj.update = function() {
        // auto update
        if (obj.endType != obj.str.end) {
            obj[obj.endType].exit();
            obj.endType = obj.str.end;
            obj[obj.endType].init();
        }
        for (var i = 0; i < obj.tasks.length; i++) {
            obj.tasks[i]();
        }
    }
    return obj;
}

function SHMCtl () {
    var obj = {};
    
    obj['pikachu'] = img['pikachu'];
    obj['pikachu'].x = (1/12)*w;
    obj['snory'] = img['snory'];
    obj['snory'].x = (1/12)*w;
    obj['mew'] = img['mew'];
    obj['mew'].x = (1/12)*w;
    
    obj.pokemon = obj[document.getElementById('pokemonType').options[document.getElementById('pokemonType').selectedIndex].value];
    obj.jumpBed = img['jump_bed'];
    
 	obj.pokemon.x = (1/11)*w;
    obj.pokemon.y = h/2;
 	obj.jumpBed.x = (1/11)*w - 75;
    obj.jumpBed.y = (6.5/8)*h;
    
    obj.x = 0;
    
    obj.change = function (pokemon) {
        stage.removeChild(obj.pokemon);
        obj.pokemon = obj[pokemon];
        stage.addChild(obj.pokemon);
    }
        
    obj.init = function () {stage.addChild(obj.jumpBed, obj.pokemon); components.push(obj); obj.x = 0;}
    
    obj.exit = function() {
        stage.removeChild(obj.pokemon, obj.jumpBed); str.head.pos = 0; components.splice(components.indexOf(obj), 1);
    }
    
    obj.update = function () {
        if (!playing)
            return;
        var step = 1 / wavelen;
        obj.x += step;
        while (obj.x > 1)
            obj.x -=1;
        str.head.pos = -amp * Math.sin(obj.x*2*Math.PI);
        
        obj.pokemon.y = h/2 + (h/2 - obj.jumpBed.y) * (Math.sin(obj.x*2*Math.PI) / 2 - 1/3);
    }

 	return obj;
}

/*******************
 * HTML UI EVENTS  *
 *******************/
function handleCheckBox(cb) {
	var id = cb.id;
	cb.src = './img/checked.png';
    document.getElementById(id == 'diyCheckBox' ? 'pokemonCheckBox' : 'diyCheckBox').src = './img/unchecked.png';

	// refresh canvas  
    if (id == 'diyCheckBox')
        modectl.enable(MODE.DIY);
	else if (id == 'pokemonCheckBox')
        modectl.enable(MODE.SHM);
}

function handleEndType(rb) {
	var rbname = rb.id
    switch (rbname.substring(rbname.indexOf('_') + 1, rbname.length)) {
        case 'fixed': 
        str.end = END.FIXED
        break
        case 'loose': 
        str.end = END.LOOSE
        break
        case 'none':    
        str.end = END.NONE
        break
    }
}

function handleSlider(pct, attr) {
    switch (attr) {
        case 'tension': str.tension = maxTension * pct;
            break;
        case 'damping': str.damping = maxDamping * pct;
            break;
        case 'wavelen': wavelen = maxWavelen * pct + 10;
            break;
    }
}

function handleSelect() {
    var selector = document.getElementById('pokemonType');
    shmctl.change(selector.options[selector.selectedIndex].value);
}

function handlePause() {
	var btn_play = document.getElementById('btn_pause');
    playing = !playing;
	btn_play.textContent = playing ? 'Pause' : 'Resume'
    
}

function handleReload() {
	str.reset();
    
    // hack
    if (modectl.mode === MODE.DIY)
        modectl.enable(MODE.DIY);
}

function handleSHM() {
    f_shm = !f_shm;
    document.getElementById('btn_shm').innerHTML = f_shm ? 'Stop SHM' : 'Start SHM';
    document.getElementById('btn_pulse').style.display = f_shm ? 'none' : '';
    if (f_shm) {
        shmctl.init();
    } else {
        shmctl.exit();
    }
}

function handlePulse() {
    components.push((function(){
        var obj = {};
        obj.x = 0;
        obj.update = function() {
            if (!playing)
                return;
            obj.x += 1 / wavelen;
            if (obj.x > 1)
                components.splice(components.indexOf(obj), 1);
            else
                str.head.pos = -amp * Math.sin(obj.x*2*Math.PI);
        }
        return obj;
    })())
}

