import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack, ZButton } from 'zimporter-pixi';
import { GlobalData } from './GlobalData';

export class AboutScreen {
    private scene: ZScene;
    private stage: PIXI.Container;
    private onClose: () => void;

    constructor(stage: PIXI.Container, onClose: () => void) {
        this.stage = stage;
        this.onClose = onClose;
        this.scene = new ZScene('about');
    }

    async load(): Promise<void> {
        await new Promise<void>(resolve => {
            this.scene.load(`${GlobalData.assetsBasePath}about/`, () => resolve());
        });

        ZSceneStack.push(this.scene);
        this.scene.loadStage(this.stage);

        const L = GlobalData.labels;
        const ss = this.scene.sceneStage;

        ss.get('aboutTopTitleTXT')?.setText(L['about'] ?? 'About');
        ss.get('aboutTXTArea')?.setText(L['aboutcontents'] ?? '');

        const xBtn = ss.get('xButton') as ZButton | null;
        xBtn?.setCallback(() => this._close());
    }

    private _close(): void {
        const xBtn = this.scene.sceneStage.get('xButton') as ZButton | null;
        xBtn?.removeCallback();

        ZSceneStack.pop();
        this.stage.removeChild(this.scene.sceneStage);
        this.scene.destroy();
        this.onClose();
    }
}
