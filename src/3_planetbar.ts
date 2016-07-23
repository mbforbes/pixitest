/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="../lib/stats.d.ts" />

// Constants in this class (needs not be instantiated)
// -----------------------------------------------------------------------------

class Constants {
	static LIGHT_BLUE = 0x4e929c;
	static POINT_ZERO = new PIXI.Point(0, 0);
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
class MaxDisplayObject extends PIXI.DisplayObject implements GameObject {
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
	debugDrawer: MaxGraphics = new MaxGraphics();
	posText: MaxText = new MaxText('',  { font: '10px', fill: 0xffffff, align: 'left' });
	lbText: MaxText = new MaxText('',  { font: '10px', fill: 0xffffff, align: 'left' });
	bText: MaxText = new MaxText('',  { font: '10px', fill: 0xffffff, align: 'left' });
	bar: ProgressBar;

	constructor(texture: PIXI.Texture) {
		super(texture);
		this.bar = new ProgressBar(this);
		app.stage.addChild(this.debugDrawer);
		app.stage.addChild(this.posText);
		app.stage.addChild(this.lbText);
		app.stage.addChild(this.bText);
	}

	debug_draw(): void {
		var d = this.debugDrawer;
		var pt = this.posText;
		var lt = this.lbText;
		var bt = this.bText;

		d.clear();

		d.z = this.z + 1;
		pt.z = this.z + 1;
		lt.z = this.z + 1;
		bt.z = this.z + 1;

		// plot x, y position
		d.beginFill(0xffffff, 0.9);
		d.drawCircle(this.x, this.y, 5);
		pt.text = this.x.toString() + ', ' + this.y.toString()
		pt.x = this.x + 10
		pt.y = this.y - 10

		// plot local bounds
		d.beginFill(0xffffff, 0.0);
		d.lineStyle(1, 0xffffff, 0.9);
		var lb = this.getLocalBounds();
		d.drawRect(lb.x, lb.y, lb.height, lb.width);
		lt.x = lb.x + lb.width/2;
		lt.y = lb.y + lb.height/ 2;
		lt.anchor.x = 0.5;
		lt.anchor.y = 0.5;
		lt.text = 'local bounds';

		// plot "bounds"
		var b = this.getBounds()
		d.drawRect(b.x, b.y, b.height, b.width);
		bt.x = b.x + b.width/2 + 10;
		bt.y = b.y + b.height/2 - 15;
		// bt.anchor.x = 0.5;
		// bt.anchor.y = 0.5;
		d.drawCircle(b.x + b.width/2, b.y + b.height/2, 5);

		bt.text = 'bounds';



		d.endFill;
	}

	update(): void {
		this.rotation += 0.001;

		this.debug_draw();
	}
}


class ProgressBar extends MaxDisplayObject {
	// static settings
	// portion of parent's size to move below
	static Y_BUFFER = 0.1;

	// instance members
	start: number = -1;
	goal: number = -1;
	height: number = -1;
	width: number = -1;
	outline: MaxGraphics = new MaxGraphics();
	fill: MaxGraphics = new MaxGraphics();

	// instance member buffers
	// ppos: PIXI.Rectangle;

	calculateBounds() {

	}

	constructor(public parent: MaxSprite) {
		super();
		app.stage.addChild(this.outline);
		app.stage.addChild(this.fill);
		this.fill.z = parent.z + 1;
		this.outline.z = parent.z + 2;
		parent.addChild(this);
	}

	/// called up updates
	update_coords(): void {
		// var ppos = this.parent.getBounds()
		// var ppos = this.parent.getGlobalPosition(this.parent.position)
		var px = this.parent.x;
		var py = this.parent.y;
		var pw = this.parent.width; //this.parent.width;
		var ph = this.parent.height; // this.parent.height;

		// this.x = px + pw;
		this.x = Math.floor(px - pw*(1-this.parent.anchor.x));
		// this.y = py + ph;
		this.y = Math.floor(
			py + ph*(1-this.parent.anchor.y) +
			ProgressBar.Y_BUFFER*ph);
		this.width = Math.floor(pw);
		this.height = 29;
	}

	/// call before drawing to ensure you're not drawing off screen
	check_coords(): void {
		if (this.x < 0 || this.width < 0 || this.x + this.width > app.width ||
			this.y < 0 || this.height < 0 || this.y + this.height > app.height) {
			console.error('ProgressBar trying to render with bad dimensions.');
			console.error('x: ' + this.x + ', y: ' + this.y + ', w: ' + this.width + ', h: ' + this.height);
		}
	}

	draw_outline(): void {
		this.check_coords();

		this.outline.clear();
		this.outline.lineStyle(1, 0xffffff, 0.8);
		this.outline.moveTo(this.x, this.y);
		this.outline.lineTo(this.x, this.y+this.height);
		this.outline.lineTo(this.x+this.width, this.y+this.height);
		this.outline.lineTo(this.x+this.width, this.y);
		this.outline.lineTo(this.x, this.y);
		this.outline.endFill();
	}

	/// 0 <= portion <= 1
	fill_to(portion: number): void {
		this.check_coords();
		if (portion < 0 || portion > 1) {
			return;
		}

		this.fill.clear();
		this.fill.beginFill(Constants.LIGHT_BLUE, 0.8);
		this.fill.drawRect(this.x, this.y, (this.width)*portion, this.height);
		this.fill.endFill();
	}

	// clear(): void {
	// 	this.outline.clear()
	// 	this.fill.clear();
	// }

	set_goal(ms: number) {
		this.start = Date.now();
		this.goal = this.start + ms;
	}

	update() {
		this.update_coords();

		if (this.start != -1) {
			var cur = Date.now()
			if (cur > this.goal) {
				this.fill_to(1)
				// this.clear();
				this.start = -1;
				this.goal = -1;
			}  else {
				this.draw_outline();
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
	// console.log(sprite);
	if (sprite.bar.goal == -1) {
		console.log('goal was -1');
		sprite.bar.set_goal(1000);
		dbg('Mission initiated');
	}
	// console.log(app.stage);
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
	earth.anchor.x = 0.2;
	earth.anchor.y = 0.2;
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
	// app.stage.children.sort(depthCompare)

	// DEBUGGING
	// var b = new ProgressBar(10, 12, 20, 20);
	// b.build_appear();

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

	// 2: call render
	render();

	// 3: ask PIXI to call this again
	requestAnimationFrame(update);

	// post: tells stats done
	app.stats.end();
};

/// render is called by update
var render = function() {
	// sort children by z
	app.stage.children.sort(depthCompare)

	// render everything in stage
	app.renderer.render(app.stage);
};

// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------
setup();
