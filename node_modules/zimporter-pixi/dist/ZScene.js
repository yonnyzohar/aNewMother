import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import * as PIXI from "pixi.js";
import { ZButton } from "./ZButton";
import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
import { ZState } from "./ZState";
import { ZToggle } from "./ZToggle";
import { ZSlider } from "./ZSlider";
import { ZScroll } from "./ZScroll";
import { ZTextInput } from "./ZTextInput";
import { ZNineSlice } from "./ZNineSlice";
import { ZSpine } from "./ZSpine";
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
export class ZScene {
    static assetTypes = new Map([
        ["btn", ZButton],
        ["asset", ZContainer],
        ["state", ZState],
        ["toggle", ZToggle],
        ["slider", ZSlider],
        ["scrollBar", ZScroll],
        ["fullScreen", ZContainer],
        ["animation", ZTimeline]
    ]);
    //the base path for assets used in the scene, set during loading.
    assetBasePath = "";
    /**
     * The loaded PIXI spritesheet for the scene, or null if not loaded.
     */
    scene = null;
    /**
     * The root container for all scene display objects.
     */
    _sceneStage = new ZContainer();
    /**
     * The data describing the scene's structure, assets, and templates.
     */
    data;
    /**
     * A map of containers that should be resized when the scene resizes.
     */
    resizeMap = new Map();
    /**
     * Static map of all instantiated scenes by their ID.
     */
    static Map = new Map();
    /**
     * The unique identifier for this scene.
     */
    sceneId;
    /**
     * The current orientation of the scene ("landscape" or "portrait").
     */
    orientation = "portrait";
    /**
     * The current stage of the scene, used for managing scene transitions.
     */
    sceneName = null;
    /** Returns the root `ZContainer` that all scene display objects are added to. */
    get sceneStage() {
        return this._sceneStage;
    }
    /**
     * Constructs a new ZScene instance.
     * @param _sceneId - The unique identifier for the scene.
     */
    constructor(_sceneId) {
        this.sceneId = _sceneId;
        this.setOrientation();
        ZScene.Map.set(_sceneId, this);
    }
    /**
     * Sets the orientation property based on the current window dimensions.
     */
    setOrientation() {
        this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    }
    /**
     * Retrieves a scene instance by its ID.
     * @param sceneId - The ID of the scene to retrieve.
     * @returns The ZScene instance, or undefined if not found.
     */
    static getSceneById(sceneId) {
        return ZScene.Map.get(sceneId);
    }
    /**
     * Loads and initializes the scene's stage, adding its children to the global stage.
     * @param globalStage - The main PIXI.Container to which the scene will be added.
     */
    loadStage(globalStage, loadChildren = true) {
        this.resize(window.innerWidth, window.innerHeight);
        let stageAssets = this.data.stage;
        let children = stageAssets.children;
        if (children && loadChildren) {
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child.guide)
                    continue; //guides are not rendered
                let tempName = child.name;
                let mc = this.spawn(tempName);
                if (mc) {
                    mc.setInstanceData(child, this.orientation);
                    this.addToResizeMap(mc);
                    this._sceneStage.addChild(mc);
                    this._sceneStage[mc.name] = mc;
                }
            }
        }
        globalStage.addChild(this._sceneStage);
        this.resize(window.innerWidth, window.innerHeight);
    }
    /**
     * Adds a container to the resize map, so it will be resized with the scene.
     * @param mc - The container to add.
     */
    addToResizeMap(mc) {
        this.resizeMap.set(mc, true);
    }
    /**
     * Removes a container from the resize map.
     * @param mc - The container to remove.
     */
    removeFromResizeMap(mc) {
        this.resizeMap.delete(mc);
    }
    /**
     * Returns the logical (un-scaled) inner dimensions of the scene, swapping
     * width and height when in portrait orientation.
     * @returns An object with `width` and `height` in scene units.
     */
    getInnerDimensions() {
        if (this.data && this.data.resolution) {
        }
        let baseWidth = this.data.resolution.x;
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            baseWidth = this.data.resolution.y;
            baseHeight = this.data.resolution.x;
        }
        return { width: baseWidth, height: baseHeight };
    }
    /**
     * Resizes the scene and all registered containers to fit the given dimensions.
     * @param width - The new width.
     * @param height - The new height.
     */
    resize(width, height) {
        if (this.data && this.data.resolution) {
            this.setOrientation();
            let baseWidth = this.data.resolution.x;
            let baseHeight = this.data.resolution.y;
            if (this.orientation === "portrait") {
                baseWidth = this.data.resolution.y;
                baseHeight = this.data.resolution.x;
            }
            const scaleX = width / baseWidth;
            const scaleY = height / baseHeight;
            const scale = Math.min(scaleX, scaleY); // uniform scale to fit
            //console.log("resize", width, height, baseWidth, baseHeight, scaleX, scaleY, scale);
            this._sceneStage.scale.x = scale;
            this._sceneStage.scale.y = scale;
            // Center the stage
            this._sceneStage.x = (width - baseWidth * scale) / 2;
            this._sceneStage.y = (height - baseHeight * scale) / 2;
            for (const [mc, _] of this.resizeMap) {
                mc.resize(width, height, this.orientation);
            }
        }
    }
    /** The logical width of the scene in scene units for the current orientation. */
    get sceneWidth() {
        let baseWidth = this.data.resolution.x;
        if (this.orientation === "portrait") {
            baseWidth = this.data.resolution.y;
        }
        return baseWidth;
    }
    /** The logical height of the scene in scene units for the current orientation. */
    get sceneHeight() {
        let baseHeight = this.data.resolution.y;
        if (this.orientation === "portrait") {
            baseHeight = this.data.resolution.x;
        }
        return baseHeight;
    }
    /**
     * Loads the scene's placement and asset data asynchronously.
     * @param assetBasePath - The base path for assets.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     */
    async load(assetBasePath, _loadCompleteFnctn, _updateProgressFnctn) {
        this.assetBasePath = assetBasePath;
        let placementsUrl = assetBasePath + "placements.json?rnd=" + Math.random();
        fetch(placementsUrl)
            .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
            .then((placemenisObj) => {
            this.loadAssets(assetBasePath, placemenisObj, _loadCompleteFnctn, _updateProgressFnctn);
        })
            .catch((error) => {
            //errorCallback(error);
        });
    }
    /**
     * Destroys the scene and its assets, freeing resources.
     */
    async destroy() {
        const spritesheet = this.scene;
        if (spritesheet) {
            // Ensure spritesheet is fully parsed before attempting to destroy
            await spritesheet.parse();
            // Destroy individual textures
            for (const textureName in spritesheet.textures) {
                spritesheet.textures[textureName].destroy();
            }
            spritesheet.baseTexture?.destroy();
        }
        // Now unload the asset from the asset manager
        await PIXI.Assets.unload(this.sceneName);
    }
    /**
     * Loads the scene's assets and fonts, then initializes the scene.
     * @param assetBasePath - The base path for assets.
     * @param placemenisObj - The placements object describing the scene.
     * @param _loadCompleteFnctn - Callback function to invoke when loading is complete.
     * @param _updateProgressFnctn - Optional callback function to update loading progress.
     */
    async loadAssets(assetBasePath, placemenisObj, _loadCompleteFnctn, _updateProgressFnctn) {
        let _jsonPath = assetBasePath + "ta.json?rnd=" + Math.random();
        let isAtlas = placemenisObj.atlas;
        if (isAtlas === null || isAtlas === undefined) {
            isAtlas = true; //default to true for backward compatibility
        }
        if (isAtlas) {
            try {
                this.scene = await PIXI.Assets.load(_jsonPath, _updateProgressFnctn);
            }
            catch (err) {
                console.error("Error loading spritesheet:", err);
            }
        }
        else {
            let imagesObj = this.createImagesObject(assetBasePath, placemenisObj);
            // handle the missing file gracefully here
            this.scene = await PIXI.Assets.load(imagesObj, _updateProgressFnctn);
            this.scene.textures = this.scene; //ugly hack
        }
        this.sceneName = _jsonPath;
        if (placemenisObj.fonts.length == 0) {
            this.initScene(placemenisObj);
            _loadCompleteFnctn();
            return;
        }
        for (let i = 0; i < placemenisObj.fonts.length; i++) {
            let fontName = placemenisObj.fonts[i];
            let fntUrl = assetBasePath + "bitmapFonts/" + fontName + ".fnt";
            let pngUrl = assetBasePath + "bitmapFonts/" + fontName + ".png";
            // Fetch the .fnt file as XML string
            let xmlString;
            try {
                const response = await fetch(fntUrl);
                if (!response.ok)
                    throw new Error(`Failed to fetch font XML: ${response.statusText}`);
                xmlString = await response.text();
            }
            catch (err) {
                console.error("Error fetching font XML:", err);
                continue;
            }
            // Load the .png as a PIXI.Texture
            let texture;
            try {
                texture = await PIXI.Assets.load(pngUrl);
            }
            catch (err) {
                console.error("Error loading font texture:", err);
                continue;
            }
            // Manually install font if not registered
            if (!PIXI.BitmapFont.available[fontName]) {
                try {
                    PIXI.BitmapFont.install(xmlString, texture);
                }
                catch (err) {
                    console.error("Error installing bitmap font:", err);
                }
            }
            if (i === placemenisObj.fonts.length - 1) {
                this.initScene(placemenisObj);
                _loadCompleteFnctn();
            }
        }
    }
    /**
     * Creates a PIXI.Sprite for a given frame name from the loaded spritesheet.
     * @param itemName - The name of the frame.
     * @returns The created sprite, or null if not found.
     */
    createFrame(itemName) {
        ////console.log(itemName);
        let img = new PIXI.Sprite(this.scene.textures[itemName]);
        if (img === null) {
            //console.log("COULD NOT FIND " + itemName);
        }
        return img;
    }
    /**
     * Builds the asset-load manifest (alias + src pairs) for scenes that use
     * individual image files instead of a sprite-sheet atlas.
     * @param assetBasePath - The base path prepended to each image file path.
     * @param obj - The scene data whose templates are scanned for `img` and `9slice` assets.
     * @returns An array of `{ alias, src }` objects suitable for `PIXI.Assets.load`.
     */
    createImagesObject(assetBasePath, obj) {
        let images = [];
        let record = {};
        let templates = obj.templates;
        for (let template in templates) {
            let children = templates[template].children;
            for (let child in children) {
                let childObj = children[child];
                if (childObj.type == "img" || childObj.type == "9slice") {
                    let imgData = childObj;
                    if (!record[imgData.name]) {
                        record[imgData.name] = true;
                        let texName = imgData.name.endsWith("_9S") ? imgData.name.slice(0, -3) : imgData.name;
                        texName = texName.endsWith("_IMG") ? texName.slice(0, -4) : texName;
                        images.push({ alias: texName, src: assetBasePath + imgData.filePath });
                    }
                }
            }
        }
        return images;
    }
    /**
     * Gets the number of frames that match a given prefix in the spritesheet data.
     * @param _framePrefix - The prefix to search for.
     * @returns The number of matching frames.
     */
    getNumOfFrames(_framePrefix) {
        let num = 0;
        var a = this.scene.data;
        for (const k in a) {
            if (k.indexOf(_framePrefix) !== -1) {
                num++;
            }
        }
        return num;
    }
    /**
     * Creates an animated sprite (movie clip) from frames with a given prefix.
     * @param _framePrefix - The prefix for the frames.
     * @returns The created animated sprite.
     */
    createMovieClip(_framePrefix) {
        const frames = [];
        const numFrames = this.getNumOfFrames(_framePrefix);
        ////console.log(numFrames + " in " + _framePrefix);
        for (let i = 0; i < numFrames; i++) {
            const val = i < 10 ? "0" + i : i;
            const textureName = _framePrefix + "00" + val;
            frames.push(PIXI.Texture.from(textureName));
        }
        const mc = new PIXI.AnimatedSprite(frames);
        mc.animationSpeed = 1;
        mc.loop = false;
        mc.name = _framePrefix;
        return mc;
    }
    ////////////////////////////////---done loading scene--------//////////////
    /**
     * Initializes the scene with the given placements object.
     * @param _placementsObj - The scene data.
     */
    initScene(_placementsObj) {
        this.data = _placementsObj;
    }
    /**
     * Retrieves animation frames for all children of a template.
     * @param _templateName - The name of the template.
     * @returns A record mapping child instance names to their animation tracks.
     */
    //this gives the frames of all the children of a template
    //it combines the template name of the parent with the child name to get the frame
    getChildrenFrames(_templateName) {
        var frames = {};
        var templates = this.data.templates;
        var animTracks = this.data.animTracks;
        var baseNode = templates[_templateName];
        if (baseNode && baseNode.children) {
            for (var i = 0; i < baseNode.children.length; i++) {
                let childNode = baseNode.children[i];
                var childInstanceName = childNode.instanceName;
                var combinedName = childInstanceName + "_" + _templateName;
                //anim tracks are saved on the scene file via child name + template name to make sure it is uniquie
                //however when passed to the ZTimeline it is just the child name - because the ZTimeline will look for the child by name to set its timeline
                if (animTracks[combinedName]) {
                    frames[childInstanceName] = animTracks[combinedName];
                }
            }
        }
        return frames;
    }
    /**
     * Returns the constructor registered for the given `AssetType` string.
     * @param value - An `AssetType` string key.
     * @returns The corresponding class constructor, or `null` if not registered.
     */
    static getAssetType(value) {
        if (this.assetTypes.has(value)) {
            return this.assetTypes.get(value);
        }
        return null;
    }
    /**
     * Type-guard that checks whether `value` is a known `AssetType` key.
     * @param value - The string to test.
     * @returns `true` if `value` is a registered `AssetType`.
     */
    static isAssetType(value) {
        return this.assetTypes.has(value);
    }
    /**
     * Spawns a new container or timeline for a given template name.
     * @param tempName - The template name.
     * @returns The created container or timeline, or undefined if not found.
     */
    spawn(tempName) {
        var templates = this.data.templates;
        var baseNode = templates[tempName];
        if (!baseNode) {
            return;
        }
        var mc;
        var frames = this.getChildrenFrames(tempName);
        if (Object.keys(frames).length > 0) {
            mc = new ZTimeline();
            this.createAsset(mc, baseNode);
            mc.setFrames(frames);
            if (this.data.cuePoints && this.data.cuePoints[tempName]) {
                mc.setCuePoints(this.data.cuePoints[tempName]);
            }
            mc.gotoAndStop(0);
        }
        else {
            mc = new (ZScene.getAssetType(baseNode.type) || ZContainer)();
            this.createAsset(mc, baseNode);
            mc.init();
        }
        //mc.name = baseNode.instanceName;
        return mc;
    }
    /**
     * Recursively collects all asset nodes from a given object.
     * @param o - The object to search.
     * @param allAssets - The accumulator for found assets.
     * @returns The map of all found assets.
     */
    getAllAssets(o, allAssets) {
        for (const k in o) {
            if (k === "type" && o[k] === "asset") {
                allAssets[o["name"]] = o;
            }
            if (o[k] instanceof Object) {
                this.getAllAssets(o[k], allAssets);
            }
        }
        return allAssets;
    }
    /**
     * Converts degrees to radians.
     * @param degrees - The angle in degrees.
     * @returns The angle in radians.
     */
    degreesToRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
    /**
     * Recursively creates and adds child assets to a container based on template data.
     * @param mc - The parent container.
     * @param baseNode - The template data for the asset.
     */
    async createAsset(mc, baseNode) {
        // //console.log(baseNode.name);
        for (var i = 0; i < baseNode.children.length; i++) {
            var childNode = baseNode.children[i];
            ////console.log(child);
            var _name = childNode.name;
            var type = childNode.type;
            var asset;
            if (type == "inputField") {
                let inputData = childNode;
                asset = new ZTextInput(inputData);
                asset.name = _name;
                mc[_name] = asset;
                mc.addChild(asset);
                //asset.setInstanceData(inputData, this.orientation);
                this.applyFilters(childNode, asset);
            }
            if (type == "bitmapFontLocked") {
                let textInstanceNode = childNode;
                if (textInstanceNode.fontName && PIXI.BitmapFont.available[textInstanceNode.fontName]) {
                    const tf = new PIXI.BitmapText(textInstanceNode.text || "", {
                        fontName: textInstanceNode.fontName, // This must match the "face" attribute in the .fnt file
                        align: textInstanceNode.align || "left" // Text alignment: "left", "center", or "right"
                    });
                    if (textInstanceNode.textAnchorX !== undefined && textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined && textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    if (textInstanceNode.x !== undefined)
                        tf.x = textInstanceNode.x;
                    if (textInstanceNode.y !== undefined)
                        tf.y = textInstanceNode.y;
                    this.applyFilters(childNode, tf);
                }
            }
            if (type == "bitmapText" || type == "textField") {
                let textInstanceNode = childNode;
                if (textInstanceNode.uniqueFontName && PIXI.BitmapFont.available[textInstanceNode.uniqueFontName]) {
                    const tf = new PIXI.BitmapText(textInstanceNode.text || "", {
                        fontName: textInstanceNode.uniqueFontName, // This must match the "face" attribute in the .fnt file
                        fontSize: textInstanceNode.size, // Adjust as needed,
                        letterSpacing: textInstanceNode.letterSpacing || 0, // Adjust the letter spacing between characters
                        align: textInstanceNode.align || "left" // Text alignment: "left", "center", or "right"
                    });
                    if (textInstanceNode.textAnchorX !== undefined && textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined && textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    tf.x = textInstanceNode.x;
                    tf.y = textInstanceNode.y;
                    this.applyFilters(childNode, tf);
                }
                else {
                    //if ()
                    let style = {
                        fontFamily: textInstanceNode.fontName,
                        fontSize: textInstanceNode.size,
                        align: "center",
                    };
                    if (textInstanceNode.size) {
                        style.fontSize = textInstanceNode.size;
                    }
                    if (textInstanceNode.color || textInstanceNode.fillType == "solid") {
                        style.fill = textInstanceNode.color;
                    }
                    if (textInstanceNode.fillType == "gradient" && textInstanceNode.gradientData) {
                        style.fill = [textInstanceNode.gradientData.colors[0], textInstanceNode.gradientData.colors[1]];
                        style.fillGradientStops = [textInstanceNode.gradientData.percentages[0], textInstanceNode.gradientData.percentages[1]];
                    }
                    if (textInstanceNode.align) {
                        style.align = textInstanceNode.align;
                    }
                    if (textInstanceNode.stroke) {
                        style.stroke = textInstanceNode.stroke;
                    }
                    if (textInstanceNode.strokeThickness) {
                        style.strokeThickness = textInstanceNode.strokeThickness;
                    }
                    if (textInstanceNode.wordWrap) {
                        style.wordWrap = textInstanceNode.wordWrap;
                    }
                    if (textInstanceNode.wordWrapWidth) {
                        style.wordWrapWidth = textInstanceNode.wordWrapWidth;
                    }
                    if (textInstanceNode.breakWords) {
                        style.breakWords = textInstanceNode.breakWords;
                    }
                    if (textInstanceNode.leading) {
                        style.leading = textInstanceNode.leading;
                    }
                    if (textInstanceNode.letterSpacing) {
                        style.letterSpacing = textInstanceNode.letterSpacing;
                    }
                    if (textInstanceNode.padding) {
                        style.padding = textInstanceNode.padding;
                    }
                    if (textInstanceNode.fontWeight) {
                        style.fontWeight = textInstanceNode.fontWeight;
                    }
                    if (textInstanceNode.dropShadow) {
                        style.dropShadow = textInstanceNode.dropShadow;
                        style.dropShadowAngle = textInstanceNode.dropShadowAngle;
                        style.dropShadowBlur = textInstanceNode.dropShadowBlur;
                        style.dropShadowColor = textInstanceNode.dropShadowColor;
                        style.dropShadowDistance = textInstanceNode.dropShadowDistance;
                    }
                    const tf = new PIXI.Text(textInstanceNode.text + "", style);
                    if (textInstanceNode.textAnchorX !== undefined && textInstanceNode.textAnchorY !== undefined) {
                        tf.anchor.set(textInstanceNode.textAnchorX, textInstanceNode.textAnchorY);
                    }
                    if (textInstanceNode.pivotX !== undefined && textInstanceNode.pivotY !== undefined) {
                        tf.pivot.set(textInstanceNode.pivotX, textInstanceNode.pivotY);
                    }
                    tf.name = _name;
                    tf.x = textInstanceNode.x;
                    tf.y = textInstanceNode.y;
                    mc[_name] = tf;
                    mc.addChild(tf);
                    this.applyFilters(childNode, tf);
                }
            }
            if (type == "img") {
                let spriteData = childNode;
                let _w = (spriteData.width);
                let _h = (spriteData.height);
                let _x = spriteData.x || 0;
                let _y = spriteData.y || 0;
                let pivotX = spriteData.pivotX || 0;
                let pivotY = spriteData.pivotY || 0;
                var texName = _name;
                texName = texName.endsWith("_IMG") ? texName.slice(0, -4) : texName;
                var img = this.createFrame(texName);
                if (!img) {
                    return;
                }
                img.name = _name;
                mc[texName] = img;
                mc.addChild(img);
                img.x = _x;
                img.y = _y;
                img.width = _w;
                img.height = _h;
                img.pivot.set(pivotX, pivotY);
            }
            if (type == "9slice") {
                let nineSliceData = childNode;
                let _w = (nineSliceData.width);
                let _h = (nineSliceData.height);
                let _x = nineSliceData.x || 0;
                let _y = nineSliceData.y || 0;
                let pivotX = nineSliceData.pivotX || 0;
                let pivotY = nineSliceData.pivotY || 0;
                let texName = _name;
                texName = texName.endsWith("_9S") ? texName.slice(0, -3) : texName;
                var nineSlice = new ZNineSlice(this.scene.textures[texName], nineSliceData, this.orientation);
                if (!nineSlice) {
                    return;
                }
                nineSlice.name = _name;
                mc[texName] = nineSlice;
                mc.addChild(nineSlice);
                this.addToResizeMap(nineSlice);
                nineSlice.x = _x;
                nineSlice.y = _y;
                nineSlice.pivot.set(pivotX, pivotY);
            }
            if (ZScene.isAssetType(type)) {
                var instanceData = childNode;
                if (instanceData.guide)
                    continue; //guides are not rendered
                //this will tell me fi this asses template has children with frames
                var frames = this.getChildrenFrames(childNode.name);
                if (Object.keys(frames).length > 0) {
                    asset = new ZTimeline();
                    asset.setFrames(frames);
                    if (this.data.cuePoints && this.data.cuePoints[childNode.name]) {
                        asset.setCuePoints(this.data.cuePoints[childNode.name]);
                    }
                }
                else {
                    asset = new (ZScene.getAssetType(type) || ZContainer)();
                }
                //console.log("creation", instanceData.instanceName); // Should print "ZTimeline"
                //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
                //console.log("instanceof", asset instanceof ZTimeline);
                asset.name = instanceData.instanceName;
                if (!asset.name) {
                    return;
                }
                mc[asset.name] = asset;
                this.applyFilters(childNode, asset);
                asset.setInstanceData(instanceData, this.orientation);
                mc.addChild(asset);
                this.addToResizeMap(asset);
                //console.log("after addition", instanceData.instanceName); // Should print "ZTimeline"
                //console.log("constructor", asset.constructor.name); // Should print "ZTimeline"
                //console.log("instanceof", asset instanceof ZTimeline);
            }
            if (type == "particle") {
                let assetBasePath = this.assetBasePath;
                if (!assetBasePath.endsWith("/")) {
                    assetBasePath += "/";
                }
                let particleData = childNode;
                let jsonPath = assetBasePath + particleData.jsonPath + `?t=${Date.now()}`;
                let pngPaths = assetBasePath + particleData.pngPaths + `?t=${Date.now()}`;
                PIXI.Assets.load(pngPaths)
                    .then((texture) => {
                    PIXI.Assets.load(jsonPath)
                        .then((particleData) => {
                        mc.loadParticle(particleData, texture, particleData.name);
                    })
                        .catch((err) => {
                        console.error("Failed to load particle data:", err);
                    });
                });
            }
            if (type == "spine") {
                let assetBasePath = this.assetBasePath;
                if (!assetBasePath.endsWith("/")) {
                    assetBasePath += "/";
                }
                let spineData = childNode;
                let zSpine = new ZSpine(spineData, assetBasePath);
                zSpine.load((spine) => {
                    if (spine) {
                        mc.addChild(spine);
                        if (spineData.slotAttachments && spineData.slotAttachments.length > 0) {
                            for (const attachment of spineData.slotAttachments) {
                                const slotIndex = spine.skeleton.findSlotIndex(attachment.slotName);
                                if (slotIndex < 0)
                                    continue;
                                const slotContainer = spine.slotContainers[slotIndex];
                                if (!slotContainer)
                                    continue;
                                this.addSlotAttachment(attachment.assetData, slotContainer);
                            }
                        }
                    }
                });
            }
            var templates = this.data.templates;
            var childTempObj = templates[childNode.name];
            if (childTempObj && childTempObj.children) {
                if (asset) {
                    this.createAsset(asset, childTempObj);
                }
                else {
                    this.createAsset(mc, childTempObj);
                }
            }
            asset?.init();
        }
    }
    /**
     * Instantiates an asset described by `assetData` and adds it to a Spine slot container.
     * Supports container/animation asset types that reference a template in the scene data.
     * @param assetData - The asset descriptor (portrait/landscape `InstanceData`, typed as `BaseAssetData`).
     * @param slotContainer - The Spine slot `PIXI.Container` the child will be added to.
     */
    addSlotAttachment(assetData, slotContainer) {
        if (ZScene.isAssetType(assetData.type)) {
            const instanceData = assetData;
            const child = this.spawn(instanceData.name);
            if (child) {
                child.name = instanceData.instanceName;
                child.setInstanceData(instanceData, this.orientation);
                slotContainer.addChild(child);
            }
        }
    }
    /**
     * Applies visual filters (such as drop shadow) to a PIXI container.
     * @param obj - The object containing filter data.
     * @param tf - The PIXI container to apply filters to.
     */
    applyFilters(obj, tf) {
        if (obj.filters) {
            for (var k in obj.filters) {
                let filter = obj.filters[k];
                if (filter.type == "dropShadow") {
                    let dropShadowFilter = new DropShadowFilter();
                    dropShadowFilter.alpha = filter.alpha;
                    dropShadowFilter.blur = filter.blur;
                    dropShadowFilter.color = filter.color;
                    dropShadowFilter.distance = filter.distance;
                    dropShadowFilter.resolution = filter.resolution;
                    dropShadowFilter.rotation = filter.rotation;
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(dropShadowFilter);
                }
                if (filter.type === "blur") {
                    let blurFilter = new PIXI.BlurFilter();
                    blurFilter.blur = filter.blur;
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(blurFilter);
                }
                if (filter.type === "colorMatrix") {
                    let colorMatrixFilter = new PIXI.ColorMatrixFilter();
                    if (filter.matrix) {
                        colorMatrixFilter.matrix = filter.matrix;
                    }
                    if (!tf.filters) {
                        tf.filters = [];
                    }
                    tf.filters.push(colorMatrixFilter);
                }
            }
        }
    }
    /**
     * Loads a bitmap font from XML and creates a bitmap text object.
     * @param xmlUrl - The URL to the XML font data.
     * @param textToDisplay - The text to display.
     * @param fontName - The name of the font.
     * @param fontSize - The size of the font.
     * @param callback - Callback to invoke when the font is loaded.
     * @returns A promise that resolves when the font is loaded.
     */
    async createBitmapTextFromXML(xmlUrl, textToDisplay, fontName, fontSize, callback) {
        // Load the texture atlas referenced in your XML
        const response = await fetch(xmlUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch XML font data: ${response.statusText}`);
        }
        const xmlData = await response.text();
        //grab the ta file name
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, "text/xml");
        // Extract the page.file attribute from the XML
        const pageElement = xmlDoc.querySelector("page");
        if (!pageElement) {
            throw new Error("Page element not found in XML");
        }
        const fileAttribute = pageElement.getAttribute("file");
        if (!fileAttribute) {
            throw new Error("Page file attribute not found in XML");
        }
        var textureUrl = "./../assets/" + fileAttribute;
        this.loadTexture(textureUrl)
            .then((texture) => {
            PIXI.BitmapFont.install(xmlDoc, texture);
            if (PIXI.BitmapFont.available[fontName]) {
                callback();
            }
        })
            .catch((error) => {
            console.error("Error loading texture:", error);
        });
        return null;
    }
    /**
     * Loads a texture from a given URL.
     * @param textureUrl - The URL of the texture.
     * @returns A promise that resolves to the loaded PIXI.Texture.
     */
    loadTexture(textureUrl) {
        return new Promise((resolve, reject) => {
            const texture = PIXI.Texture.from(textureUrl);
            // Listen for the "update" event to check when the texture is fully loaded
            texture.on("update", () => {
                if (texture.valid) {
                    resolve(texture); // Resolve the promise when the texture is ready
                }
                else {
                    reject(new Error("Failed to load texture."));
                }
            });
        });
    }
}
//# sourceMappingURL=ZScene.js.map