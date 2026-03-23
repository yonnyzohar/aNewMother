import * as PIXI from 'pixi.js';

const BAR_W = 200;
const BAR_H = 4;

/**
 * Minimal centered loading bar. Add to stage before loading, call update()
 * with progress 0–1, then call remove() when done.
 */
export class LoadingBar {
    private container: PIXI.Container;
    private fill: PIXI.Graphics;
    private stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
        this.container = new PIXI.Container();

        const track = new PIXI.Graphics();
        track.beginFill(0xffffff, 0.2);
        track.drawRoundedRect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H, BAR_H / 2);
        track.endFill();

        this.fill = new PIXI.Graphics();

        this.container.addChild(track, this.fill);
        this.container.x = window.innerWidth / 2;
        this.container.y = window.innerHeight / 2;

        this.stage.addChild(this.container);
        this._draw(0);
    }

    update(progress: number): void {
        this._draw(Math.min(1, Math.max(0, progress)));
    }

    remove(): void {
        this.stage.removeChild(this.container);
        this.container.destroy({ children: true });
    }

    private _draw(p: number): void {
        const w = Math.max(BAR_H, BAR_W * p);
        this.fill.clear();
        this.fill.beginFill(0xffffff, 0.9);
        this.fill.drawRoundedRect(-BAR_W / 2, -BAR_H / 2, w, BAR_H, BAR_H / 2);
        this.fill.endFill();
    }
}
