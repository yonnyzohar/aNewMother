import * as PIXI from 'pixi.js';

/**
 * A centered spinning-arc preloader with a full-screen semi-transparent
 * overlay that blocks all pointer events (disabling buttons behind it).
 *
 * Usage:
 *   const p = new Preloader(stage);
 *   p.show();           // add to stage on top, start spinning
 *   await something();
 *   p.hide();           // remove from stage, stop spinning
 */
export class Preloader {
    private container: PIXI.Container;
    private spinner: PIXI.Graphics;
    private stage: PIXI.Container;
    private angle = 0;
    private tickerFn: (() => void) | null = null;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
        this.container = new PIXI.Container();

        // Full-screen overlay — blocks ALL pointer events while visible.
        const W = window.innerWidth;
        const H = window.innerHeight;
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.45);
        overlay.drawRect(0, 0, W, H);
        overlay.endFill();
        (overlay as any).eventMode = 'static'; // captures / swallows all clicks
        this.container.addChild(overlay);

        // Spinner arc drawn each tick.
        this.spinner = new PIXI.Graphics();
        this.container.addChild(this.spinner);
    }

    /** Add the overlay+spinner to the stage (always as the top-most element). */
    show(): void {
        // addChild re-pins to top if already a child of stage.
        this.stage.addChild(this.container);

        if (!this.tickerFn) {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            this._draw(cx, cy); // draw immediately so it's visible before first tick
            this.tickerFn = () => {
                this.angle += 0.07;
                this._draw(cx, cy);
            };
            PIXI.Ticker.shared.add(this.tickerFn);
        }
    }

    /** Remove the overlay+spinner from the stage and stop the animation. */
    hide(): void {
        if (this.tickerFn) {
            PIXI.Ticker.shared.remove(this.tickerFn);
            this.tickerFn = null;
        }
        this.container.parent?.removeChild(this.container);
    }

    private _draw(cx: number, cy: number): void {
        const r = 38;
        const g = this.spinner;
        g.clear();

        // Dim full ring as the "track".
        g.lineStyle(7, 0xffffff, 0.2);
        g.drawCircle(cx, cy, r);

        // Bright spinning arc (≈ 250° of the circle).
        g.lineStyle(7, 0xffffff, 1);
        g.arc(cx, cy, r, this.angle, this.angle + Math.PI * 1.4);
    }
}
