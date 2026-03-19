import * as PIXI from 'pixi.js';
import { ZButton, ZContainer, ZScene, ZState, ZTimeline } from 'zimporter-pixi';
import { ZSceneStack } from 'zimporter-pixi';
export class Game {

    stage: PIXI.Container;
    constructor(stage: PIXI.Container, forceRenderFnc: Function | null = null) {
        this.stage = stage;
        const arr = ["output"];
        let loadPath = (window as any).loadPath || "./assets/" + arr[0] + "/";
        console.log("Game constructor " + loadPath);
        let scene: ZScene = new ZScene("testScene");
        scene.load(loadPath, () => {
            ZSceneStack.push(scene);
            scene.loadStage(this.stage);
            let sceneStage: ZContainer = scene.sceneStage;
            for (const child of sceneStage.children) {
                if (child instanceof ZTimeline) {
                    child.play();
                }
            }



            forceRenderFnc?.();
        });
    }



    update(deltaMS: number) {

    }

}