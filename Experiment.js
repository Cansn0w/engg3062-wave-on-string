"use strict";

function CanvasCtl(id) {

    var obj = {};
    obj.stage = new createjs.Stage(id);
    
    obj.update = function() {
        obj.stage.update();
    };
    
    obj.setRatio = function(ratio) {
        obj.ratio = ratio;
    }
    
    obj.resize = function (width, height) {
        if(obj.ratio) {
            if (width > height*obj.ratio) {
                obj.stage.canvas.width = height*obj.ratio;
                obj.stage.canvas.height = height;
            } else {
                obj.stage.canvas.width = width;
                obj.stage.canvas.height = width/obj.ratio;
            }
        } else {
            obj.stage.canvas.width = width;
            obj.stage.canvas.height = height;
        }
        for (var i = 0; i < obj.stage.children.length; i++) {
            if(obj.stage.children[i].resize)
                obj.stage.children[i].resize(obj.stage.canvas.width, obj.stage.canvas.height);
        }
    };
    
    return obj;
}

/************ WO SHI FEN GE XIAN ************/
// com
var w, h
var stage, c
var len = 0 // length of the wave string
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
var waveStr = null
var imgs = null

// Simulation state
var mode = 'pokemon'  // options = { 'diy', 'pokemon'}
var end = 'fixed'     // options = { 'fixed', 'loose', 'none'}
var damping, tension
var veloc, amp, freq

function init() {
	// stage
	c = CanvasCtl('_canvas');
	c.setRatio(16/9);
	stage = c.stage

	createjs.Ticker.framerate = 60
	createjs.Ticker.addEventListener('tick', update)
	window.addEventListener('resize', resize, false);
	resize()

	// wave string
	len = w - 200
	waveStr = new Array(Math.round(len/10))

	// // init stat panel
	// var statTable = document.getElementById('stat')
	// for (var i = 0; i < Things.length; i++) {
	// 	Things[i]
	// }
	// for (row in statTable.rows) {
	// 	cellName = statTable[row][1]
	// 	stats[cellName] = document.getElementById(cellName)
	// }

    // preload images
    loadQueue = new createjs.LoadQueue(false)
    loadQueue.addEventListener('complete', start)
    loadQueue.loadManifest(manifest)
}

/***************
 * MAIN EVENTS *
 ***************/ 
function start() {
	for (var img in manifest) {
		objs[manifest[img].id] = new createjs.Bitmap(loadQueue.getResult(manifest[img].id))
	}
	loadPokemonScene('pikachu', 150, h/2)
}
	
function update(evt) {
	if (!evt.paused) {
		// TODO. update stat_panel data
		c.update();
	}
}

function resize() {
    w = window.innerWidth * 0.8
    h = window.innerHeight * 0.8
    c.resize(w, h);
}

/*****************
 * SCENE LOADERS *
 ****************/ 
 function loadPokemonScene(name, x, y) {
 	// refresh
 	stage.removeAllChildren()
 	pulser = objs['pulse'].clone() ,jumpBed = objs['jump_bed'].clone(), pokemon = objs[name].clone()
 	pokemon['falling'] = true

 	// locate
 	pulser.x = x - 20, pulser.y = y
 	jumpBed.x = 50, jumpBed.y = h - 85
 	pokemon.x = x, pokemon.y = y

 	pokemon.addEventListener('tick', function(evt) {
 		// handle the jumping pokemon
 		if (!evt.paused) {
		    pokemon.y += 3 * (pokemon['falling'] ? 1 : -1)
		    pokemon.regX = pokemon.regY = pokemon.image.width/2
		    pokemon.rotation += 3

		    if (pokemon.y >= h - 100)
		        pokemon['falling'] = false
		    else if (pokemon.y <= h/2 + pokemon.regY)
		        pokemon['falling'] = true
 		}
 	})

 	stage.addChild(pulser, jumpBed, pokemon)
 	_loadReceiver()
 }

 function loadDiyScene(x, y) {
 	// refresh
 	stage.removeAllChildren()
 	pulser = objs['e_tear'].clone(), lLamp = objs['lamp'].clone()

 	// locate
 	lLamp.x = x, lLamp.y = y
 	pulser.x = x + 30, pulser.y = h/2

 	pulser.on('pressmove', function(evt){
 		var diff = evt.stageY - pulser.y
 		pulser.y += pulser.y + diff < y || pulser.y + diff > h - 100 ? 0 : diff
 	})

 	stage.addChild(lLamp, pulser)
 	_loadReceiver()
 }

 function _loadReceiver() {
 	receiver = objs['e_dizzy'], rLamp = objs['lamp'].clone()
 	receiver.x = w - 70, receiver.y = h/2
 	rLamp.x = w - 100, rLamp.y = 100
 	stage.addChild(rLamp, receiver)
 }

/*******************
 * HTML UI EVENTS  *
 *******************/
function handleCheckBox(cb) {
	var id = cb.id
	if (mode === id.substring(0, id.indexOf('CheckBox')))
		return
	else
		mode = id.substring(0, id.indexOf('CheckBox'))
	cb.src = './img/checked.png'

	// refresh canvas  
	if (id == 'diyCheckBox')
		loadDiyScene(100, 100)
	else if (id == 'pokemonCheckBox')
		loadPokemonScene('pikachu', 150, h/2)

	// finally, untick the other checkbox
	var otherCheckbox = document.getElementById(id == 'diyCheckBox' ? 'pokemonCheckBox' : 'diyCheckBox')
	otherCheckbox.src = './img/unchecked.png'
}

function handleEndType(rb) {
	var rbname = rb.id
	end = rbname.substring(rbname.indexOf('_') + 1, rbname.length)
}

function handlePlayPause() {
	var btn_play = document.getElementById('btn_play')
	var label = btn_play.textContent
	btn_play.textContent = label == 'Play' ? 'Pause' : 'Play'
	createjs.Ticker.paused = !createjs.Ticker.paused
}

function handleReload() {
	location.reload()
}
