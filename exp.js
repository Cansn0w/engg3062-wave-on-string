"use strict";

function CanvasCtl(id, width, height) {
    
    var obj = {};
    
    obj.width = width;
    obj.height = height;
    obj.ratio = width/height;
    
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
        obj.stage.scaleX = obj.stage.scaleY = obj.stage.canvas.width/obj.width;
    };

    return obj;
}

function WaveString(length) {
    var obj = {};
    
    obj.tension = (document.getElementById('tension').value / 100) * maxTension;
    obj.damping = (document.getElementById('damping').value / 100) * maxDamping;
    obj.length = length;
    
    obj.arr = [];
    
    for (var i = 0; i < length + 1; i ++) {
        obj.arr[i] = {pos:0, vel:0, acc:0};
    }
    
    obj.head = obj.arr[0];
    obj.tail = obj.arr[length];
    
    obj.shape = new createjs.Shape();
    obj.shape.name = 'waveString'
    
    obj.x0 = -1, obj.x1 = -1
    obj.y = -1, obj.y1 = -1

    obj.colour = '#00f';
    
    obj.moveTo = function (left, right, height) {
        obj.x0 = left;
        obj.x1 = right;
        obj.y = height;
    }
    
    obj.setColour = function(colour) {
        obj.m_colour = colour;
    }
    
    obj.update = function() {
        // update acc based on position;
        for (var i = 1; i < obj.length; i++) {
            obj.arr[i].acc = ((obj.arr[i-1].pos + obj.arr[i+1].pos) / 2 - obj.arr[i].pos) * obj.tension;
        }
        // update pos and vel;
        for (var i = 1; i < obj.length; i++) {
            obj.arr[i].vel += obj.arr[i].acc;
            obj.arr[i].vel *= (1 - obj.damping)
            obj.arr[i].pos += obj.arr[i].vel;
        }
        
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

/************ WO SHI FEN GE XIAN ************/
// com
var w = 1300, h = 650
var stage, canvas
var manifest = [
	{src: './img/pikachu.png', id: 'pikachu'},
	{src: './img/mew.png', 	   id: 'mew'},
	{src: './img/snory.png',   id: 'snory'},
	{src: './img/lamp.png',    id: 'lamp'},
	{src: './img/pulse.png',   id: 'pulse'},
	{src: './img/e_tear.png',  id: 'e_tear'},
	{src: './img/e_sad.png',   id: 'e_sad'},
	{src: './img/e_unamused.png', 	id: 'e_unamused'},
	{src: './img/e_dizzy.png', 		id: 'e_dizzy'},
	{src: './img/jump_bed.png', 	id : 'jump_bed'}
]
var loadQueue = null

// UI components
var objs = {}, stats = {}
var pokemon, pulser, receiver, jumpBed, lLamp, rLamp
var imgs = null

// simulation state
var mode = 'pokemon'  // options : { 'diy', 'pokemon'}
var endType = 'fixed'     // options : { 'fixed', 'loose', 'none'}
var damping, tension
var maxTension = 1, maxDamping = 0.08, maxWavelen = 50
var wavelen = maxWavelen * 0.5, amp = 50


// wave string
var str = initWaveStr()
var ctr = wavelen
var ls = cacheWave(wavelen)


/*************** 
 * MAIN EVENTS *
 ***************/ 
function init() {
	// set stage
	canvas = CanvasCtl('_canvas', w, h);
	stage = canvas.stage

    // set ticker
	createjs.Ticker.framerate = 60
	createjs.Ticker.addEventListener('tick', update)
	window.addEventListener('resize', resize, false);
    resize()
    // preload images
    loadQueue = new createjs.LoadQueue(false)
    loadQueue.addEventListener('complete', start)
    loadQueue.loadManifest(manifest)
}

function start() {
	for (var img in manifest) {
        var id = manifest[img].id 
		objs[id] = new createjs.Bitmap(loadQueue.getResult(id))
        objs[id].name = id
	}
    // load canvas scene
	loadPokemonScene('pikachu')
}

function update(evt) {
	if (!evt.paused) {
        if (ctr < wavelen) {
            ++ctr
            str.head.pos = ls[ctr]
        }
		canvas.update();
		str.update()
	}
}

function refresh() {
    stage.removeAllChildren()
    str = initWaveStr()
}

function resize() {
	canvas.resize(window.innerWidth * 0.8, window.innerHeight * 0.8);
}

/*****************
 * SCENE LOADERS *
 ****************/ 
function loadPokemonScene(name) {
 	// refresh
    refresh()
 	pulser = objs['pulse'].clone() ,jumpBed = objs['jump_bed'].clone(), pokemon = objs[name].clone()
 	pokemon['falling'] = true

 	// locate
 	pulser.x = (1/10)*w - 30, pulser.y = h/2
 	jumpBed.x = (1/10)*w - 75, jumpBed.y = (6.5/8)*h
 	pokemon.x = (1/10)*w, pokemon.y = h/2
    pokemon.regX = pokemon.regY = pokemon.image.width/2

 	pokemon.addEventListener('tick', function(evt) {
 		// handle the jumping pokemon
 		if (!evt.paused) {
		    pokemon.y += 3 * (pokemon['falling'] ? 1 : -1)
		    pokemon.rotation += 3

		    if (pokemon.y >= jumpBed.y - 15) {
		        pokemon['falling'] = false
            }
		    else if (pokemon.y <= h/2 + pokemon.regY) {
		        pokemon['falling'] = true
                // send a new wave if pulser is not making one
                ctr = ctr < wavelen ? ctr : 0
            }
 		}
 	})

 	stage.addChild(str.shape, pulser, jumpBed, pokemon)
 	loadReceiver()
 }

 function loadDiyScene() {
 	// refresh
    refresh()
 	pulser = objs['e_tear'].clone(), lLamp = objs['lamp'].clone()

    // define a hit area for dragger pulser to prevent crossDomain erro
    var hit = new createjs.Shape();
    hit.graphics.beginFill("#000").drawCircle(0, 0, pulser.image.width, pulser.image.height);
    pulser.hitArea = hit;

 	// locate
 	lLamp.x = (1/14)*w, lLamp.y = h/5
 	pulser.x = (1/14)*w + 30, pulser.y = h/2

 	pulser.on('pressmove', function(evt){
        var diff = evt.stageY - pulser.y + pulser.image.height
 		pulser.y += pulser.y + diff < h/5 || pulser.y + diff > (8/9) * h ? 0 : diff
 	})

 	stage.addChild(str.shape, lLamp, pulser)
 	loadReceiver()
 }

 function loadReceiver() {
 	receiver = objs['e_dizzy'], rLamp = objs['lamp'].clone()
 	receiver.x = (7/8)*w + 30, receiver.y = h/2
 	rLamp.x = (7/8)*w, rLamp.y = h/5
 	stage.addChild(rLamp, receiver)
 }

/*******************
 * HTML UI EVENTS  *
 *******************/
function handleCheckBox(cb) {
	var id = cb.id
	if (mode === id.substring(0, id.indexOf('CheckBox')))
		return
	mode = id.substring(0, id.indexOf('CheckBox'))
	cb.src = './img/checked.png'

	// refresh canvas  
	if (id == 'diyCheckBox')
		loadDiyScene()
	else if (id == 'pokemonCheckBox')
		loadPokemonScene('pikachu')

	// finally, untick the other checkbox
	var otherCheckbox = document.getElementById(id == 'diyCheckBox' ? 'pokemonCheckBox' : 'diyCheckBox')
	otherCheckbox.src = './img/unchecked.png'
}

function handleEndType(rb) {
	var rbname = rb.id
	endType = rbname.substring(rbname.indexOf('_') + 1, rbname.length)
}

function handlePlayPause() {
	var btn_play = document.getElementById('btn_play')
	var label = btn_play.textContent
	btn_play.textContent = label == 'Play' ? 'Pause' : 'Play'
	createjs.Ticker.paused = !createjs.Ticker.paused
}

function handleSlider(pct, attr) {
    console.log(pct)
    switch (attr) {
        case 'tension': str.tension = maxTension * pct
            break
        case 'damping': str.damping = maxDamping * pct
            break
        case 'wavelen': 
            wavelen = maxWavelen * pct
            ls = cacheWave(wavelen)
            break
    }
}

function handleSelect() {
    var selector = document.getElementById('pokemonType')
    var pkname = selector.options[selector.selectedIndex].value
    pokemon.image.src = './img/' + pkname + '.png'
}

function handleReload() {
	location.reload()
}

/*******************
 * HELPER METHODS  *
 *******************/
function initWaveStr() {
    var str = WaveString(100)
    str.moveTo((1/10)*w + 10, (7/8)*w + 50, h/2 + 20);
    return str
}

function cacheWave(len) {
    var lst = []
    for (var i = 0; i < len; i ++) 
        lst[i] = Math.sin(2 * Math.PI * i / len) * amp
    lst = lst.concat(lst.slice(0).reverse());
    return lst
}
