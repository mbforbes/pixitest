/// <reference path="../lib/pixi.js.d.ts" />
// Global on-frame renderer function
function update() {
    renderer.render(stage);
    requestAnimationFrame(update);
}
// Here, we initialize the pixi stage
// create an new instance of a pixi container
var stage = new PIXI.Container();
// create a renderer instance
var renderer = PIXI.autoDetectRenderer(800, 600, { backgroundColor: 0x6BACDE });
// add the renderer view element to the DOM
document.body.appendChild(renderer.view);
update();
// Here, we create our traviso instance and add on top of pixi
// engine-instance configuration object
var instanceConfig = {
    mapDataPath: "assets/mapData.xml",
    assetsToLoad: ["../assets/assets_map.json", "../assets/assets_characters.json"] // array of paths to the assets that are desired to be loaded by traviso, no need to use if assets are already loaded to PIXI cache, default null
};
var engine = TRAVISO.getEngineInstance(instanceConfig);
stage.addChild(engine);
