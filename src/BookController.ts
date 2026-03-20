import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZTimeline, ZContainer } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { MainMenu } from './MainMenu';
import { safeDestroyScene, unloadSceneImages } from './sceneUtils';

export class BookController {
    private stage: PIXI.Container;
    private onBack: () => void;

    // The Block scene — the persistent wooden-frame visual
    private blockScene: ZScene | null = null;
    private blockBGContainer: ZContainer | null = null;
    private textBoxContainer: ZContainer | null = null;

    // The currently-displayed page ZScene (NOT pushed to ZSceneStack — we manage
    // its scale/position manually so ZSceneStack.resize() doesn't fight us)
    private currentPageScene: ZScene | null = null;
    private currentPagePath: string | null = null;

    // Overlay: nav buttons drawn with PIXI primitives (no asset required)
    private overlay: PIXI.Container = new PIXI.Container();
    private captionText!: PIXI.Text;
    private prevBtn!: PIXI.Container;
    private nextBtn!: PIXI.Container;
    private soundBtn!: PIXI.Container;
    private menuBtn!: PIXI.Container;
    private pageIndicator!: PIXI.Text;

    private audio: HTMLAudioElement | null = null;
    private loading = false;

    constructor(stage: PIXI.Container, onBack: () => void) {
        this.stage = stage;
        this.onBack = onBack;
    }

    // ─── Load ────────────────────────────────────────────────────────────────

    async load(): Promise<void> {
        // 1. Load the Block frame scene — the persistent wooden border
        this.blockScene = new ZScene('blockFrame');
        await new Promise<void>(resolve => {
            this.blockScene!.load(`${GlobalData.assetsBasePath}Block/`, () => resolve());
        });
        ZSceneStack.push(this.blockScene);
        this.blockScene.loadStage(this.stage);

        // Grab blockBG and textBox containers for positioning
        this.blockBGContainer = this.blockScene.sceneStage.get('blockBG');
        this.textBoxContainer = this.blockScene.sceneStage.get('textBox');

        // 2. Build nav-button overlay (always on top)
        this._buildOverlay();

        // 3. Load first page
        await this._loadPage(GlobalData.counter);
    }

    // ─── Overlay ─────────────────────────────────────────────────────────────

    private _buildOverlay(): void {
        this.prevBtn = this._makeNavBtn('◀', () => this._prev());
        this.nextBtn = this._makeNavBtn('▶', () => this._next());

        this.soundBtn = MainMenu.makeTextButton('🔊', 0x1a3a5c, () => this._playSound(), 56, 40);
        this.menuBtn = MainMenu.makeTextButton(
            GlobalData.labels['mainMenu'] ?? 'Menu',
            0x3a1a0c,
            () => this._goBack(),
            90,
            40,
        );

        this.captionText = new PIXI.Text('', {
            fontSize: 18,
            fill: 0x222222,
            wordWrap: true,
            wordWrapWidth: 600,
            align: GlobalData.currentLang === 'heb' ? 'right' : 'left',
        });

        this.pageIndicator = new PIXI.Text('', { fontSize: 14, fill: 0x666666 });
        this.pageIndicator.anchor.set(0.5, 0);

        this.overlay.addChild(this.prevBtn);
        this.overlay.addChild(this.nextBtn);
        this.overlay.addChild(this.soundBtn);
        this.overlay.addChild(this.menuBtn);
        this.overlay.addChild(this.captionText);
        this.overlay.addChild(this.pageIndicator);

        this.stage.addChild(this.overlay);
        this._positionOverlay();
    }

    /** Re-position all overlay elements relative to blockBG's current screen bounds. */
    private _positionOverlay(): void {
        if (!this.blockBGContainer) return;

        const b = this.blockBGContainer.getBounds();
        if (b.width === 0) return;

        const bCY = b.y + b.height / 2;

        // ◀ to the left of blockBG
        this.prevBtn.x = Math.max(0, b.x - 80);
        this.prevBtn.y = bCY - 36;

        // ▶ to the right of blockBG
        this.nextBtn.x = b.x + b.width + 8;
        this.nextBtn.y = bCY - 36;

        // 🔊 top-left corner of blockBG
        this.soundBtn.x = b.x;
        this.soundBtn.y = b.y - 50;

        // Menu top-right corner
        this.menuBtn.x = b.x + b.width - 92;
        this.menuBtn.y = b.y - 50;

        // Caption — sits in the Block frame's text area, just below blockBG
        const isHeb = GlobalData.currentLang === 'heb';
        this.captionText.style.wordWrapWidth = b.width * 0.85;
        this.captionText.style.align = isHeb ? 'right' : 'left';
        this.captionText.x = isHeb ? b.x + b.width - 20 : b.x + 20;
        this.captionText.y = b.y + b.height + 8;

        // Page indicator centred below caption
        this.pageIndicator.x = b.x + b.width / 2;
        this.pageIndicator.y = b.y + b.height + 46;
    }

    private _makeNavBtn(label: string, onClick: () => void): PIXI.Container {
        const c = new PIXI.Container();
        const g = new PIXI.Graphics();
        g.beginFill(0x3a2000, 0.75);
        g.lineStyle(2, 0xf0c060, 0.9);
        g.drawCircle(36, 36, 34);
        g.endFill();
        const txt = new PIXI.Text(label, { fontSize: 26, fill: 0xf0c060 });
        txt.anchor.set(0.5);
        txt.x = 36;
        txt.y = 36;
        c.addChild(g);
        c.addChild(txt);
        c.interactive = true;
        c.cursor = 'pointer';
        c.on('pointerdown', onClick);
        return c;
    }

    // ─── Page loading ─────────────────────────────────────────────────────────

    private async _loadPage(index: number): Promise<void> {
        if (this.loading) return;
        this.loading = true;

        this._stopAudio();

        // Unload old page's image aliases from PIXI cache before destroying.
        // Image-based scenes register short aliases (e.g. "BodyMC1") with no
        // path prefix, so many pages collide in the cache.
        if (this.currentPageScene && this.currentPagePath) {
            await unloadSceneImages(this.currentPagePath);
            this.stage.removeChild(this.currentPageScene.sceneStage);
            safeDestroyScene(this.currentPageScene);
            this.currentPageScene = null;
            this.currentPagePath = null;
        }

        const slide = GlobalData.pages[index];
        if (!slide) {
            console.warn(`BookController: no slide at index ${index}`);
            this.loading = false;
            return;
        }

        const pagePath = GlobalData.getPagePath(slide.pageNum);
        const scene = new ZScene(`page_${slide.pageNum}`);

        await new Promise<void>(resolve => {
            scene.load(pagePath, () => resolve());
        });

        // Load to stage (this scales sceneStage to fill the window by default)
        scene.loadStage(this.stage);

        // Override: fit the page inside blockBG
        this._fitPageToBlock(scene);

        // Overlay must stay on top
        this.stage.setChildIndex(this.overlay, this.stage.children.length - 1);

        // Play all timeline animations within the page
        this._playTimelines(scene.sceneStage);

        this.currentPageScene = scene;
        this.currentPagePath = pagePath;

        // Set caption in Block's textBox (if it accepts text) AND in overlay
        this.textBoxContainer?.setText(slide.caption);
        this.captionText.text = slide.caption;
        this.pageIndicator.text = `${index + 1} / ${GlobalData.pages.length}`;
        this.prevBtn.visible = index > 0;

        this.loading = false;
        this._playSound();
    }

    /**
     * Scales and positions the page's sceneStage to fill blockBG exactly,
     * overriding the default window-filling scale set by loadStage().
     */
    private _fitPageToBlock(scene: ZScene): void {
        if (!this.blockBGContainer) return;
        const b = this.blockBGContainer.getBounds();
        if (!b || b.width === 0 || b.height === 0) return;

        const pageW = scene.sceneWidth;
        const pageH = scene.sceneHeight;
        const scale = Math.min(b.width / pageW, b.height / pageH);
        const stg = scene.sceneStage;
        stg.scale.set(scale);
        stg.x = b.x + (b.width - pageW * scale) / 2;
        stg.y = b.y + (b.height - pageH * scale) / 2;
    }

    private _playTimelines(container: PIXI.Container): void {
        for (const child of container.children) {
            if (child instanceof ZTimeline) {
                (child as ZTimeline).play();
            } else if (child instanceof PIXI.Container) {
                this._playTimelines(child);
            }
        }
    }

    // ─── Resize ──────────────────────────────────────────────────────────────

    /**
     * Called from app.ts AFTER ZSceneStack.resize() has already updated the
     * Block frame scene.  Re-fits the page and repositions buttons/caption.
     */
    resize(_W: number, _H: number): void {
        if (this.currentPageScene) {
            this._fitPageToBlock(this.currentPageScene);
        }
        this._positionOverlay();
    }

    // ─── Navigation ──────────────────────────────────────────────────────────

    private _prev(): void {
        if (this.loading || GlobalData.counter <= 0) return;
        GlobalData.counter--;
        this._loadPage(GlobalData.counter);
    }

    private _next(): void {
        if (this.loading) return;
        if (GlobalData.counter < GlobalData.pages.length - 1) {
            GlobalData.counter++;
            this._loadPage(GlobalData.counter);
        } else {
            this._goBack();
        }
    }

    private _goBack(): void {
        this._stopAudio();
        this.destroy();
        this.onBack();
    }

    // ─── Sound ───────────────────────────────────────────────────────────────

    private _playSound(): void {
        const slide = GlobalData.pages[GlobalData.counter];
        if (!slide?.sound) return;
        this._stopAudio();
        const url = GlobalData.getSoundUrl('assets/sounds/' + slide.sound);
        this.audio = new Audio(url);
        this.audio.play().catch(e => console.warn('Audio play error:', e));
    }

    private _stopAudio(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    destroy(): void {
        this._stopAudio();

        if (this.currentPageScene) {
            this.stage.removeChild(this.currentPageScene.sceneStage);
            safeDestroyScene(this.currentPageScene);
            this.currentPageScene = null;
            this.currentPagePath = null;
        }

        if (this.blockScene) {
            ZSceneStack.pop();
            this.stage.removeChild(this.blockScene.sceneStage);
            safeDestroyScene(this.blockScene);
            this.blockScene = null;
        }

        this.stage.removeChild(this.overlay);
    }
}

