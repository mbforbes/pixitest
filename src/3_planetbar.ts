/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="../lib/stats.d.ts" />

// GLOBAL OBJECT: app
// -----------------------------------------------------------------------------

class Constants {
	static LIGHT_BLUE = 0x4e929c;
}

interface App {

	// Core
	renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
	stage: PIXI.Container;

	// Our stuff
	sprites: StringSpriteMap;
	debugText: MaxText;
	stats: Stats;
	// children are stuff we need to call update on.
	children: any[];

	// some constants
	width: number;
	height: number
}
var app = {} as App;

// Our own objects to add functionality
// -----------------------------------------------------------------------------

// TODO(mbforbes): Consider making a single contract:
// - z
// - game_update
// - update
//
// ...and then providing a default implementation of game_update (as many as
// necessary, hopefully one). Then make as few base classes that implement this
// as needed and use those.

interface GameObject extends PIXI.Container {
	z: number;
	// game_update(): void;
	children: GameObject[];
	updater: SelfUpdater;
	update(): void;
}

class SelfUpdater {
	constructor(public parent: GameObject) {};
	game_update(): void {
		this.parent.update();
		for (var child of this.parent.children) {
			child.updater.game_update();
		}
	}
}

// abstract class AbstractGameObject extends PIXI.DisplayObject implements GameObject {
// 	z: number = 0;
// 	children: GameObject[];

// 	game_update(): void {
// 		this.update();
// 		for (var child of this.children) {
// 			child.game_update();
// 		}
// 	}
// 	abstract update(): void;
// }


class MaxGraphics extends PIXI.Graphics implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
};

class MaxText extends PIXI.Text implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
};

abstract class MaxSprite extends PIXI.Sprite implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	abstract update(): void;

	// z: number;
	// bar: ProgressBar;
	// children: Updater[];

	// game_update(): void {
	// 	this.update();
	// 	for (var child of this.children) {
	// 		child.game_update();
	// 	}
	// }
	// abstract update(): void;
}

class Planet extends MaxSprite {
	bar: ProgressBar;
	update(): void {
		this.rotation += 0.001;
	}
}

// interface Updater extends PIXI.DisplayObject {
// 	game_update(): void;
// 	update(): void;
// }

// abstract class BasicUpdater extends PIXI.DisplayObject implements Updater {
// 	children: Updater[] = [];
// 	game_update(): void {
// 		this.update();
// 		for (var child of this.children) {
// 			child.game_update();
// 		}
// 	}
// 	abstract update(): void;
// }

interface StringSpriteMap {
	[name: string]: MaxSprite;
}

function depthCompare(a: GameObject, b: GameObject) {
	if (a.z < b.z) {
		return -1;
	} if (a.z > b.z) {
		return 1;
	}
	return 0;
}

// some real meat

class ProgressBar extends PIXI.Container implements GameObject {
	// static

	static from_parent(parent: MaxSprite): ProgressBar {
		var lx = Math.floor(parent.x - parent.width*(1-parent.anchor.x));
		var ly = Math.floor(parent.y + parent.height*(1-parent.anchor.y));
		var lw = Math.floor(parent.width);
		var lh = 29;

		var p = new ProgressBar(lx, ly, lw, lh);
		parent.addChild(p);
		return p
	}

	// instance

	z = 0;
	children = [];
	start: number = -1;
	updater = new SelfUpdater(this);
	goal: number = -1;
	outline: MaxGraphics = new MaxGraphics();
	fill: MaxGraphics = new MaxGraphics();

	constructor(public x: number, public y: number, public w: number, public h: number) {
		super();
		app.stage.addChild(this.outline);
		app.stage.addChild(this.fill);
	}

	build_appear(): void {
		this.outline.clear();

		this.outline.lineStyle(1, 0xffffff, 0.8);
		this.outline.moveTo(this.x, this.y);
		this.outline.lineTo(this.x, this.y+this.h);
		this.outline.lineTo(this.x+this.w, this.y+this.h);
		this.outline.lineTo(this.x+this.w, this.y);
		this.outline.lineTo(this.x, this.y);
		this.outline.endFill();
	}

	/// 0 <= portion <= 1
	fill_to(portion: number): void {
		if (portion < 0 || portion > 1) {
			return;
		}
		this.fill.clear();
		this.fill.beginFill(Constants.LIGHT_BLUE, 0.8);
		// NOTE(mbforbes): Why this looks right with x and not x+1 is beyond me.
		this.fill.drawRect(this.x, this.y+1, (this.w-1)*portion, this.h-2);
		this.fill.endFill();
	}

	set_goal(ms: number) {
		this.start = Date.now();
		this.goal = this.start + ms;
	}

	update() {
		if (this.start != -1) {
			var cur = Date.now()
			if (cur > this.goal) {
				this.fill_to(1)
				this.start = -1;
				this.goal = -1;
			}  else {
				var portion = (cur - this.start) / (this.goal - this.start);
				this.fill_to(portion);
			}
		}
	}
}

function dbg(text: string) {
	app.debugText.text += text + '\n';
}

function earthClick (event: PIXI.interaction.InteractionEvent) {
	var sprite: Planet = event.target;
	if (typeof sprite.bar === 'undefined') {
		sprite.bar = ProgressBar.from_parent(sprite);
		console.log(event.target);
		dbg('Mission initiated');
		sprite.bar.build_appear()
		sprite.bar.set_goal(1000);
	}
	// drawProgressOutline();
}

// function drawProgressOutline() {
// 	// var g = new PIXI.Graphics();
// 	var g = new MaxGraphics();
// 	g.z = 2;
// 	var earth: PIXI.Sprite = app.sprites['earth'];

// 	var lx = Math.floor(earth.x - earth.width*(1-earth.anchor.x));
// 	var ly = Math.floor(earth.y + earth.height*(1-earth.anchor.y));
// 	var lw = Math.floor(earth.width);
// 	var lh = 29;

// 	console.log(lx);
// 	console.log(ly);
// 	console.log(lw);
// 	console.log(lh);

// 	// g.beginFill(0x7decfd, 0.0);
// 	g.lineStyle(1, 0xffffff, 0.8);
// 	// g.lineColor = 0xffffff;
// 	// g.lineWidth = 1;
// 	g.moveTo(lx, ly);
// 	g.lineTo(lx, ly+lh);
// 	g.lineTo(lx+lw, ly+lh);
// 	g.lineTo(lx+lw, ly);
// 	g.lineTo(lx, ly);
// 	g.endFill();

// 	app.stage.addChild(g)
// }

function drawGrid() {
	// settings
	var xstep = 100;
	var ystep = 100;
	var zidx = 100; // just something high to be on top of everything else
	var textc = '#aaaaaa'

	// make stuff
	// var g = new PIXI.Graphics();
	var g = new MaxGraphics();
	g.z = zidx;
	// var ts: PIXI.Text[] = [];

	g.beginFill(0xffffff, 0.2);

	for (var x = 0; x < app.width; x += xstep) {
		if (x > 0) {
			g.drawRect(x, 0, 1, app.height);
		}

		// var t = new PIXI.Text(x.toString(), { font: '10px', fill: textc, align: 'left' });
		var xt = new MaxText(x.toString(), { font: '10px', fill: textc, align: 'left' });
		xt.x = x + 5;
		xt.y = 5;
		xt.z = zidx;
		app.stage.addChild(xt)
	}
	for (var y = ystep; y < app.height; y += ystep) {
		g.drawRect(0, y, app.width, 1);

		// var yt = new PIXI.Text(y.toString(), { font: '10px', fill: textc, align: 'left' });
		var yt = new MaxText(y.toString(), { font: '10px', fill: textc, align: 'left' });
		yt.x = 5;
		yt.y = y + 5;
		yt.z = zidx;
		app.stage.addChild(yt)
	}

	g.endFill();
	app.stage.addChild(g)
	// for (var txt in ts) {
	// 	app.stage.addChild(txt);
	// }
}

// GLOBAL FUNCTIONS: setup, update, render
// -----------------------------------------------------------------------------

/// setup calls update when it completes
var setup = function() {
	// CORE SETUP
	// -------------------------------------------------------------------------
	// pre: some us crap
	app.width = 800;
	app.height = 600;

	// core: renderer
	app.renderer = PIXI.autoDetectRenderer(
		app.width, app.height, {backgroundColor : 0x050505});
	document.body.appendChild(app.renderer.view);

	// core: stage
	app.stage = new PIXI.Container();

	// US SETUP
	// -------------------------------------------------------------------------
	app.sprites = {};
	app.children = [];

	// statistics collection
	app.stats = new Stats();
	document.body.appendChild(app.stats.dom);
	app.stats.dom.style.position = "relative"
	app.stats.dom.style.top = "-40px";

	// POPULATE WITH OBJECTS
	// -------------------------------------------------------------------------
	// helper: grid!
	drawGrid();

	// game objects: add our earth
	var earth_texture = PIXI.Texture.fromImage('assets/earth.png');
	// var earth = new PIXI.Sprite(earth_texture);
	var earth = new Planet(earth_texture);
	earth.anchor.x = 0.5;
	earth.anchor.y = 0.5;
	earth.x = 400;
	earth.y = 300;
	earth.z = 0;
	earth.interactive = true;
	earth.on('mousedown', earthClick);
	// track it in our own object and add it to the stage. (Maybe we should have
	// some kind of factory or class that tracks this for us...)
	app.sprites['earth'] = earth;
	app.stage.addChild(earth);

	app.debugText = new MaxText('', {
		font: '10px',
		fill: '#' + Constants.LIGHT_BLUE.toString(16),
		align: 'center'
	});
	app.debugText.x = 600;
	app.debugText.y = 20;
	app.debugText.z = 1;
	app.stage.addChild(app.debugText)

	// sort z order
	app.stage.children.sort(depthCompare)

	// KICK OFF THE GAME
	// -------------------------------------------------------------------------
	update();
};

/// update is the main game loop. It:
/// - 1: runs update logic
/// - 2: calls render
/// - 3: asks PIXI to call it again
var update = function() {
	// pre: start stats tracking
	app.stats.begin();

	// 1: run game logic
	for (var s_name in app.sprites) {
		app.sprites[s_name].updater.game_update();
	}
	// app.sprites['earth'].rotation += 0.001;

	// 2: call render
	render();

	// 3: ask PIXI to call this again
	requestAnimationFrame(update);

	// post: tells stats done
	app.stats.end();
};

/// render is called by update
var render = function() {
	app.renderer.render(app.stage);
};

// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------
setup();
