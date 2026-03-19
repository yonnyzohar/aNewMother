import { SpineData } from "./SceneData";
import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
export declare class ZSpine {
    private spineData;
    private assetBasePath;
    /**
     * Creates a `ZSpine` loader.
     * @param spineData - The spine asset descriptor from the scene editor.
     * @param assetBasePath - Base URL / path prepended to all asset file references.
     */
    constructor(spineData: SpineData, assetBasePath: string);
    /**
     * Loads the Spine asset described by `spineData` and returns a fully
     * configured Spine instance via `callback`.
     *
     * - If `spineData.spineAtlas` is set, the atlas and JSON are fetched
     *   manually (bypassing PIXI's filename-guessing logic) and the correct
     *   v3 or v4 runtime is chosen based on the skeleton version string.
     * - If `spineData.pngFiles` is provided instead, each PNG is loaded as a
     *   `PIXI.Texture`, an atlas is built from them, and the skeleton is parsed.
     *
     * @param callback - Receives the finished `Spine` instance, or `undefined`
     *   if loading failed.
     */
    load(callback: (spine: PIXISpine3.Spine | PIXISpine4.Spine | undefined) => void): Promise<void>;
    /**
     * Extracts the file name without its extension from a file path.
     * @param path - A file path or URL string.
     * @returns The base file name without the extension (e.g. `"windmill-pma"`).
     */
    getFileNameWithoutExtension(path: string): string;
}
//# sourceMappingURL=ZSpine.d.ts.map