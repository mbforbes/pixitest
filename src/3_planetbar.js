/// <reference path="../lib/pixi.js.d.ts" />
var app = {};
// TEMP CRAP BECAUSE I DON'T UNDERSTAND TYPESCRIPT YET
// -----------------------------------------------------------------------------
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
function earthClick(event) {
    console.log(event.target);
    dbg('Mission initiated');
    drawProgressOutline();
}
function drawProgressOutline() {
    var g = new PIXI.Graphics();
    g.z = 2;
    var earth = app.sprites['earth'];
    var lx = Math.floor(earth.x - earth.width * (1 - earth.anchor.x));
    var ly = Math.floor(earth.y + earth.height * (1 - earth.anchor.y));
    var lw = Math.floor(earth.width);
    var lh = 29;
    console.log(lx);
    console.log(ly);
    console.log(lw);
    console.log(lh);
    // g.beginFill(0x7decfd, 0.0);
    g.lineStyle(1, 0xffffff, 0.8);
    // g.lineColor = 0xffffff;
    // g.lineWidth = 1;
    g.moveTo(lx, ly);
    g.lineTo(lx, ly + lh);
    g.lineTo(lx + lw, ly + lh);
    g.lineTo(lx + lw, ly);
    g.lineTo(lx, ly);
    g.endFill();
    app.stage.addChild(g);
}
function drawGrid() {
    // settings
    var xstep = 100;
    var ystep = 100;
    var zidx = 100; // just something high to be on top of everything else
    var textc = '#aaaaaa';
    // make stuff
    var g = new PIXI.Graphics();
    g.z = zidx;
    // var ts: PIXI.Text[] = [];
    g.beginFill(0xffffff, 0.2);
    for (var x = 0; x < app.width; x += xstep) {
        if (x > 0) {
            g.drawRect(x, 0, 1, app.height);
        }
        var t = new PIXI.Text(x.toString(), { font: '10px', fill: textc, align: 'left' });
        t.x = x + 5;
        t.y = 5;
        t.z = zidx;
        app.stage.addChild(t);
    }
    for (var y = ystep; y < app.height; y += ystep) {
        g.drawRect(0, y, app.width, 1);
        var t = new PIXI.Text(y.toString(), { font: '10px', fill: textc, align: 'left' });
        t.x = 5;
        t.y = y + 5;
        t.z = zidx;
        app.stage.addChild(t);
    }
    g.endFill();
    app.stage.addChild(g);
    // for (var txt in ts) {
    // 	app.stage.addChild(txt);
    // }
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
    app.stage = new PIXI.Container();
    // US SETUP
    // -------------------------------------------------------------------------
    app.sprites = {};
    app.children = [];
    // statistics collection
    app.stats = new Stats();
    document.body.appendChild(app.stats.domElement);
    app.stats.dom.style.position = "relative";
    app.stats.dom.style.top = "-40px";
    // TODO(mbforbes): Make some kind of debug text holder thing here.
    // POPULATE WITH OBJECTS
    // -------------------------------------------------------------------------
    // helper: grid!
    drawGrid();
    // game objects: add our earth
    var earth_texture = PIXI.Texture.fromImage('assets/earth.png');
    var earth = new PIXI.Sprite(earth_texture);
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
    // TODO(mbforbes): Z ordering currently messed up: want to have text on top!
    app.debugText = new PIXI.Text('', { font: '10px', fill: '#4e929c', align: 'center' });
    app.debugText.x = 600;
    app.debugText.y = 20;
    app.debugText.z = 1;
    app.stage.addChild(app.debugText);
    // sort z order
    app.stage.children.sort(depthCompare);
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
    app.sprites['earth'].rotation += 0.001;
    // 2: call render
    render();
    // 3: ask PIXI to call this again
    requestAnimationFrame(update);
    // post: tells stats done
    app.stats.end();
};
/// render is called by update
var render = function () {
    app.renderer.render(app.stage);
};
// EXECUTION BEGINS HERE
// -----------------------------------------------------------------------------
setup();
