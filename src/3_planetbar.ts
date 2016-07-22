/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="../lib/stats.d.ts" />

// Constants in this class (needs not be instantiated)
// -----------------------------------------------------------------------------

class Constants {
	static LIGHT_BLUE = 0x4e929c;
}

// GLOBAL OBJECT: app
// -----------------------------------------------------------------------------

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

// Our own classes to add functionality
// -----------------------------------------------------------------------------

// GameObject is the base contract that game objects must fulfill.
interface GameObject {
	// We want to be able to sort our objects by a z index for display order.
	z: number;

	// The children are updated by the updater.
	children: GameObject[];

	// The updater updates the self and the children.
	updater: SelfUpdater;

	// Never call update() directly. Only implement it. It's the updater's job
	// to call update().
	update(): void;
}

// SelfUpdater is a helper class so that classes that fulfill the GameObject
// contract can easily implement the correct behavior by just having an instance
// of one of these.
class SelfUpdater {
	constructor(public parent: GameObject) {};
	game_update(): void {
		this.parent.update();
		for (var child of this.parent.children) {
			child.updater.game_update();
		}
	}
}

// Our own base classes that implement the base object. The redundancy (setting
// all of the base properties each time) is annoying but finite---there are only
// a few core pixi classes. All actual classes that we make will subclass from
// these few and will *only* describe unique behavior.

// Base class for on screen objects with multiple visible components.
class MaxContainer extends PIXI.Container implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
}

// Base class for on screen line-art.
class MaxGraphics extends PIXI.Graphics implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
};

// Base class for on screen text.
class MaxText extends PIXI.Text implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
};

// Base class for on screen sprites.
class MaxSprite extends PIXI.Sprite implements GameObject {
	z = 0;
	children = [];
	updater = new SelfUpdater(this);
	update(): void {};
}

// Actual "meat" classes with specific behavior are below.

class Planet extends MaxSprite {
	bar: ProgressBar;
	update(): void {
		this.rotation += 0.001;
	}
}


class ProgressBar extends MaxContainer {
	static from_parent(parent: MaxSprite): ProgressBar {
		var lx = Math.floor(parent.x - parent.width*(1-parent.anchor.x));
		var ly = Math.floor(parent.y + parent.height*(1-parent.anchor.y));
		var lw = Math.floor(parent.width);
		var lh = 29;

		var p = new ProgressBar(lx, ly, lw, lh);
		parent.addChild(p);
		return p
	}

	start: number = -1;
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


// These interfaces are for convenience.

interface StringSpriteMap {
	[name: string]: MaxSprite;
}

// We only care about GameObjects, but pixi expects something that can work with
// DisplayObjects when sorting container elements, so we have to satisfy it.
interface DisplayAndGameObject extends PIXI.DisplayObject, GameObject {}
function depthCompare(a: DisplayAndGameObject, b: DisplayAndGameObject) {
	if (a.z < b.z) {
		return -1;
	} if (a.z > b.z) {
		return 1;
	}
	return 0;
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
