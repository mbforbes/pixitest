/// <reference path="../lib/pixi.js.d.ts" />

// GLOBAL OBJECT: app
// -----------------------------------------------------------------------------

interface App {
	// Core
	renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
	stage: PIXI.Container;

	// Our stuff
	// TODO(mbforbes): Figure out how to make this string -> sprite
	sprites: Object;
	debugText: PIXI.Text;
}
var app = {} as App;

// TEMP CRAP BECAUSE I DON'T UNDERSTAND TYPESCRIPT YET
// -----------------------------------------------------------------------------

function earthClick (event: PIXI.interaction.InteractionEvent) {
	console.log(event.target);
}

// GLOBAL FUNCTIONS: setup, update, render
// -----------------------------------------------------------------------------

/// setup calls update when it completes
var setup = function() {
	// CORE SETUP
	// -------------------------------------------------------------------------
	// core: renderer
	app.renderer = PIXI.autoDetectRenderer(
		800, 600, {backgroundColor : 0x050505});
	document.body.appendChild(app.renderer.view);

	// core: stage
	app.stage = new PIXI.Container();

	// US SETUP
	// -------------------------------------------------------------------------
	app.sprites = {};
	// TODO(mbforbes): Make some kind of debug text holder thing here.

	// POPULATE WITH OBJECTS
	// -------------------------------------------------------------------------
	// game objects: add our earth
	var earth_texture = PIXI.Texture.fromImage('assets/earth.png');
	var earth = new PIXI.Sprite(earth_texture);
	earth.anchor.x = 0.5;
	earth.anchor.y = 0.5;
	earth.position.x = 400;
	earth.position.y = 300;
	earth.interactive = true;
	earth.on('mousedown', earthClick);
	// track it in our own object and add it to the stage. (Maybe we should have
	// some kind of factory or class that tracks this for us...)
	app.sprites['earth'] = earth;
	app.stage.addChild(earth);

	// TODO(mbforbes): Z ordering currently messed up: want to have text on top!

	app.debugText = new PIXI.Text('foobar', { font: 'bold italic 60px', fill: '#3e1707', align: 'center', stroke: '#a4410e', strokeThickness: 7 });
	app.debugText.position.x = 250;
	app.debugText.position.y = 250;
	app.stage.addChild(app.debugText)

	// KICK OFF THE GAME
	// -------------------------------------------------------------------------
	update();
};

/// update is the main game loop. It:
/// - 1: runs update logic
/// - 2: calls render
/// - 3: asks PIXI to call it again
var update = function() {
	// 1: run game logic
	app.sprites['earth'].rotation += 0.001;

	// 2: call render
	render();

	// 3: ask PIXI to call this again
	requestAnimationFrame(update);
};

/// render is called by update
var render = function() {
	app.renderer.render(app.stage);
};

// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------
setup();
