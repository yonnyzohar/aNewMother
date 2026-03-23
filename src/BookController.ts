import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZTimeline, ZContainer, ZButton } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { MainMenu } from './MainMenu';
import { unloadSceneImages } from './sceneUtils';
import { SlideObj } from './SlideObj';
import { gsap } from 'gsap';



export class BookController {
    private stage: PIXI.Container;
    private onBack: () => void;

    // The Block scene — the persistent wooden-frame visual
    private blockScene: ZScene | null = null;
    private blockBGContainer:    ZContainer | null = null;  // center slot
    private blockBGTopContainer: ZContainer | null = null;  // top slot (forward)
    private blockBGBtmContainer: ZContainer | null = null;  // bottom slot (back)
    private filmSides:    ZContainer | null = null;
    private filmSidesTop: ZContainer | null = null;
    private filmSidesBtm: ZContainer | null = null;
    private blockContainer: ZContainer | null = null;
    private textBoxContainer: ZContainer | null = null;

    // The currently-displayed page ZScene (NOT pushed to ZSceneStack — we manage
    // its scale/position manually so ZSceneStack.resize() doesn't fight us)
    private currentPageScene: ZScene | null = null;
    private currentPagePath: string | null = null;
    private tween: gsap.core.Tween | null = null;
    private slideTween: gsap.core.Timeline | null = null;

    private prevBtn!: ZButton;
    private nextBtn!: ZButton;
    private soundBtn!: ZButton;
    private menuBtn!: ZButton;
    private pageIndicator!: ZContainer;

    private blockWidth = 918;
    private blockHeight = 548;
    private twister:ZContainer;

    private audio: HTMLAudioElement | null = null;
    private voiceAudio: HTMLAudioElement | null = null;
    private loading = false;
    private pageMask: PIXI.Graphics | null = null;
    private slotOrigY: Map<ZContainer, number> = new Map();
    private currentOrientation: string = "";

    

    constructor(stage: PIXI.Container, onBack: () => void) {
        this.stage = stage;
        this.onBack = onBack;
    }

    // ─── Static preload ───────────────────────────────────────────────────────

    /** Begin loading the Block frame assets in the background. Returns a
     *  promise that resolves with a ready-to-use ZScene so that load() can
     *  skip the network fetch entirely if the user navigates to the book
     *  after the preload has finished. */
    static preloadBlockScene(): Promise<ZScene> {
        const scene = new ZScene('blockFrame');
        return new Promise<ZScene>(resolve => {
            scene.load(`${GlobalData.assetsBasePath}Block/`, () => resolve(scene));
        });
    }

    async load(preloadedBlockScene?: ZScene): Promise<void> {
        // 1. Load the Block frame scene — use the pre-loaded scene if available
        if (preloadedBlockScene) {
            this.blockScene = preloadedBlockScene;
        } else {
            this.blockScene = new ZScene('blockFrame');
            await new Promise<void>(resolve => {
                this.blockScene!.load(`${GlobalData.assetsBasePath}Block/`, () => resolve());
            });
        }
        // Initialize sceneStage children offscreen so the menu stays visible
        // while the first page loads. We'll add to the real stage afterwards.
        const offscreen = new PIXI.Container();
        this.blockScene.loadStage(offscreen);
        offscreen.removeChild(this.blockScene.sceneStage);

        // Grab blockBG and textBox containers for positioning
        this.blockBGContainer = this.blockScene.sceneStage.get('blockBG');
        if (this.blockBGContainer) this.blockBGContainer.eventMode = 'passive';
        this.textBoxContainer = this.blockScene.sceneStage.get('textBox');
        this.twister = this.blockScene.sceneStage.get("twister") as ZContainer;

        // Projector slots: top (forward) and bottom (back) — hidden by default.
        this.blockBGTopContainer = this.blockScene.sceneStage.get('blockBGTop');
        this.blockBGBtmContainer = this.blockScene.sceneStage.get('blockBGBTM');
        this.blockBGTopContainer?.setAlpha(0);
        this.blockBGBtmContainer?.setAlpha(0);
        if (this.blockBGTopContainer) this.blockBGTopContainer.eventMode = 'passive';
        if (this.blockBGBtmContainer) this.blockBGBtmContainer.eventMode = 'passive';

        // Film-strip overlays (hit-test disabled; top+btm hidden by default).
        this.filmSides = this.blockScene.sceneStage.get('filmSides');
        if (this.filmSides) this.filmSides.eventMode = 'none';
        this.filmSidesTop = this.blockScene.sceneStage.get('filmSidesTop');
        this.filmSidesBtm = this.blockScene.sceneStage.get('filmSidesBTM');
        this.filmSidesTop?.setAlpha(0);
        this.filmSidesBtm?.setAlpha(0);
        if (this.filmSidesTop) this.filmSidesTop.eventMode = 'none';
        if (this.filmSidesBtm) this.filmSidesBtm.eventMode = 'none';

        // Record natural y positions for all sliding layers so we can reset after transitions.
        [this.blockBGTopContainer, this.filmSidesTop,
         this.blockBGContainer,    this.filmSides,
         this.blockBGBtmContainer, this.filmSidesBtm]
            .filter(Boolean)
            .forEach(c => this.slotOrigY.set(c!, (c as any).y));

        // blockContainer sits between sceneStage and blockBG — must be passive
        // so events can propagate all the way in to the page children.
        this.blockContainer = this.blockScene.sceneStage.get('blockContainer');
        if (this.blockContainer) this.blockContainer.eventMode = 'passive';

        // Ensure the block scene's own sceneStage passes events through.
        this.blockScene.sceneStage.eventMode = 'passive';
        

        // 2. Build nav-button overlay (always on top)
        this._buildOverlay();

        // 3. Load first page offscreen, then bring the full book onto the stage
        await this._loadPage(GlobalData.counter);

        // Everything is ready — add to real stage and resize stack now
        this.stage.addChild(this.blockScene.sceneStage);
        ZSceneStack.push(this.blockScene);

        let blockMaster = this.blockScene.sceneStage.get("blockMaster") as ZContainer;
        let circleContainer = this.blockScene.sceneStage.get("circleContainer") as ZContainer;

        let circle:PIXI.Graphics = new PIXI.Graphics();
        circle.beginFill(0x000000,1);
        circle.drawCircle(0,0,50);
        circle.endFill();
        circleContainer.addChild(circle);
        blockMaster.mask = circle;
        if(this.tween) this.tween.kill();
        
        // Tween a PIXI display object's properties over 0.5 seconds
        this.tween = gsap.to(circle.scale, {
            duration: 2,
            x: 20,
            y: 20,
            ease: 'power2.out',
            onComplete: () =>{
                blockMaster.mask = null;
                circleContainer.removeChild(circle);
                this.tween = null;
            } ,
        });
    }

    // ─── Overlay ─────────────────────────────────────────────────────────────

    private _buildOverlay(): void {
        this.prevBtn = this.blockScene!.sceneStage.get('backBTN') as ZButton;
        this.prevBtn.setCallback(() => this._prev());
        this.nextBtn = this.blockScene!.sceneStage.get('forewardBTN') as ZButton;
        this.nextBtn.setCallback(() => this._next());

        this.soundBtn = this.blockScene?.sceneStage.get("replayBTN") as ZButton;
        this.soundBtn.setLabel(GlobalData.labels['replay']);
        this.soundBtn.setCallback(() => this._playSound());

        this.menuBtn = this.blockScene?.sceneStage.get("menuBTN") as ZButton;
        this.menuBtn.setLabel(GlobalData.labels['mainmenu']);
        this.menuBtn.setCallback(() => this._goBack());
        this.pageIndicator = this.blockScene!.sceneStage.get('pageNum') as ZContainer;
    }

    // ─── Page loading ─────────────────────────────────────────────────────────

    private _setButtonsDisabled(disabled: boolean): void {
        const btns:ZButton[] = [this.prevBtn, this.nextBtn, this.soundBtn, this.menuBtn];
        for (const btn of btns) {
            if (!btn) continue;
            if(disabled){
                btn.disable();
            }
            else{
                btn.enable();
            }
        }
    }

    private async _loadPage(index: number, direction: 0 | 1 | -1 = 0): Promise<void> {
        if (this.loading) return;
        this.loading = true;
        this.twister.setVisible(true);
        this._setButtonsDisabled(true);
        this._stopAudio();

        const slide = GlobalData.pages[index];
        if (!slide) {
            console.warn(`BookController: no slide at index ${index}`);
            this.loading = false;
            this._setButtonsDisabled(false);
            this.twister.setVisible(false);
            return;
        }

        // ── 1. Load new scene in the background ──────────────────────────────
        const pagePath = GlobalData.getPagePath(slide.pageNum);
        const scene = new ZScene(`page_${slide.pageNum}`);
        await new Promise<void>(resolve => {
            scene.load(pagePath, () => resolve());
        });

        // Unload old image aliases from cache now (safe — doesn't affect visuals).
        if (this.currentPagePath) await unloadSceneImages(this.currentPagePath);

        // Capture old refs so we can destroy them after the transition.
        const oldScene = this.currentPageScene;
        const oldMask  = this.pageMask;

        // ── 2. Scale + position the new scene stage ───────────────────────────
        // Force landscape layout: page scenes have no portrait instance data,
        // so ZScene would leave all MCs at (0,0) in portrait and the frozen
        // sceneWidth/sceneHeight would mis-size the hitArea. Overriding
        // setOrientation on the instance before loadStage keeps everything
        // consistently in landscape regardless of the device orientation.
        const sceneAny = scene as any;
        sceneAny.setOrientation = () => { sceneAny.orientation = 'landscape'; };
        // Use an offscreen container — the sceneStage goes into blockBGContainer below.
        const pageTmp = new PIXI.Container();
        scene.loadStage(pageTmp);
        pageTmp.removeChild(scene.sceneStage);
        delete sceneAny.setOrientation;

        const w = Math.max(scene.sceneWidth, scene.sceneHeight);
        const h = Math.min(scene.sceneWidth, scene.sceneHeight);
        scene.sceneStage.scale.set(this.blockWidth / w, this.blockHeight / h);
        scene.sceneStage.x = 0;
        scene.sceneStage.y = 0;

        // ── 3. If no animation (first load), swap immediately ─────────────────
        const canAnimate = direction !== 0
            && this.blockBGTopContainer !== null
            && this.blockBGBtmContainer !== null
            && this.blockContainer !== null;

        if (!canAnimate) {
            if (oldScene) {
                this.blockBGContainer?.removeChild(oldScene.sceneStage);
                oldScene.sceneStage.destroy({ children: true });
            }
            if (oldMask) {
                this.blockBGContainer?.removeChild(oldMask);
                oldMask.destroy();
            }
            this.pageMask = null;
            this.currentPageScene = null;
            this.currentPagePath = null;
            this.blockBGContainer?.addChild(scene.sceneStage);
            this._applyMask(scene, this.blockBGContainer!);
            this._finalizePageLoad(scene, pagePath, slide, index);
            return;
        }

        // ── 4. Projector transition ───────────────────────────────────────────
        // forward (direction=1):  new slide enters from top, slides DOWN to center.
        // backward (direction=-1): new slide enters from bottom, slides UP to center.
        const incomingBG    = direction === 1 ? this.blockBGTopContainer! : this.blockBGBtmContainer!;
        const incomingFilm  = direction === 1 ? this.filmSidesTop         : this.filmSidesBtm;

        // Kill any running tween and reset all slots to their original y positions.
        if (this.slideTween) { this.slideTween.kill(); this.slideTween = null; }

        const allSlots = [
            this.blockBGTopContainer, this.filmSidesTop,
            this.blockBGContainer,    this.filmSides,
            this.blockBGBtmContainer, this.filmSidesBtm,
        ].filter(Boolean) as ZContainer[];

        allSlots.forEach(c => { (c as any).y = this.slotOrigY.get(c) ?? (c as any).y; });

        // Place new scene in the off-screen slot (already at alpha 0).
        incomingBG.addChild(scene.sceneStage);

        // Target positions: the center (blockBG / filmSides) original y.
        const centerBGY   = this.slotOrigY.get(this.blockBGContainer!) ?? (this.blockBGContainer as any).y as number;
        const centerFilmY = this.slotOrigY.get(this.filmSides!)        ?? (this.filmSides as any).y as number;
        const origIncomingY = this.slotOrigY.get(incomingBG)           ?? (incomingBG as any).y as number;
        const deltaY = centerBGY - origIncomingY;   // how far incoming must travel to reach center

        console.log(`[projector] filmSides.y=${centerFilmY}  blockBG.y=${centerBGY}  incomingBG.y=${origIncomingY}  deltaY=${deltaY}`);

        this.slideTween = gsap.timeline({
            onComplete: () => {
                this.slideTween = null;

                // Bring center assets back to their original positions.
                allSlots.forEach(c => { (c as any).y = this.slotOrigY.get(c) ?? (c as any).y; });

                // Move new scene from off-screen slot → center slot.
                incomingBG.removeChild(scene.sceneStage);
                incomingBG.setAlpha(0);
                incomingFilm?.setAlpha(0);

                // Restore center slot opacity.
                this.blockBGContainer?.setAlpha(1);
                if (this.filmSides) this.filmSides.setAlpha(1);

                // Destroy old scene now that it's fully off-screen.
                if (oldScene) {
                    this.blockBGContainer?.removeChild(oldScene.sceneStage);
                    oldScene.sceneStage.destroy({ children: true });
                }
                if (oldMask) {
                    this.blockBGContainer?.removeChild(oldMask);
                    oldMask.destroy();
                }
                this.pageMask = null;
                this.currentPageScene = null;
                this.currentPagePath = null;

                // Add new scene to center and apply mask.
                this.blockBGContainer?.addChild(scene.sceneStage);
                this._applyMask(scene, this.blockBGContainer!);

                this._finalizePageLoad(scene, pagePath, slide, index);
            },
        });

        // Incoming pair: tween TO center y + fade in.
        this.slideTween.to(incomingBG, { y: centerBGY, alpha: 1, duration: 0.8, ease: 'power2.inOut' }, 0);
        if (incomingFilm)
            this.slideTween.to(incomingFilm, { y: centerFilmY, alpha: 1, duration: 0.8, ease: 'power2.inOut' }, 0);

        // Center pair: tween OUT in the same scroll direction + fade out.
        this.slideTween.to(this.blockBGContainer!, { y: centerBGY + deltaY, alpha: 0, duration: 0.8, ease: 'power2.inOut' }, 0);
        if (this.filmSides)
            this.slideTween.to(this.filmSides!, { y: centerFilmY + deltaY, alpha: 0, duration: 0.8, ease: 'power2.inOut' }, 0);
    }

    /** Apply a Graphics-based mask to a newly-loaded scene in a given container. */
    private _applyMask(scene: ZScene, container: ZContainer): void {
        const innerMSK = container.getChildByName('innerMSK') as PIXI.Container | null;
        if (!innerMSK) return;
        const lb = innerMSK.getLocalBounds();
        const gfxMask = new PIXI.Graphics();
        gfxMask.beginFill(0xffffff);
        gfxMask.drawRect(innerMSK.x + lb.x, innerMSK.y + lb.y, lb.width, lb.height);
        gfxMask.endFill();
        container.addChild(gfxMask);
        scene.sceneStage.mask = gfxMask;
        this.pageMask = gfxMask;
    }

    /** Runs after page is visually in place — wires up handlers and re-enables UI. */
    private _finalizePageLoad(scene: ZScene, pagePath: string, slide: SlideObj, index: number): void {
        this._playTimelines(scene.sceneStage);
        this.currentPageScene = scene;
        this.currentPagePath = pagePath;
        this._attachVoiceHandlers(scene, slide);
        this.textBoxContainer?.setText(slide.caption);
        this.pageIndicator.setText(`${index + 1} / ${GlobalData.pages.length}`);
        this.prevBtn.visible = index > 0;
        this.loading = false;
        this._setButtonsDisabled(false);
        this.prevBtn?.setCallback(() => { GlobalData.playUiSound('xClose.mp3');this._prev(); });
        this.nextBtn?.setCallback(() => { GlobalData.playUiSound('xClose.mp3');this._next(); });
        this._playSound();
        this.twister.setVisible(false);
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

    private _prev(): void {
        if (this.loading || GlobalData.counter <= 0) return;
        GlobalData.counter--;
        this._loadPage(GlobalData.counter, -1);
    }

    private _next(): void {
        if (this.loading) return;
        if (GlobalData.counter < GlobalData.pages.length - 1) {
            GlobalData.counter++;
            this._loadPage(GlobalData.counter, 1);
        } else {
            this._goBack();
        }
    }

    private _goBack(): void {
        this._stopAudio();
        GlobalData.playUiSound('stop.mp3');
        let blockMaster = this.blockScene!.sceneStage.get("blockMaster") as ZContainer;
        let circleContainer = this.blockScene!.sceneStage.get("circleContainer") as ZContainer;

        let circle:PIXI.Graphics = new PIXI.Graphics();
        circle.beginFill(0x000000,1);
        circle.drawCircle(0,0,50);
        circle.endFill();
        circle.scale.set(20,20);
        circleContainer.addChild(circle);
        blockMaster.mask = circle;
        if(this.tween) this.tween.kill();
        
        // Tween a PIXI display object's properties over 0.5 seconds
        this.tween = gsap.to(circle.scale, {
            duration: 2,
            x: 0,
            y: 0,
            ease: 'power2.out',
            onComplete: () =>{
                this.tween = null;
                blockMaster.mask = null;
                circleContainer.removeChild(circle);
                this.destroy();
                this.onBack();
            } ,
        });
        
    }

    // ─── Voice handlers ───────────────────────────────────────────────────────

    private _attachVoiceHandlers(scene: ZScene, slide: SlideObj): void {
        if (Object.keys(slide.voices).length === 0) return;
        console.log(`BookController: attaching voice handlers for page ${slide.pageNum}:`, slide.voices);

        const sceneStage = scene.sceneStage;

        // Walk every ancestor up to root and ensure none block events.
        let node = sceneStage.parent as PIXI.Container | null;
        while (node && node !== this.stage) {
            (node as unknown as { eventMode: string }).eventMode = 'passive';
            node = node.parent as PIXI.Container | null;
        }

        // Give sceneStage a broad hitArea covering the full landscape design space.
        // Use max(w,h) x max(h,w) so it never clips regardless of scene.orientation.
        const designW = Math.max(scene.sceneWidth, scene.sceneHeight);
        const designH = Math.min(scene.sceneWidth, scene.sceneHeight);
        sceneStage.hitArea = new PIXI.Rectangle(0, 0, designW, designH);
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
            mc.removeAllListeners();  // ensure no old handlers remain after page transitions
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

    /**
     * Called from app.ts AFTER ZSceneStack.resize() has already updated the
     * Block frame scene.  Re-fits the page and repositions buttons/caption.
     */
    resize(_W: number, _H: number): void {
        // page scaling is fixed at load time; no resize action needed.
        let orient = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
        if(orient !== this.currentOrientation)
        {
            console.log(`Orientation change: ${this.currentOrientation} → ${orient}`);
            if(this.currentPageScene)
            {

                this._attachVoiceHandlers(this.currentPageScene!, GlobalData.pages[GlobalData.counter]);
            }
            
        }
        this.currentOrientation = orient;
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
            this.currentPageScene.sceneStage.destroy({ children: true });
            this.currentPageScene = null;
            this.currentPagePath = null;
        }

        if (this.blockScene) {
            ZSceneStack.pop();
            this.stage.removeChild(this.blockScene.sceneStage);
            this.blockScene.sceneStage.destroy({ children: true });
            this.blockScene = null;
        }

    }
}

