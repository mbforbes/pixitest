/// <reference path="../lib/pixi.js.d.ts" />
/// <reference path="../lib/stats.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// Constants in this class (needs not be instantiated)
// -----------------------------------------------------------------------------
var Constants = (function () {
    function Constants() {
    }
    Constants.LIGHT_BLUE = 0x4e929c;
    Constants.POINT_ZERO = new PIXI.Point(0, 0);
    return Constants;
}());
var app = {};
// Our own base classes that implement the base object. The redundancy (setting
// all of the base properties each time) is annoying but finite---there are only
// a few core pixi classes. All actual classes that we make will subclass from
// these few and will *only* describe unique behavior. (Another thought: maybe
// this is silly? Perhaps we should only have the subclasses themselves, or make
// these abstract. It seems silly to require everything to have z and update()
// but then just give them dummy values---seems like we might want to have to
// think about what these should be for each object.)
// Base class for on screen objects with multiple visible components.
var MaxDisplayObject = (function (_super) {
    __extends(MaxDisplayObject, _super);
    function MaxDisplayObject() {
        _super.apply(this, arguments);
        this.z = 0;
    }
    MaxDisplayObject.prototype.update = function () { };
    ;
    return MaxDisplayObject;
}(PIXI.DisplayObject));
// Base class for on screen line-art.
var MaxGraphics = (function (_super) {
    __extends(MaxGraphics, _super);
    function MaxGraphics() {
        _super.apply(this, arguments);
        this.z = 0;
    }
    MaxGraphics.prototype.update = function () { };
    ;
    return MaxGraphics;
}(PIXI.Graphics));
;
// Base class for on screen text.
var MaxText = (function (_super) {
    __extends(MaxText, _super);
    function MaxText() {
        _super.apply(this, arguments);
        this.z = 0;
    }
    MaxText.prototype.update = function () { };
    ;
    return MaxText;
}(PIXI.Text));
;
// Base class for on screen sprites.
var MaxSprite = (function (_super) {
    __extends(MaxSprite, _super);
    function MaxSprite() {
        _super.apply(this, arguments);
        this.z = 0;
    }
    MaxSprite.prototype.update = function () { };
    ;
    return MaxSprite;
}(PIXI.Sprite));
// Actual "meat" classes with specific behavior are below.
/// this isn't a game object and doesn't extend a pixi object because we want
/// to treat it carefully to ensure we have the right behavior.
var MaxStage = (function (_super) {
    __extends(MaxStage, _super);
    function MaxStage() {
        _super.apply(this, arguments);
    }
    MaxStage.prototype.update = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.update();
        }
    };
    return MaxStage;
}(PIXI.Container));
var Planet = (function (_super) {
    __extends(Planet, _super);
    function Planet(texture) {
        _super.call(this, texture);
        this.bar = new ProgressBar(this);
    }
    Planet.prototype.click = function (event) {
        if (this.bar.goal == -1) {
            this.bar.set_goal(1000);
            dbg('Mission initiated');
        }
    };
    Planet.prototype.update = function () {
        this.rotation += 0.01;
    };
    return Planet;
}(MaxSprite));
var ProgressBar = (function (_super) {
    __extends(ProgressBar, _super);
    function ProgressBar(master) {
        _super.call(this);
        this.master = master;
        // instance members
        this.start = -1;
        this.goal = -1;
        this.height = -1;
        this.width = -1;
        this.outline = new MaxGraphics();
        this.fill = new MaxGraphics();
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
    ProgressBar.prototype.update_coords = function () {
        var mb = this.master.getBounds();
        // var ppos = this.master.getGlobalPosition(this.master.position)
        // TODO(mbforbes): Curspot.
        // master's "true" radius (assumes vertically symmetric)
        var m_hrad = this.master.height / 2;
        var m_wrad = this.master.width / 2;
        var m_cx = mb.x + mb.width / 2;
        var m_cy = mb.y + mb.height / 2;
        this.x = m_cx - m_wrad;
        this.y = m_cy + m_hrad + ProgressBar.Y_BUFFER;
        this.width = this.master.width;
        this.height = 29;
        // var px = this.master.x;
        // var py = this.master.y;
        // var pw = this.master.width; //this.master.width;
        // var ph = this.master.height; // this.master.height;
        // // this.x = px + pw;
        // this.x = Math.floor(px - pw*(1-this.master.anchor.x));
        // // this.y = py + ph;
        // this.y = Math.floor(
        // 	py + ph*(1-this.master.anchor.y) +
        // 	ProgressBar.Y_BUFFER*ph);
        // this.width = Math.floor(pw);
        // this.height = 29;
    };
    /// call before drawing to ensure you're not drawing off screen
    ProgressBar.prototype.check_coords = function () {
        if (this.x < 0 || this.width < 0 || this.x + this.width > app.width ||
            this.y < 0 || this.height < 0 || this.y + this.height > app.height) {
            console.error('ProgressBar trying to render with bad dimensions.');
            console.error('x: ' + this.x + ', y: ' + this.y + ', w: ' + this.width + ', h: ' + this.height);
        }
    };
    ProgressBar.prototype.draw_outline = function () {
        this.check_coords();
        this.outline.clear();
        this.outline.lineStyle(1, 0xffffff, 0.8);
        this.outline.moveTo(this.x, this.y);
        this.outline.lineTo(this.x, this.y + this.height);
        this.outline.lineTo(this.x + this.width, this.y + this.height);
        this.outline.lineTo(this.x + this.width, this.y);
        this.outline.lineTo(this.x, this.y);
        this.outline.endFill();
    };
    /// 0 <= portion <= 1
    ProgressBar.prototype.fill_to = function (portion) {
        this.check_coords();
        if (portion < 0 || portion > 1) {
            return;
        }
        this.clear();
        this.draw_outline();
        this.fill.beginFill(Constants.LIGHT_BLUE, 0.8);
        this.fill.drawRect(this.x, this.y, (this.width) * portion, this.height);
        this.fill.endFill();
    };
    ProgressBar.prototype.clear = function () {
        this.outline.clear();
        this.fill.clear();
    };
    ProgressBar.prototype.set_goal = function (ms) {
        this.start = Date.now();
        this.goal = this.start + ms;
    };
    ProgressBar.prototype.update = function () {
        this.update_coords();
        if (this.start != -1) {
            var cur = Date.now();
            if (cur > this.goal) {
                this.fill_to(1);
            }
            else {
                var portion = (cur - this.start) / (this.goal - this.start);
                this.fill_to(portion);
            }
        }
    };
    // static settings
    // pixels to move below parent's lower edge
    ProgressBar.Y_BUFFER = 10;
    return ProgressBar;
}(MaxDisplayObject));
// We only care about GameObjects, but pixi expects something that can work with
// DisplayObjects when sorting container elements, so we have to satisfy it.
// interface DisplayAndGameObject extends PIXI.DisplayObject, GameObject {}
function depthCompare(a, b) {
    if (a.z < b.z) {
        return -1;
    }
    if (a.z > b.z) {
        return 1;
    }
    return 0;
}
function dbg(text) {
    app.debugText.text += text + '\n';
}
function drawGrid() {
    // settings
    var xstep = 100;
    var ystep = 100;
    var zidx = 100; // just something high to be on top of everything else
    var textc = '#aaaaaa';
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
        app.stage.addChild(xt);
    }
    for (var y = ystep; y < app.height; y += ystep) {
        g.drawRect(0, y, app.width, 1);
        // var yt = new PIXI.Text(y.toString(), { font: '10px', fill: textc, align: 'left' });
        var yt = new MaxText(y.toString(), { font: '10px', fill: textc, align: 'left' });
        yt.x = 5;
        yt.y = y + 5;
        yt.z = zidx;
        app.stage.addChild(yt);
    }
    g.endFill();
    app.stage.addChild(g);
}
// GLOBAL FUNCTIONS: setup, update, render
// -----------------------------------------------------------------------------
/// setup calls update when it completes
var setup = function () {
    // CORE SETUP
    // -------------------------------------------------------------------------
    // pre: some us crap
    app.width = 800;
    app.height = 600;
    // core: renderer
    app.renderer = PIXI.autoDetectRenderer(app.width, app.height, { backgroundColor: 0x050505 });
    document.body.appendChild(app.renderer.view);
    // core: stage
    app.stage = new MaxStage();
    // US SETUP
    // -------------------------------------------------------------------------
    // statistics collection
    app.stats = new Stats();
    document.body.appendChild(app.stats.dom);
    app.stats.dom.style.position = "relative";
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
    earth.interactiveChildren = false;
    earth.on('mousedown', earth.click, earth);
    // track it in our own object and add it to the stage. (Maybe we should have
    // some kind of factory or class that tracks this for us...)
    app.stage.addChild(earth);
    app.debugText = new MaxText('', {
        font: '10px',
        fill: '#' + Constants.LIGHT_BLUE.toString(16),
        align: 'center'
    });
    app.debugText.x = 600;
    app.debugText.y = 20;
    app.debugText.z = 1;
    app.stage.addChild(app.debugText);
    // KICK OFF THE GAME
    // -------------------------------------------------------------------------
    update();
};
/// update is the main game loop. It:
/// - 1: runs update logic
/// - 2: calls render
/// - 3: asks PIXI to call it again
var update = function () {
    // pre: start stats tracking
    app.stats.begin();
    // 1: run game logic
    app.stage.update();
    // 2: call render
    render();
    // 3: ask PIXI to call this again
    requestAnimationFrame(update);
    // post: tells stats done
    app.stats.end();
};
/// render is called by update
var render = function () {
    // sort children by z. NOTE: in the future, could just (a) add children at
    // the correct depth value and never have to sort or (b) sort only when
    // children are added instead of every frame.
    app.stage.children.sort(depthCompare);
    // render everything in stage
    app.renderer.render(app.stage);
};
// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------
setup();
