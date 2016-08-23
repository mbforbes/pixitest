/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="../lib/stats.d.ts" />

// Constants in this class (needs not be instantiated)
// -----------------------------------------------------------------------------

class Constants {
	static LIGHT_BLUE = 0x4e929c;
	static POINT_ZERO = new PIXI.Point(0, 0);
	static GAME_WIDTH = 800;
	static GAME_HEIGHT = 600;
}

// Our own classes to add functionality
// -----------------------------------------------------------------------------

// GameObject is the base contract that game objects must fulfill.
interface GameObject extends PIXI.DisplayObject {
	// We want to be able to sort our objects by a z index for display order.
	z: number;

	// Never call update() directly. Only implement it. It's the updater's job
	// to call update().
	update(): void;
}

// Our own base classes that implement the base object. The redundancy (setting
// all of the base properties each time) is annoying but finite---there are only
// a few core pixi classes. All actual classes that we make will subclass from
// these few and will *only* describe unique behavior. (Another thought: maybe
// this is silly? Perhaps we should only have the subclasses themselves, or make
// these abstract. It seems silly to require everything to have z and update()
// but then just give them dummy values---seems like we might want to have to
// think about what these should be for each object.)

// Base class for on screen objects with multiple visible components.
class MaxDisplayObject extends PIXI.DisplayObject implements GameObject {
	z = 0;
	update(): void {};
}

// Base class for on screen line-art.
class MaxGraphics extends PIXI.Graphics implements GameObject {
	z = 0;
	update(): void {};
};

// Base class for on screen text.
class MaxText extends PIXI.Text implements GameObject {
	z = 0;
	update(): void {};
};

// Base class for on screen sprites.
class MaxSprite extends PIXI.Sprite implements GameObject {
	z = 0;
	update(): void {};
}

// Actual "meat" classes with specific behavior are below.

/// this isn't a game object and doesn't extend a pixi object because we want
/// to treat it carefully to ensure we have the right behavior.
class MaxStage extends PIXI.Container {
	children: GameObject[]

	update(): void {
		for (var child of this.children) {
			child.update();
		}
	}
}

class Planet extends MaxSprite {
	bar: ProgressBar;

	constructor(texture: PIXI.Texture) {
		super(texture);
		this.bar = new ProgressBar(this);
	}

	click(event: PIXI.interaction.InteractionEvent): void {
		if (this.bar.goal == -1) {
			this.bar.set_goal(1000);
			App.instance.dbg('Mission initiated');
		}
	}

	update(): void {
		this.rotation += 0.001;
	}
}


class ProgressBar extends MaxDisplayObject {
	// static settings
	// pixels to move below parent's lower edge
	static Y_BUFFER = 10;

	// instance members
	start: number = -1;
	goal: number = -1;
	height: number = -1;
	width: number = -1;
	outline: MaxGraphics = new MaxGraphics();
	fill: MaxGraphics = new MaxGraphics();

	constructor(public master: MaxSprite) {
		super();
		var app = App.instance;
		this.renderable = false;
		this.interactiveChildren = false;
		app.stage.addChild(this);
		app.stage.addChild(this.outline);
		app.stage.addChild(this.fill);
		this.fill.z = master.z + 1;
		this.outline.z = master.z + 2;
		// master.addChild(this);
	}

	/// called up updates
	update_coords(): void {
		var mb = this.master.getBounds()

		// master's "true" radius (assumes vertically symmetric)
		var m_hrad = this.master.height/2;
		var m_wrad = this.master.width/2;
		var m_cx = mb.x + mb.width/2;
		var m_cy = mb.y + mb.height/2;

		this.x = m_cx - m_wrad;
		this.y = m_cy + m_hrad + ProgressBar.Y_BUFFER;
		this.width = this.master.width;
		this.height = 29;
	}

	/// call before drawing to ensure you're not drawing off screen
	check_coords(): void {
		if (this.x < 0 || this.width < 0 || this.x + this.width > Constants.GAME_WIDTH ||
			this.y < 0 || this.height < 0 || this.y + this.height > Constants.GAME_HEIGHT) {
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

		this.clear();

		this.draw_outline();

		this.fill.beginFill(Constants.LIGHT_BLUE, 0.8);
		this.fill.drawRect(this.x, this.y, (this.width)*portion, this.height);
		this.fill.endFill();
	}

	clear(): void {
		this.outline.clear()
		this.fill.clear();
	}

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
				this.clear();
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
// interface DisplayAndGameObject extends PIXI.DisplayObject, GameObject {}
function depthCompare(a: GameObject, b: GameObject) {
	if (a.z < b.z) {
		return -1;
	} if (a.z > b.z) {
		return 1;
	}
	return 0;
}

class App {
	static instance: App;

	renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer = PIXI.autoDetectRenderer(
			this.width, this.height, {backgroundColor : 0x050505});;
	stage: MaxStage = new MaxStage();      // camera
	overlay: MaxStage = new MaxStage();    // HUD
	debugText: MaxText;
	stats: Stats = new Stats();
	width: number = Constants.GAME_WIDTH;
	height: number = Constants.GAME_HEIGHT;

	constructor() {
		// make this statically accessible
		App.instance = this;

		// CORE SETUP
		// -------------------------------------------------------------------------
		// pre: some us crap
		// this.width = Constants.GAME_WIDTH;
		// this.height = Constants.GAME_HEIGHT;

		// core: renderer
		// this.renderer =
		document.body.appendChild(this.renderer.view);

		// core: stage
		// this.stage = new MaxStage();

		// US SETUP
		// -------------------------------------------------------------------------

		// statistics collection
		// this.stats = new Stats();
		// setup stats
		document.body.appendChild(this.stats.dom);
		this.stats.dom.style.position = "relative"
		this.stats.dom.style.top = "-40px";

		// POPULATE WITH OBJECTS
		// -------------------------------------------------------------------------
		// helper: grid!
		this.drawGrid();
		this.make_demo_objects();


		// KICK OFF THE GAME
		// -------------------------------------------------------------------------
		// this.update();
	}


	/// update is the main game loop. It:
	/// - 1: runs update logic
	/// - 2: calls render
	/// - 3: asks PIXI to call it again
	update(): void {
		// pre: start stats tracking
		this.stats.begin();

		// 1: run game logic
		this.stage.update();

		// 2: call render
		this.render();

		// 3: ask PIXI to call this again
		requestAnimationFrame(update);

		// post: tells stats done
		this.stats.end();
	}

	/// render is called by update
	render(): void {
		// sort children by z. NOTE: in the future, could just (a) add children at
		// the correct depth value and never have to sort or (b) sort only when
		// children are added instead of every frame.
		this.stage.children.sort(depthCompare)

		// render everything in stage
		this.renderer.render(this.stage);
	}

	drawGrid(): void {
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

		for (var x = 0; x < this.width; x += xstep) {
			if (x > 0) {
				g.drawRect(x, 0, 1, this.height);
			}

			// var t = new PIXI.Text(x.toString(), { font: '10px', fill: textc, align: 'left' });
			var xt = new MaxText(x.toString(), { font: '10px', fill: textc, align: 'left' });
			xt.x = x + 5;
			xt.y = 5;
			xt.z = zidx;
			this.stage.addChild(xt)
		}
		for (var y = ystep; y < this.height; y += ystep) {
			g.drawRect(0, y, this.width, 1);

			// var yt = new PIXI.Text(y.toString(), { font: '10px', fill: textc, align: 'left' });
			var yt = new MaxText(y.toString(), { font: '10px', fill: textc, align: 'left' });
			yt.x = 5;
			yt.y = y + 5;
			yt.z = zidx;
			this.stage.addChild(yt)
		}

		g.endFill();
		this.stage.addChild(g)
	}

	make_demo_objects(): void {
		// game objects: add our earth
		var earth_texture = PIXI.Texture.fromImage('assets/earth.png');
		var earth = new Planet(earth_texture);
		earth.anchor.x = 0.2;
		earth.anchor.y = 0.2;
		earth.x = 400;
		earth.y = 300;
		earth.z = 0;
		earth.interactive = true;
		earth.interactiveChildren = false;
		earth.on('mousedown', earth.click, earth);
		// track it in our own object and add it to the stage. (Maybe we should have
		// some kind of factory or class that tracks this for us...)
		this.stage.addChild(earth);

		this.debugText = new MaxText('', {
			font: '10px',
			fill: '#' + Constants.LIGHT_BLUE.toString(16),
			align: 'center'
		});
		this.debugText.x = 600;
		this.debugText.y = 20;
		this.debugText.z = 1;
		this.stage.addChild(this.debugText)
	}

	dbg(text: string): void {
		this.debugText.text += text + '\n';
	}

	make_edge_rects(): void {
	}

}


// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------

var app = new App();
var update = function() {
	App.instance.update();
}
update();
