import * as PIXI from "pixi.js";
import { NineSliceData, OrientationData } from "./SceneData";
export declare class ZNineSlice extends PIXI.NineSlicePlane {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    constructor(texture: PIXI.Texture, nineSliceData: NineSliceData, orientation: string);
    /**
     * Switches the active orientation data and re-applies the nine-slice dimensions.
     * @param width - The new viewport width (passed by the scene; not used directly).
     * @param height - The new viewport height (passed by the scene; not used directly).
     * @param orientation - `"portrait"` or `"landscape"`.
     */
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    /**
     * Reads `currentTransform.width` and `currentTransform.height` and applies
     * them to the nine-slice plane.
     */
    private applyTransform;
}
//# sourceMappingURL=ZNineSlice.d.ts.map