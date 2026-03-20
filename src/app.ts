import * as PIXI from 'pixi.js';
import { Game } from "./Game";
import { ZSceneStack } from 'zimporter-pixi';
import { ZUpdatables } from 'zimporter-pixi';
//npx webpack
const app = new PIXI.Application({

  backgroundColor: 0x000000,
  resolution: window.devicePixelRatio || 1, // Handle high-DPI screens
  autoDensity: true, // Improve sharpness on high-DPI screens
  antialias: true // Smooth rendering
});

function resizeCanvas() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
  ZSceneStack.resize(window.innerWidth, window.innerHeight);
  game.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", () => {
  resizeCanvas();
});

(globalThis as any).__PIXI_APP__ = app;

var game = new Game(app.stage, resizeCanvas);


// Append the app's view to the DOM
document.body.appendChild(app.view as any);
ZUpdatables.init(24);

const fpsText = new PIXI.Text('FPS: 0', { fontSize: 24, fill: 'white' });
fpsText.position.set(10, 10);
app.stage.addChild(fpsText);

// Update FPS every frame
let lastTime = performance.now();
let frameCount = 0;

app.ticker.add(
  () => {

    frameCount++;
    const now = performance.now();
    const delta = now - lastTime;

    if (delta >= 1000) { // Update every second
      const fps = (frameCount / delta) * 1000;
      fpsText.text = `FPS: ${fps.toFixed(1)}`;
      frameCount = 0;
      lastTime = now;
      fpsText.parent?.addChild(fpsText); // Ensure the FPS text is always on top
    }

    const ticker = PIXI.Ticker.shared;
    var deltaMS = ticker.deltaMS / 1000;
    game.update(deltaMS);
    ZUpdatables.update();
  }
);

