import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZTimeline, ZContainer, ZButton } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { MainMenu } from './MainMenu';
import { safeDestroyScene, unloadSceneImages } from './sceneUtils';
import { SlideObj } from './SlideObj';

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
    private prevBtn!: ZButton;
    private nextBtn!: ZButton;
    private soundBtn!: PIXI.Container;
    private menuBtn!: PIXI.Container;
    private pageIndicator!: ZContainer;

    private blockWidth = 918;
    private blockHeight = 548;
    private twister:ZContainer;

    private audio: HTMLAudioElement | null = null;
    private voiceAudio: HTMLAudioElement | null = null;
    private loading = false;
    private pageMask: PIXI.Graphics | null = null;

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
        if (this.blockBGContainer) this.blockBGContainer.eventMode = 'passive';
        this.textBoxContainer = this.blockScene.sceneStage.get('textBox');
        this.twister = this.blockScene.sceneStage.get("twister") as ZContainer;

        // filmSides is a decorative overlay that sits on top of everything —
        // disable its hit-testing so it never blocks clicks on the pages below.
        const filmSides = this.blockScene.sceneStage.get('filmSides');
        if (filmSides) filmSides.eventMode = 'none';

        // blockContainer sits between sceneStage and blockBG — must be passive
        // so events can propagate all the way in to the page children.
        const blockContainer = this.blockScene.sceneStage.get('blockContainer');
        if (blockContainer) blockContainer.eventMode = 'passive';

        // Ensure the block scene's own sceneStage passes events through.
        this.blockScene.sceneStage.eventMode = 'passive';
        

        // 2. Build nav-button overlay (always on top)
        this._buildOverlay();

        // 3. Load first page
        await this._loadPage(GlobalData.counter);
    }

    // ─── Overlay ─────────────────────────────────────────────────────────────

    private _buildOverlay(): void {
        this.prevBtn = this.blockScene!.sceneStage.get('backBTN') as ZButton;
        this.prevBtn.setCallback(() => this._prev());
        this.nextBtn = this.blockScene!.sceneStage.get('forewardBTN') as ZButton;
        this.nextBtn.setCallback(() => this._next());

        this.soundBtn = MainMenu.makeTextButton('🔊', 0x1a3a5c, () => this._playSound(), 56, 40);
        this.menuBtn = MainMenu.makeTextButton(
            GlobalData.labels['mainMenu'] ?? 'Menu',
            0x3a1a0c,
            () => this._goBack(),
            90,
            40,
        );
        this.pageIndicator = this.blockScene!.sceneStage.get('pageNum') as ZContainer;

        this.overlay.addChild(this.soundBtn);
        this.overlay.addChild(this.menuBtn);

        this.stage.addChild(this.overlay);
        this._positionOverlay();
    }

    /** Re-position all overlay elements relative to blockBG's current screen bounds. */
    private _positionOverlay(): void {
        if (!this.blockBGContainer) return;

        if (this.stage.parent) this.stage.updateTransform();

        // 🔊 top-left corner of blockBG
        this.soundBtn.x = this.blockBGContainer.x;
        this.soundBtn.y = this.blockBGContainer.y - 50;

        // Menu top-right corner
        this.menuBtn.x = this.blockBGContainer.x + this.blockWidth - 92;
        this.menuBtn.y = this.blockBGContainer.y - 50;

        // Caption — sits in the Block frame's text area, just below blockBG
    }

    // ─── Page loading ─────────────────────────────────────────────────────────

    private async _loadPage(index: number): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        this.twister.setVisible(true);
        this._stopAudio();

        // Unload old page's image aliases from PIXI cache before destroying.
        // Image-based scenes register short aliases (e.g. "BodyMC1") with no
        // path prefix, so many pages collide in the cache.
        if (this.currentPageScene && this.currentPagePath) {
            await unloadSceneImages(this.currentPagePath);
            this.blockBGContainer?.removeChild(this.currentPageScene.sceneStage);
            safeDestroyScene(this.currentPageScene);
            this.currentPageScene = null;
            this.currentPagePath = null;
        }
        if (this.pageMask) {
            this.blockBGContainer?.removeChild(this.pageMask);
            this.pageMask.destroy();
            this.pageMask = null;
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
        
        // Load to stage first (ZScene requires this to initialise), then
        // reparent into blockBGContainer so it inherits the frame's transform.
        scene.loadStage(this.stage);
        
        let w = Math.max( scene.sceneWidth, scene.sceneHeight);
        let h = Math.min( scene.sceneWidth, scene.sceneHeight);

        let newScaleX = this.blockWidth / w;
        let newScaleY = this.blockHeight / h;
        
        scene.sceneStage.scale.set(newScaleX, newScaleY);
        //console.log("w",w,"h",h,"this.blockWidth",this.blockWidth,"this.blockHeight",this.blockHeight,"newScaleX",newScaleX,"newScaleY",newScaleY);
        scene.sceneStage.x = 0;
        scene.sceneStage.y = 0;


        this.blockBGContainer?.addChild(scene.sceneStage);
        let innerMSK = this.blockBGContainer?.getChildByName("innerMSK") as PIXI.Container;
        if (innerMSK && this.blockBGContainer) {
            // Use a PIXI.Graphics rect instead of the ZContainer directly —
            // PIXI v7 calls containsPoint() on the mask during hit-testing, and
            // ZContainer.containsPoint() is unreliable on Flash exports, killing clicks.
            const lb = innerMSK.getLocalBounds();
            const gfxMask = new PIXI.Graphics();
            gfxMask.beginFill(0xffffff);
            gfxMask.drawRect(innerMSK.x + lb.x, innerMSK.y + lb.y, lb.width, lb.height);
            gfxMask.endFill();
            this.blockBGContainer.addChild(gfxMask);
            scene.sceneStage.mask = gfxMask;
            this.pageMask = gfxMask;
        }

        // Fit the page to fill blockBGContainer's local coordinate space
        this._fitPageToBlock(scene);
        this._positionOverlay();

        // Overlay must stay on top
        this.stage.setChildIndex(this.overlay, this.stage.children.length - 1);

        // Play all timeline animations within the page
        this._playTimelines(scene.sceneStage);

        this.currentPageScene = scene;
        this.currentPagePath = pagePath;

        // Wire up per-character voice tap handlers
        this._attachVoiceHandlers(scene, slide);

        // Set caption in Block's textBox (if it accepts text) AND in overlay
        this.textBoxContainer?.setText(slide.caption);
        this.pageIndicator.setText(`${index + 1} / ${GlobalData.pages.length}`);
        this.prevBtn.visible = index > 0;

        this.loading = false;
        this._playSound();
        this.twister.setVisible(false);
    }

    /**
     * Scales and positions the page's sceneStage to fill blockBG exactly,
     * overriding the default window-filling scale set by loadStage().
     */
    private _fitPageToBlock(scene: ZScene): void {
        /*
        if (!this.blockBGContainer) return;

        // Use local bounds — the parent transform handles screen placement.
        const lb = this.blockBGContainer.getLocalBounds();
        if (!lb || lb.width === 0 || lb.height === 0) return;

        const pageW = scene.sceneWidth;
        const pageH = scene.sceneHeight;
        const scale = Math.max(lb.width / pageW, lb.height / pageH);
        const stg = scene.sceneStage;
        stg.scale.set(scale);
        stg.x = lb.x + (lb.width - pageW * scale) / 2;
        stg.y = lb.y + (lb.height - pageH * scale) / 2;
        */
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

    // ─── Voice handlers ───────────────────────────────────────────────────────

    private _attachVoiceHandlers(scene: ZScene, slide: SlideObj): void {
        if (Object.keys(slide.voices).length === 0) return;

        const sceneStage = scene.sceneStage;

        // Walk every ancestor up to root and ensure none block events.
        let node = sceneStage.parent as PIXI.Container | null;
        while (node && node !== this.stage) {
            (node as unknown as { eventMode: string }).eventMode = 'passive';
            node = node.parent as PIXI.Container | null;
        }

        // Give sceneStage a broad hitArea covering the full design space so
        // PIXI always considers it hittable, regardless of child offsets.
        sceneStage.hitArea = new PIXI.Rectangle(
            0, 0, scene.sceneWidth, scene.sceneHeight
        );
        sceneStage.eventMode = 'static';

        // ONE listener on sceneStage — resolve the clicked MC via screen-space
        // bounds check, bypassing per-MC containsPoint() issues entirely.
        
            for (const [mcName, voicePath] of Object.entries(slide.voices)) {
                const mc = sceneStage.get(mcName);
                
                if (!mc){
                    console.warn(`BookController: voice MC "${mcName}" not found on page ${slide.pageNum}`);
                    continue;
                } 
                console.log(`BookController: attached voice handler for "${mcName}" → ${voicePath}`);
                mc.interactive = true;
                mc.cursor = 'pointer';
                // Pre-compute and lock the hit area so PIXI never has to
                // recompute it dynamically (unreliable on Flash-export ZContainers).
                const lb = mc.getLocalBounds();
                mc.hitArea = new PIXI.Rectangle(lb.x - 10, lb.y - 10, lb.width + 20, lb.height + 20);
                let callback = (event: PIXI.FederatedPointerEvent) => {
                    this._stopVoice();
                    const url = `${GlobalData.assetsBasePath}${voicePath}`;
                    this.voiceAudio = new Audio(url);
                    this.voiceAudio.play().catch(e => console.warn(`Voice play error (${mcName}):`, e));

                    // Momentary highlight: yellow color matrix filter
                    const cmf = new PIXI.filters.ColorMatrixFilter();
                    cmf.tint(0xffee88, false);
                    mc.filters = [...(mc.filters ?? []), cmf];
                    setTimeout(() => {
                        mc.filters = (mc.filters ?? []).filter(f => f !== cmf);
                        cmf.destroy();
                    }, 200);
                };
                mc.on('mousedown', callback);
                mc.on('touchstart', callback);  
        }
    }

    private _stopVoice(): void {
        if (this.voiceAudio) {
            this.voiceAudio.pause();
            this.voiceAudio.currentTime = 0;
            this.voiceAudio = null;
        }
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
        this._stopVoice();
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    destroy(): void {
        this._stopAudio();

        if (this.pageMask) {
            this.blockBGContainer?.removeChild(this.pageMask);
            this.pageMask.destroy();
            this.pageMask = null;
        }

        if (this.currentPageScene) {
            this.stage?.removeChild(this.currentPageScene.sceneStage);
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

