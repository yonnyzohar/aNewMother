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
    }

    /** Re-apply labels + re-create overlay after a language switch. */
    async reload(): Promise<void> {
        await StoryLoader.load(GlobalData.currentLang);
        this._applyLabels();

        // Rebuild the lang toggle button text
        this.stage.removeChild(this.overlay);
    }

    private _applyLabels(): void {
        const L = GlobalData.labels;
        const ss = this.scene.sceneStage;

        ss.get('franchiseTitleTXT')?.setText(L['franchise'] ?? '');
        ss.get('storyNameTXT')?.setText(L['storyname'] ?? '');

        const playBtn = ss.get('playBookBTN') as ZButton | null;
        playBtn?.setLabel?.(L['play'] ?? 'Play');
        playBtn?.setCallback(() => this.onPlay());

        const aboutBtn = ss.get('aboutBTN') as ZButton | null;
        aboutBtn?.setLabel?.(L['about'] ?? 'About');
        aboutBtn?.setCallback(() => this.onAbout());

        const otherLang =GlobalData.currentLang === 'eng' ? 'HEB' : 'ENG';
        const langBTN = ss.get('langBTN') as ZButton | null;
        langBTN?.setLabel?.(otherLang);
        langBTN?.setCallback(() => {
            const next = GlobalData.currentLang === 'eng' ? 'heb' : 'eng';
            const newLabel = next === 'eng' ? 'HEB' : 'ENG';
            langBTN?.setLabel?.(newLabel);
            this.onLangChange(next);
        });
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
