import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZButton, ZContainer } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { StoryLoader } from './StoryLoader';
import { safeDestroyScene } from './sceneUtils';

export class MainMenu {
    private scene: ZScene;
    private stage: PIXI.Container;
    private onPlay: () => void;
    private onAbout: () => void;
    private onLangChange: (lang: string) => void;

    /** Overlay container for the language toggle button (drawn with PIXI.Graphics). */
    private overlay: PIXI.Container = new PIXI.Container();

    constructor(
        stage: PIXI.Container,
        onPlay: () => void,
        onAbout: () => void,
        onLangChange: (lang: string) => void,
    ) {
        this.stage = stage;
        this.onPlay = onPlay;
        this.onAbout = onAbout;
        this.onLangChange = onLangChange;
        this.scene = new ZScene('mainMenu');
    }

    async load(): Promise<void> {
        await new Promise<void>(resolve => {
            this.scene.load(`${GlobalData.assetsBasePath}mainMenu/`, () => resolve());
        });

        ZSceneStack.push(this.scene);
        this.scene.loadStage(this.stage);

        this._applyLabels();
        this._addLangToggle();
    }

    /** Re-apply labels + re-create overlay after a language switch. */
    async reload(): Promise<void> {
        await StoryLoader.load(GlobalData.currentLang);
        this._applyLabels();

        // Rebuild the lang toggle button text
        this.stage.removeChild(this.overlay);
        this.overlay = new PIXI.Container();
        this._addLangToggle();
    }

    private _applyLabels(): void {
        const L = GlobalData.labels;
        const ss = this.scene.sceneStage;

        ss.get('franchiseTitleTXT')?.setText(L['franchise'] ?? '');
        ss.get('storyNameTXT')?.setText(L['storyName'] ?? '');

        const playBtn = ss.get('playBookBTN') as ZButton | null;
        playBtn?.setLabel(L['play'] ?? 'Play');
        playBtn?.setCallback(() => this.onPlay());

        const aboutBtn = ss.get('aboutBTN') as ZButton | null;
        aboutBtn?.setLabel(L['about'] ?? 'About');
        aboutBtn?.setCallback(() => this.onAbout());
    }

    /** Creates a small language-toggle button using PIXI.Graphics (no asset needed). */
    private _addLangToggle(): void {
        const otherLang = GlobalData.currentLang === 'eng' ? 'HEB' : 'ENG';

        const btn = MainMenu.makeTextButton(otherLang, 0x1a3a5c, () => {
            const next = GlobalData.currentLang === 'eng' ? 'heb' : 'eng';
            this.onLangChange(next);
        });

        // Place in top-right corner
        btn.x = window.innerWidth - 80;
        btn.y = 16;
        this.overlay.addChild(btn);
        this.stage.addChild(this.overlay);
    }

    /** Utility: create a rectangle button with centred label using only PIXI primitives. */
    static makeTextButton(
        label: string,
        color: number,
        onClick: () => void,
        width = 100,
        height = 44,
    ): PIXI.Container {
        const c = new PIXI.Container();

        const bg = new PIXI.Graphics();
        bg.beginFill(color, 0.85);
        bg.lineStyle(2, 0xffffff, 0.9);
        bg.drawRoundedRect(0, 0, width, height, 8);
        bg.endFill();

        const txt = new PIXI.Text(label, {
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold',
        });
        txt.anchor.set(0.5);
        txt.x = width / 2;
        txt.y = height / 2;

        c.addChild(bg);
        c.addChild(txt);
        c.interactive = true;
        c.cursor = 'pointer';
        c.on('pointerdown', onClick);
        return c;
    }

    destroy(): void {
        const playBtn = this.scene.sceneStage.get('playBookBTN') as ZButton | null;
        playBtn?.removeCallback();
        const aboutBtn = this.scene.sceneStage.get('aboutBTN') as ZButton | null;
        aboutBtn?.removeCallback();

        this.stage.removeChild(this.overlay);
        ZSceneStack.pop();
        this.stage.removeChild(this.scene.sceneStage);
        safeDestroyScene(this.scene);
    }
}
