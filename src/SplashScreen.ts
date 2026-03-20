import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZTimeline } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { StoryLoader } from './StoryLoader';
import { safeDestroyScene } from './sceneUtils';

export class SplashScreen {
    private scene: ZScene;
    private stage: PIXI.Container;
    private onComplete: () => void;

    constructor(stage: PIXI.Container, onComplete: () => void) {
        this.stage = stage;
        this.onComplete = onComplete;
        this.scene = new ZScene('splash');
    }

    async load(): Promise<void> {
        // Load splash scene visuals and story XML simultaneously
        await Promise.all([
            new Promise<void>(resolve => {
                this.scene.load(`${GlobalData.assetsBasePath}Splash/`, () => resolve());
            }),
            StoryLoader.load(GlobalData.currentLang),
        ]);

        ZSceneStack.push(this.scene);
        this.scene.loadStage(this.stage);

        // Auto-play any timeline animations in the splash scene
        for (const child of this.scene.sceneStage.children) {
            if (child instanceof ZTimeline) {
                (child as ZTimeline).play();
            }
        }

        // Show splash for 2 s, then transition
        setTimeout(() => { this._complete(); }, 2000);
    }

    private async _complete(): Promise<void> {
        ZSceneStack.pop();
        this.stage.removeChild(this.scene.sceneStage);
        await safeDestroyScene(this.scene);
        this.onComplete();
    }
}
