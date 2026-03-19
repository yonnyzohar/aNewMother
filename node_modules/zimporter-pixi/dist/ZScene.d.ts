import * as PIXI from "pixi.js";
import { ZContainer } from "./ZContainer";
import { SceneData, TemplateData, AnimTrackData } from "./SceneData";
import { ProgressCallback } from "pixi.js";
import { ZNineSlice } from "./ZNineSlice";
export type AssetType = "btn" | "asset" | "state" | "toggle" | "none" | "slider" | "scrollBar" | "fullScreen" | "animation";
/**
 * Represents a scene in the application, managing its assets, layout, and lifecycle.
 * Handles loading, resizing, and instantiation of scene elements using PIXI.js.
 *
 * @remarks
 * - Supports both landscape and portrait orientations.
 * - Manages scene assets, templates, and animation tracks.
 * - Provides methods for loading assets, creating display objects, and handling responsive resizing.
 * - Integrates with custom containers such as `ZContainer`, `ZButton`, `ZState`, and `ZTimeline`.
 */
export declare class ZScene {
    static assetTypes: Map<AssetType, any>;
    private assetBasePath;
    /**
     * The loaded PIXI spritesheet for the scene, or null if not loaded.
     */
    private scene;
    /**
     * The root container for all scene display objects.
     */
    private _sceneStage;
    /**
     * The data describing the scene's structure, assets, and templates.
     */
    private data;
    /**
     * A map of containers that should be resized when the scene resizes.
     */
    private resizeMap;
    /**
     * Static map of all instantiated scenes by their ID.
     */
    private static Map;
    /**
     * The unique identifier for this scene.
     */
    private sceneId;
    /**
     * The current orientation of the scene ("landscape" or "portrait").
     */
    private orientation;
    /**
     * The current stage of the scene, used for managing scene transitions.
     */
    private sceneName;
    /** Returns the root `ZContainer` that all scene display objects are added to. */
    get sceneStage(): ZContainer;
    /**
     * Constructs a new ZScene instance.
     * @param _sceneId - The unique identifier for the scene.
     */
    constructor(_sceneId: string);
    /**
     * Sets the orientation property based on the current window dimensions.
     */
    setOrientation(): void;
    /**
     * Retrieves a scene instance by its ID.
     * @param sceneId - The ID of the scene to retrieve.
     * @returns The ZScene instance, or undefined if not found.
     */
    static getSceneById(sceneId: string): ZScene | undefined;
    /**
     * Loads and initializes the scene's stage, adding its children to the global stage.
     * @param globalStage - The main PIXI.Container to which the scene will be added.
     */
    loadStage(globalStage: PIXI.Container, loadChildren?: boolean): void;
    /**
     * Adds a container to the resize map, so it will be resized with the scene.
     * @param mc - The container to add.
     */
    addToResizeMap(mc: ZContainer | ZNineSlice): void;
    /**
     * Removes a container from the resize map.
     * @param mc - The container to remove.
     */
    removeFromResizeMap(mc: ZContainer): void;
    /**
     * Returns the logical (un-scaled) inner dimensions of the scene, swapping
     * width and height when in portrait orientation.
     * @returns An object with `width` and `height` in scene units.
     */
    getInnerDimensions(): {
        width: number;
        height: number;
    };
    /**
     * Resizes the scene and all registered containers to fit the given dimensions.
     * @param width - The new width.
     * @param height - The new height.
     */
    resize(width: number, height: number): void;
    /** The logical width of the scene in scene units for the current orientation. */
    get sceneWidth(): number;
    /** The logical height of the scene in scene units for the current orientation. */
    get sceneHeight(): number;
    /**
     * Loads the scene's placement and asset data asynchronously.
     * @param assetBasePath - The base path for assets.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     */
    load(assetBasePath: string, _loadCompleteFnctn: Function, _updateProgressFnctn?: ProgressCallback): Promise<void>;
    /**
     * Destroys the scene and its assets, freeing resources.
     */
    destroy(): Promise<void>;
    /**
     * Loads the scene's assets and fonts, then initializes the scene.
     * @param assetBasePath - The base path for assets.
     * @param placemenisObj - The placements object describing the scene.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     * @param _updateProgressFnctn - Optional callback function to update loading progress.
     */
    loadAssets(assetBasePath: string, placemenisObj: SceneData, _loadCompleteFnctn: Function, _updateProgressFnctn?: ProgressCallback): Promise<void>;
    /**
     * Creates a PIXI.Sprite for a given frame name from the loaded spritesheet.
     * @param itemName - The name of the frame.
     * @returns The created sprite, or null if not found.
     */
    createFrame(itemName: string): PIXI.Sprite | null;
    /**
     * Builds the asset-load manifest (alias + src pairs) for scenes that use
     * individual image files instead of a sprite-sheet atlas.
     * @param assetBasePath - The base path prepended to each image file path.
     * @param obj - The scene data whose templates are scanned for `img` and `9slice` assets.
     * @returns An array of `{ alias, src }` objects suitable for `PIXI.Assets.load`.
     */
    private createImagesObject;
    /**
     * Gets the number of frames that match a given prefix in the spritesheet data.
     * @param _framePrefix - The prefix to search for.
     * @returns The number of matching frames.
     */
    getNumOfFrames(_framePrefix: string): number;
    /**
     * Creates an animated sprite (movie clip) from frames with a given prefix.
     * @param _framePrefix - The prefix for the frames.
     * @returns The created animated sprite.
     */
    createMovieClip(_framePrefix: string): PIXI.AnimatedSprite;
    /**
     * Initializes the scene with the given placements object.
     * @param _placementsObj - The scene data.
     */
    initScene(_placementsObj: SceneData): void;
    /**
     * Retrieves animation frames for all children of a template.
     * @param _templateName - The name of the template.
     * @returns A record mapping child instance names to their animation tracks.
     */
    getChildrenFrames(_templateName: string): Record<string, AnimTrackData[]>;
    /**
     * Returns the constructor registered for the given `AssetType` string.
     * @param value - An `AssetType` string key.
     * @returns The corresponding class constructor, or `null` if not registered.
     */
    static getAssetType(value: string): any;
    /**
     * Type-guard that checks whether `value` is a known `AssetType` key.
     * @param value - The string to test.
     * @returns `true` if `value` is a registered `AssetType`.
     */
    static isAssetType(value: string): value is AssetType;
    /**
     * Spawns a new container or timeline for a given template name.
     * @param tempName - The template name.
     * @returns The created container or timeline, or undefined if not found.
     */
    spawn(tempName: string): ZContainer | undefined;
    /**
     * Recursively collects all asset nodes from a given object.
     * @param o - The object to search.
     * @param allAssets - The accumulator for found assets.
     * @returns The map of all found assets.
     */
    getAllAssets(o: any, allAssets: any): any;
    /**
     * Converts degrees to radians.
     * @param degrees - The angle in degrees.
     * @returns The angle in radians.
     */
    degreesToRadians(degrees: number): number;
    /**
     * Recursively creates and adds child assets to a container based on template data.
     * @param mc - The parent container.
     * @param baseNode - The template data for the asset.
     */
    createAsset(mc: ZContainer, baseNode: TemplateData): Promise<void>;
    /**
     * Instantiates an asset described by `assetData` and adds it to a Spine slot container.
     * Supports container/animation asset types that reference a template in the scene data.
     * @param assetData - The asset descriptor (portrait/landscape `InstanceData`, typed as `BaseAssetData`).
     * @param slotContainer - The Spine slot `PIXI.Container` the child will be added to.
     */
    private addSlotAttachment;
    /**
     * Applies visual filters (such as drop shadow) to a PIXI container.
     * @param obj - The object containing filter data.
     * @param tf - The PIXI container to apply filters to.
     */
    applyFilters(obj: any, tf: PIXI.Container): void;
    /**
     * Loads a bitmap font from XML and creates a bitmap text object.
     * @param xmlUrl - The URL to the XML font data.
     * @param textToDisplay - The text to display.
     * @param fontName - The name of the font.
     * @param fontSize - The size of the font.
     * @param callback - Callback to invoke when the font is loaded.
     * @returns A promise that resolves when the font is loaded.
     */
    createBitmapTextFromXML(xmlUrl: string, textToDisplay: string, fontName: string, fontSize: number, callback: Function): Promise<null>;
    /**
     * Loads a texture from a given URL.
     * @param textureUrl - The URL of the texture.
     * @returns A promise that resolves to the loaded PIXI.Texture.
     */
    loadTexture(textureUrl: string): Promise<PIXI.Texture>;
}
//# sourceMappingURL=ZScene.d.ts.map