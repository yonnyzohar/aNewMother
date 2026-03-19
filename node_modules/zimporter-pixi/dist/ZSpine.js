import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
import * as PIXISpine3Base from "@pixi-spine/base";
import * as PIXI from "pixi.js";
export class ZSpine {
    spineData;
    assetBasePath;
    /**
     * Creates a `ZSpine` loader.
     * @param spineData - The spine asset descriptor from the scene editor.
     * @param assetBasePath - Base URL / path prepended to all asset file references.
     */
    constructor(spineData, assetBasePath) {
        this.spineData = spineData;
        this.assetBasePath = assetBasePath;
    }
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
    async load(callback) {
        let spineData = this.spineData;
        let assetBasePath = this.assetBasePath;
        let onSpineLoaded = (texture, spineData, skeletonData, version) => {
            // Handle the loaded spine asset
            let spine = null;
            if (version === 4) {
                spine = new PIXISpine4.Spine(skeletonData);
            }
            else if (version === 3) {
                spine = new PIXISpine3.Spine(skeletonData);
            }
            spine.name = spineData.name;
            // Prevent PIXI v7's event system from recursing into spine's internal
            // mesh/bone objects, which come from a different PIXI build and lack
            // the isInteractive() method, causing "t.isInteractive is not a function".
            spine.eventMode = 'none';
            if (spineData.skin) {
                spine.skeleton.setSkinByName(spineData.skin);
                spine.skeleton.setSlotsToSetupPose();
            }
            if (spineData.playOnStart && spineData.playOnStart.value) {
                spine.state.setAnimation(0, spineData.playOnStart.animation, true);
            }
            callback(spine);
        };
        if (spineData.spineAtlas && spineData.spineAtlas !== "") {
            try {
                // Manually fetch both files to avoid PIXI deriving the atlas filename
                // from the JSON filename (which breaks when names differ, e.g. windmill-ess.json + windmill-pma.atlas)
                const atlasFullPath = assetBasePath + spineData.spineAtlas;
                const atlasDir = atlasFullPath.substring(0, atlasFullPath.lastIndexOf('/') + 1);
                const [atlasText, rawSkeletonData] = await Promise.all([
                    fetch(atlasFullPath).then(r => {
                        if (!r.ok)
                            throw new Error(`Failed to fetch atlas: ${r.statusText}`);
                        return r.text();
                    }),
                    fetch(assetBasePath + spineData.spineJson).then(r => {
                        if (!r.ok)
                            throw new Error(`Failed to fetch spine JSON: ${r.statusText}`);
                        return r.json();
                    })
                ]);
                const spineVersion = rawSkeletonData.skeleton?.spine ?? '';
                const isVer4 = spineVersion.startsWith('4.');
                if (isVer4) {
                    const atlas = await new Promise((resolve, reject) => {
                        new PIXISpine4.TextureAtlas(atlasText, (path, loader) => {
                            PIXI.Assets.load(atlasDir + path).then(loader).catch(reject);
                        }, resolve);
                    });
                    const attachmentLoader = new PIXISpine4.AtlasAttachmentLoader(atlas);
                    const parser = new PIXISpine4.SkeletonJson(attachmentLoader);
                    const skeletonData = parser.readSkeletonData(rawSkeletonData);
                    const texture = atlas.regions[0] ? atlas.regions[0].texture : PIXI.Texture.EMPTY;
                    onSpineLoaded(texture, spineData, skeletonData, 4);
                }
                else {
                    const atlas = await new Promise((resolve, reject) => {
                        new PIXISpine3Base.TextureAtlas(atlasText, (path, loader) => {
                            PIXI.Assets.load(atlasDir + path).then(loader).catch(reject);
                        }, resolve);
                    });
                    const attachmentLoader = new PIXISpine3.AtlasAttachmentLoader(atlas);
                    const parser = new PIXISpine3.SkeletonJson(attachmentLoader);
                    const skeletonData = parser.readSkeletonData(rawSkeletonData);
                    const texture = atlas.regions[0] ? atlas.regions[0].texture : PIXI.Texture.EMPTY;
                    onSpineLoaded(texture, spineData, skeletonData, 3);
                }
            }
            catch (error) {
                console.error("Error loading Spine data:", error);
                callback(undefined);
            }
        }
        else if (spineData.pngFiles && spineData.pngFiles.length) {
            // Spine 3 without atlas, with separate PNG files
            const defaultTexture = PIXI.Texture.EMPTY;
            const textures = {};
            const textureLoadPromises = [];
            let _name = spineData.name || "spine";
            // Collect all texture loading promises
            for (const file of spineData.pngFiles) {
                textureLoadPromises.push(new Promise((resolve, reject) => {
                    const texture = PIXI.Texture.from(assetBasePath + file);
                    if (texture.baseTexture.valid) {
                        let fileName = this.getFileNameWithoutExtension(file);
                        _name = fileName;
                        textures[fileName] = texture;
                        resolve(texture);
                    }
                    else {
                        texture.baseTexture.once('loaded', () => {
                            textures[this.getFileNameWithoutExtension(file)] = texture;
                            resolve(texture);
                        });
                        texture.baseTexture.once('error', (err) => reject(new Error(`Failed to load texture ${file}: ${err}`)));
                    }
                }));
            }
            // Wait for all textures to load
            await Promise.all(textureLoadPromises);
            //the spineJson needs to sit in a folder with the same name, if not alert
            let spineFolderFullPath = assetBasePath + spineData.spineJson.substring(0, spineData.spineJson.lastIndexOf("/"));
            let spineFolderName = spineFolderFullPath.substring(spineFolderFullPath.lastIndexOf("/") + 1);
            let spineJsonName = this.getFileNameWithoutExtension(spineData.spineJson);
            if (spineFolderName !== spineJsonName) {
                alert(`Spine JSON file "${spineData.spineJson}" should be in a folder named "${spineJsonName}".`);
                return undefined;
            }
            // 2. Load the JSON data
            const rawSkeletonData = await (await fetch(assetBasePath + spineData.spineJson)).json();
            let spineVersion = rawSkeletonData.skeleton ? rawSkeletonData.skeleton.spine : null;
            let ver = 3;
            let atlas = null;
            if (spineVersion && spineVersion.startsWith("4.")) {
                ver = 4;
                atlas = new PIXISpine4.TextureAtlas();
            }
            else {
                atlas = new PIXISpine3Base.TextureAtlas();
            }
            // The `true` argument for `stripExtension` is crucial here.
            // It means if your Spine JSON refers to an image as "win_reel"
            // and your texture is named "win_reel.png", it will match them.
            atlas.addTextureHash(textures, true);
            let missing = "";
            // Iterate through each skin (usually just 'default')
            for (const skinName in rawSkeletonData.skins) {
                const skin = rawSkeletonData.skins[skinName];
                if (skin.attachments) {
                    // Iterate through each attachment slot
                    for (const slotName in skin.attachments) {
                        const attachmentsForSlot = skin.attachments[slotName];
                        // Iterate through each attachment variant (e.g., different images for the same slot)
                        for (const attachmentName in attachmentsForSlot) {
                            if (textures[attachmentName]) {
                                // Add the texture region to the atlas
                                atlas.addTexture(attachmentName, // The name of the attachment (e.g., 'popup_back', 'congratulations_en')
                                textures[attachmentName]);
                            }
                            else {
                                atlas.addTexture(attachmentName, // The name of the attachment (e.g., 'popup_back', 'congratulations_en')
                                defaultTexture // Fallback to a default texture if the specific one is not found
                                );
                                textures[attachmentName] = defaultTexture;
                                let str = attachmentName;
                                console.warn(str + " not found in loaded textures.");
                                if (missing.indexOf(str) === -1) {
                                    missing += str;
                                    missing += ", ";
                                }
                            }
                        }
                    }
                }
            }
            for (const texName in textures) {
                // Look for numbered sequence frames
                const match = texName.match(/^(.*?)(\d+)$/);
                if (match) {
                    const baseName = match[1]; // e.g., "Frame_Sequence"
                    const frameIndex = parseInt(match[2], 10);
                    // If this is the first frame (0), alias the base name to it
                    if (frameIndex === 0 && !atlas.regions.some(r => r.name === baseName)) {
                        atlas.addTexture(baseName, textures[texName]);
                        console.warn(`Aliased base region "${baseName}" -> "${texName}"`);
                    }
                }
            }
            let attachmentLoader = null;
            let jsonParser = null;
            let skeletonData;
            if (ver === 3) {
                attachmentLoader = new PIXISpine3.AtlasAttachmentLoader(atlas);
                jsonParser = new PIXISpine3.SkeletonJson(attachmentLoader);
                skeletonData = jsonParser.readSkeletonData(rawSkeletonData);
                onSpineLoaded(textures[_name], spineData, skeletonData, 3);
            }
            if (ver === 4) {
                attachmentLoader = new PIXISpine4.AtlasAttachmentLoader(atlas);
                jsonParser = new PIXISpine4.SkeletonJson(attachmentLoader);
                skeletonData = jsonParser.readSkeletonData(rawSkeletonData);
                onSpineLoaded(textures[_name], spineData, skeletonData, 4);
            }
        }
    }
    /**
     * Extracts the file name without its extension from a file path.
     * @param path - A file path or URL string.
     * @returns The base file name without the extension (e.g. `"windmill-pma"`).
     */
    getFileNameWithoutExtension(path) {
        const lastSlash = path.lastIndexOf('/');
        const fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        const lastDot = fileName.lastIndexOf('.');
        return lastDot >= 0 ? fileName.substring(0, lastDot) : fileName;
    }
}
//# sourceMappingURL=ZSpine.js.map