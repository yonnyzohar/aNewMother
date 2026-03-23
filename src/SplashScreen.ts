import * as PIXI from 'pixi.js';
import { ZScene, ZTimeline } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';
import { LoadingBar } from './LoadingBar';
import { StoryLoader } from './StoryLoader';

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
        const bar = new LoadingBar(this.stage);
        // Load splash scene visuals and story XML simultaneously
        await Promise.all([
            new Promise<void>(resolve => {
                this.scene.load(`${GlobalData.assetsBasePath}Splash/`, () => resolve(), p => bar.update(p));
            }),
            StoryLoader.load(GlobalData.currentLang),
        ]);
        bar.remove();

        this.scene.loadStage(this.stage);

        // Auto-play any timeline animations in the splash scene
        for (const child of this.scene.sceneStage.children) {
            if (child instanceof ZTimeline) {
                (child as ZTimeline).play();
            }
        }

        // Show splash for 2 s, then signal Game to begin the next scene.
        // Destruction is deferred to Game.ts so the splash stays visible
        // while the next scene is loading.
        setTimeout(() => { this.onComplete(); }, 2000);
    }

    /** Called by Game.ts after the next scene has finished loading. */
    destroy(): void {
        // Only remove and destroy the display objects — calling scene.destroy()
        // spawns an internal async task that runs layout on already-freed sprites
        // and throws an uncatchable "null texture" error.
        this.stage.removeChild(this.scene.sceneStage);
        this.scene.sceneStage.destroy({ children: true });
    }
}
