import * as PIXI from 'pixi.js';
import { Emitter } from "@pixi/particle-emitter";
import { ZNineSlice } from './ZNineSlice';
import TextInput from './text-input';
import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
/**
 * A custom container class extending `PIXI.Container` that supports orientation-based transforms,
 * anchoring, and instance data management for responsive layouts.
 *
 * @remarks
 * - Handles portrait and landscape orientation transforms.
 * - Supports anchoring to screen percentage positions.
 * - Synchronizes transform properties with an internal `OrientationData` object.
 *
 * @property portrait - Transform data for portrait orientation.
 * @property landscape - Transform data for landscape orientation.
 * @property currentTransform - The currently active transform data.
 * @property name - The instance name of the container.
 *
 * @method setState
 * Sets the state of the container by name. (Implementation placeholder)
 * @param stateName - The name of the state to set.
 *
 * @method init
 * Called once all children of the container are loaded. (Implementation placeholder)
 *
 * @method setInstanceData
 * Sets the instance data and orientation for the container, applying the corresponding transform.
 * @param data - The instance data containing orientation transforms and name.
 * @param orientation - The orientation to use ("portrait" or "landscape").
 *
 * @method resize
 * Updates the container's transform based on new width, height, and orientation.
 * @param width - The new width of the container.
 * @param height - The new height of the container.
 * @param orientation - The new orientation ("portrait" or "landscape").
 *
 * @method applyAnchor
 * Applies anchoring based on the current transform's anchor settings, positioning the container
 * relative to the screen size.
 *
 * @method isAnchored
 * Checks if the current transform is anchored.
 * @returns `true` if anchored, otherwise `false`.
 *
 * @method set x
 * Sets the x position and updates the current transform.
 * @param value - The new x position.
 *
 * @method set y
 * Sets the y position and updates the current transform.
 * @param value - The new y position.
 *
 * @method set rotation
 * Sets the rotation and updates the current transform.
 * @param value - The new rotation value.
 *
 * @method set scaleX
 * Sets the x scale and updates the current transform.
 * @param value - The new x scale.
 *
 * @method set scaleY
 * Sets the y scale and updates the current transform.
 * @param value - The new y scale.
 *
 * @method set pivotX
 * Sets the x pivot and updates the current transform.
 * @param value - The new x pivot.
 *
 * @method set pivotY
 * Sets the y pivot and updates the current transform.
 * @param value - The new y pivot.
 */
export class ZContainer extends PIXI.Container {
    portrait;
    landscape;
    currentTransform;
    resizeable = true;
    name = "";
    _fitToScreen = false;
    emitter;
    originalTextWidth;
    originalTextHeight;
    originalFontSize;
    fixedBoxSize;
    _props;
    /**
     * Performs a breadth-first search and returns the first descendant `ZContainer` with the given name.
     * @param childName - The `name` to search for.
     * @returns The first matching `ZContainer`, or `null` if not found.
     */
    get(childName) {
        const queue = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName) {
                return current;
            }
            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child instanceof ZContainer) {
                        queue.push(child);
                    }
                }
            }
        }
        return null;
    }
    /**
     * Performs a breadth-first search and returns all descendant `ZContainer` instances with the given name.
     * @param childName - The `name` to search for.
     * @returns An array of all matching `ZContainer` instances (may be empty).
     */
    getAll(childName) {
        const queue = [];
        const result = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child instanceof ZContainer) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.name === childName) {
                result.push(current);
            }
            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child instanceof ZContainer) {
                        queue.push(child);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Called once all children of the container are loaded.
     * Captures the original text-field dimensions and font size so they can be
     * restored when `setText` is called later.
     */
    init() {
        let tf = this.getTextField();
        if (tf) {
            if (tf instanceof TextInput || tf instanceof PIXI.BitmapText || !tf.style) {
                return;
            }
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }
    /**
     * Returns a string identifier for the class type.
     * @returns `"ZContainer"`
     */
    getType() {
        return "ZContainer";
    }
    /**
     * Enables or disables fixed-box-size mode. When enabled, `setText` will
     * shrink the font size to keep the text within the original measured bounds.
     * @param value - `true` to enable fixed-box mode, `false` to disable.
     */
    setFixedBoxSize(value) {
        this.fixedBoxSize = value;
    }
    /**
     * Performs a breadth-first search and returns all descendants that report
     * the given type string via their `getType()` method.
     * @param type - The type string to match (e.g. `"ZButton"`, `"ZToggle"`).
     * @returns An array of matching `ZContainer` descendants.
     */
    getAllOfType(type) {
        const queue = [];
        const result = [];
        if (this.children && this.children.length > 0) {
            for (let child of this.children) {
                if (child.getType) {
                    queue.push(child);
                }
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            let _t = current.getType();
            if (_t === type) {
                result.push(current);
            }
            if (current.children && current.children.length > 0) {
                for (let child of current.children) {
                    if (child.getType) {
                        queue.push(child);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Sets the text content of the first text-field child (named `"label"` or
     * the first `PIXI.Text` / `TextInput` found). If fixed-box-size mode is on,
     * the font size will be reduced until the text fits within the original bounds.
     * @param text - The string to display.
     */
    setText(text) {
        let textChild = this.getTextField();
        if (textChild) {
            if (textChild instanceof PIXI.Text) {
                textChild.resolution = 2;
            }
            textChild.text = text;
            if (textChild instanceof TextInput) {
                return;
            }
            let style = textChild.style;
            if (style) {
                style.fontSize = this.originalFontSize ?? style.fontSize;
                textChild.style = style;
                this.resizeText(textChild);
            }
        }
    }
    /**
     * Merges additional style properties onto the text-field's existing style
     * and re-runs the resize logic to keep the text within bounds.
     * @param data - Partial `PIXI.TextStyle` properties to merge.
     */
    setTextStyle(data) {
        let tf = this.getTextField();
        if (tf) {
            if (tf instanceof TextInput || tf instanceof PIXI.BitmapText || !tf.style) {
                return;
            }
            tf.style = { ...tf.style, ...data };
            this.resizeText(tf);
        }
    }
    /**
     * Returns the raw instance-data props object that was set via `setInstanceData`.
     * @returns The stored `_props` object, or `undefined` if not yet set.
     */
    getProps() {
        return this._props;
    }
    /**
     * Shrinks the font size of `textChild` until both its width and height fit
     * within `originalTextWidth` / `originalTextHeight` (only active when
     * `fixedBoxSize` is `true`).
     * @param textChild - The `PIXI.Text` whose style will be adjusted.
     */
    resizeText(textChild) {
        if (this.fixedBoxSize) {
            let style = textChild.style;
            let maxWidth = this.originalTextWidth;
            let maxHeight = this.originalTextHeight;
            if ((maxWidth !== undefined && maxWidth > 0) || (maxHeight !== undefined && maxHeight > 0)) {
                while ((maxWidth !== undefined && textChild.width > maxWidth) ||
                    (maxHeight !== undefined && textChild.height > maxHeight)) {
                    style = new PIXI.TextStyle({
                        ...style,
                        fontSize: style.fontSize - 1,
                    });
                    textChild.style = style;
                }
            }
        }
    }
    /**
     * Finds and returns the first text-field child. Prefers a child named
     * `"label"`, then falls back to the first `PIXI.Text` or `TextInput` found
     * among direct children.
     * @returns The text field, or `null` if none exists.
     */
    getTextField() {
        let textChild = this.getChildByName("label");
        if (!textChild) {
            let children = this.children;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child instanceof PIXI.Text || child instanceof TextInput) {
                    textChild = child;
                    break;
                }
            }
        }
        return textChild;
    }
    /**
     * Applies scene-editor instance data to this container: stores portrait /
     * landscape transforms, sets the active orientation, applies the resulting
     * transform, and captures original text dimensions.
     * @param data - The `InstanceData` exported from the scene editor.
     * @param orientation - `"portrait"` or `"landscape"`.
     */
    setInstanceData(data, orientation) {
        this.portrait = data.portrait;
        this.landscape = data.landscape;
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
        this.name = data.instanceName || "";
        this._props = data;
        if (data.attrs) {
            if (data.attrs.fitToScreen !== undefined) {
                this.fitToScreen = data.attrs.fitToScreen;
            }
        }
        // Text field original size setup
        let tf = this.getTextField();
        if (tf && tf instanceof PIXI.Text) {
            this.setFixedBoxSize(false);
            this.originalTextWidth = tf.width;
            this.originalTextHeight = tf.height;
            this.originalFontSize = typeof tf.style.fontSize === 'number'
                ? tf.style.fontSize
                : tf.style.fontSize !== undefined
                    ? parseFloat(tf.style.fontSize)
                    : undefined;
        }
    }
    /**
     * When set to `true`, stretches this container to fill the entire screen
     * on the next `applyTransform` call.
     * @param value - `true` to enable fit-to-screen mode.
     */
    set fitToScreen(value) {
        this._fitToScreen = value;
        if (value) {
            this.executeFitToScreen();
        }
        else {
            this.applyTransform();
        }
    }
    /** Returns `true` if fit-to-screen mode is currently active. */
    get fitToScreen() {
        return this._fitToScreen;
    }
    /**
     * Reads `currentTransform` (or delegates to `executeFitToScreen`) and
     * writes position, scale, rotation, pivot, alpha, and visibility onto
     * this container. Skips the update while a parent `ZTimeline` is playing.
     */
    applyTransform() {
        if (this._fitToScreen) // if fitToScreen is true, do not apply transform
         {
            this.executeFitToScreen();
            return;
        }
        if (!this.currentTransform)
            return;
        if (!this.resizeable)
            return;
        if (this.parent) {
            let currentFrame = this.parent.currentFrame;
            if (currentFrame !== undefined && currentFrame > 0) {
                return; // do not apply transform if parent timeline is playing
            }
        }
        this.x = this.currentTransform.x || 0;
        this.y = this.currentTransform.y || 0;
        this.rotation = this.currentTransform.rotation || 0;
        this.alpha = this.currentTransform.alpha;
        this.scale.x = this.currentTransform.scaleX || 1;
        this.scale.y = this.currentTransform.scaleY || 1;
        this.pivot.x = this.currentTransform.pivotX || 0;
        this.pivot.y = this.currentTransform.pivotY || 0;
        this.visible = this.currentTransform.visible !== false; // default to true if not specified
        // Apply Flash skew: skewY is Flash's X-axis angle (PIXI skew.y = skewY - rotation).
        // Flash skewX is the Y-axis angle (PIXI skew.x = rotation - skewX).
        if (this.currentTransform.skewY !== undefined) {
            this.skew.y = this.currentTransform.skewY - this.rotation;
        }
        else {
            this.skew.y = 0;
        }
        if (this.currentTransform.skewX !== undefined) {
            this.skew.x = this.rotation - this.currentTransform.skewX;
        }
        else {
            this.skew.x = 0;
        }
        this.applyAnchor();
    }
    /**
     * Switches the active orientation data and re-applies the transform.
     * Called by the scene or parent when the viewport size changes.
     * @param width - The new viewport width (unused directly; stored by parent).
     * @param height - The new viewport height (unused directly; stored by parent).
     * @param orientation - The new orientation: `"portrait"` or `"landscape"`.
     */
    resize(width, height, orientation) {
        this.currentTransform = orientation === "portrait" ? this.portrait : this.landscape;
        this.applyTransform();
    }
    /**
     * Stretches this container (or its first `ZNineSlice` child) to cover the
     * full browser viewport. Assumes the asset pivot is at the top-left.
     * In landscape mode scales by width; in portrait mode scales by height.
     */
    executeFitToScreen() {
        let children = this.children;
        if (children.length === 0)
            return;
        if (this.parent) {
            this.pivotX = 0;
            this.pivotY = 0;
            let pos = this.parent.toLocal(new PIXI.Point(0, 0));
            this.x = pos.x;
            this.y = pos.y;
            if (children[0] instanceof ZNineSlice) {
                let nineSlice = children[0];
                let btmPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, window.innerHeight));
                nineSlice.width = btmPoint.x - pos.x;
                nineSlice.height = btmPoint.y - pos.y;
            }
            else {
                if (window.innerWidth > window.innerHeight) {
                    let rightPoint = this.parent.toLocal(new PIXI.Point(window.innerWidth, 0));
                    this.width = rightPoint.x - pos.x;
                    this.scaleY = this.scaleX;
                }
                else {
                    let btmPoint = this.parent.toLocal(new PIXI.Point(0, window.innerHeight));
                    this.height = btmPoint.y - pos.y;
                    this.scaleX = this.scaleY;
                }
                let midScreen = this.parent.toLocal(new PIXI.Point(window.innerWidth / 2, window.innerHeight / 2));
                this.x = midScreen.x - this.width / 2;
                this.y = midScreen.y - this.height / 2;
            }
        }
    }
    /**
     * Positions the container at a screen-percentage anchor point when
     * `currentTransform.isAnchored` is `true`. Converts the percentage
     * coordinates to local space relative to the parent.
     */
    applyAnchor() {
        if (this.currentTransform && this.currentTransform.isAnchored && this.parent) {
            let xPer = this.currentTransform.anchorPercentage.x || 0;
            let yPer = this.currentTransform.anchorPercentage.y || 0;
            let x = xPer * window.innerWidth;
            let y = yPer * window.innerHeight;
            const globalPoint = new PIXI.Point(x, y);
            const localPoint = this.parent.toLocal(globalPoint);
            this.x = localPoint.x;
            this.y = localPoint.y;
        }
    }
    /**
     * Returns whether this container is currently configured to use anchor-based positioning.
     * @returns `true` if the current transform has `isAnchored` set.
     */
    isAnchored() {
        return this.currentTransform && this.currentTransform.isAnchored || false;
    }
    /**
     * Sets the x position and mirrors the value into `currentTransform` so it
     * is preserved across orientation changes.
     */
    set x(value) {
        super.x = value;
        if (this.currentTransform) {
            this.currentTransform.x = value;
        }
    }
    /**
     * Sets the display width and mirrors the derived `scaleX` back into
     * `currentTransform`.
     */
    set width(value) {
        super.width = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = this.scale.x;
        }
    }
    get width() {
        return super.width;
    }
    get height() {
        return super.height;
    }
    /**
     * Sets the display height and mirrors the derived `scaleY` back into
     * `currentTransform`.
     */
    set height(value) {
        super.height = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = this.scale.y;
        }
    }
    /**
     * Sets the y position and mirrors the value into `currentTransform`.
     */
    set y(value) {
        super.y = value;
        if (this.currentTransform) {
            this.currentTransform.y = value;
        }
    }
    /**
     * Sets the rotation (in radians) and mirrors the value into `currentTransform`.
     */
    set rotation(value) {
        super.rotation = value;
        if (this.portrait)
            this.portrait.rotation = value;
        if (this.landscape)
            this.landscape.rotation = value;
    }
    get x() {
        return super.x;
    }
    get y() {
        return super.y;
    }
    get rotation() {
        return super.rotation;
    }
    get scaleX() {
        return super.scale.x;
    }
    get scaleY() {
        return super.scale.y;
    }
    get pivotX() {
        return super.pivot.x;
    }
    get pivotY() {
        return super.pivot.y;
    }
    /**
     * Sets the horizontal scale and mirrors the value into `currentTransform`.
     */
    set scaleX(value) {
        super.scale.x = value;
        if (this.currentTransform) {
            this.currentTransform.scaleX = value;
        }
    }
    /**
     * Sets the vertical scale and mirrors the value into `currentTransform`.
     */
    set scaleY(value) {
        super.scale.y = value;
        if (this.currentTransform) {
            this.currentTransform.scaleY = value;
        }
    }
    /**
     * Sets the horizontal pivot and mirrors the value into `currentTransform`.
     */
    set pivotX(value) {
        super.pivot.x = value;
        if (this.currentTransform) {
            this.currentTransform.pivotX = value;
        }
    }
    /**
     * Sets the vertical pivot and mirrors the value into `currentTransform`.
     */
    set pivotY(value) {
        super.pivot.y = value;
        if (this.currentTransform) {
            this.currentTransform.pivotY = value;
        }
    }
    /**
     * Sets the alpha (opacity) and mirrors the value into `currentTransform`.
     * @param value - Opacity in the range [0, 1].
     */
    setAlpha(value) {
        this.alpha = value;
        if (this.portrait)
            this.portrait.alpha = value;
        if (this.landscape)
            this.landscape.alpha = value;
    }
    /**
     * Returns the current alpha (opacity) value.
     * @returns Opacity in the range [0, 1].
     */
    getAlpha() {
        return this.alpha;
    }
    /**
     * Sets the visibility of this container and mirrors the value into `currentTransform`.
     * @param value - `true` to show, `false` to hide.
     */
    setVisible(value) {
        this.visible = value;
        if (this.portrait)
            this.portrait.visible = value;
        if (this.landscape)
            this.landscape.visible = value;
    }
    /**
     * Returns whether this container is currently visible.
     * @returns `true` if visible.
     */
    getVisible() {
        return this.visible;
    }
    /**
     * Returns the `PIXI.TextStyle` of this container's text field, or `null`
     * if no text field exists or it is a `TextInput`.
     * @returns The text style, or `null`.
     */
    getTextStyle() {
        const tf = this.getTextField();
        if (!tf || tf instanceof TextInput)
            return null;
        if (tf instanceof PIXI.Text)
            return tf.style;
        return null;
    }
    /**
     * Creates a shallow structural clone of this `ZContainer`, copying position,
     * pivot, scale, rotation, alpha, visibility, and name. Direct children are
     * cloned by type: `PIXI.Text`, `PIXI.BitmapText`, `PIXI.Sprite`,
     * `PIXI.NineSlicePlane`, and any object that exposes its own `clone()` method.
     * @returns A new `ZContainer` with cloned children.
     */
    clone() {
        const newContainer = new ZContainer();
        newContainer.name = this.name;
        newContainer.position.set(this.position.x, this.position.y);
        newContainer.pivot.set(this.pivot.x, this.pivot.y);
        newContainer.scale.set(this.scale.x, this.scale.y);
        newContainer.rotation = this.rotation;
        newContainer.alpha = this.alpha;
        newContainer.visible = this.visible;
        for (const child of this.children) {
            if (child instanceof PIXI.Text) {
                const c = new PIXI.Text(child.text, child.style);
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.addChild(c);
            }
            else if (child instanceof PIXI.BitmapText) {
                const c = new PIXI.BitmapText(child.text, { fontName: child.fontName, fontSize: child.fontSize });
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                newContainer.addChild(c);
            }
            else if (child instanceof PIXI.NineSlicePlane) {
                const c = new PIXI.NineSlicePlane(child.texture, child.leftWidth, child.topHeight, child.rightWidth, child.bottomHeight);
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.width = child.width;
                c.height = child.height;
                newContainer.addChild(c);
            }
            else if (child instanceof PIXI.Sprite) {
                const c = new PIXI.Sprite(child.texture);
                c.name = child.name;
                c.position.set(child.position.x, child.position.y);
                c.pivot.set(child.pivot.x, child.pivot.y);
                c.scale.set(child.scale.x, child.scale.y);
                c.rotation = child.rotation;
                c.alpha = child.alpha;
                c.anchor.set(child.anchor.x, child.anchor.y);
                newContainer.addChild(c);
            }
            else if (child.clone) {
                newContainer.addChild(child.clone());
            }
        }
        return newContainer;
    }
    /**
     * Initialises and starts a particle emitter on this container.
     * Injects `texture` into the `textureSingle` behavior of `emitterConfig`
     * before creating the `Emitter` instance.
     * @param emitterConfig - A PixiJS particle-emitter `behaviors`-based config object.
     * @param texture - The texture to use for individual particles.
     * @param name - An identifier for this particle effect (currently unused internally).
     */
    loadParticle(emitterConfig, texture, name) {
        try {
            emitterConfig.behaviors.find((b) => b.type === "textureSingle").config = {
                ...emitterConfig.behaviors.find((b) => b.type === "textureSingle").config,
                texture: texture
            };
            // Then pass it to the emitter:
            this.emitter = new Emitter(this, emitterConfig);
            this.playParticleAnim();
        }
        catch (error) {
            console.error("Error creating ParticleController:", error);
            alert("Failed to load particle effect. Please make sure you're using the new Pixi JSON format (with 'behaviors'). Legacy configs with 'alpha', 'scale', 'speed', etc. are no longer supported in the latest version of the particle system.");
            console.warn("⚠️ Particle config may be in legacy format.\n" +
                "New versions of @pixi/particle-emitter require 'behaviors' instead of 'alpha', 'speed', etc.\n" +
                "Convert your old config or use pixi-particles@4 if you must keep the old format.\n\n" +
                "Docs: https://github.com/pixijs/particle-emitter#emitterconfig");
        }
    }
    /**
     * Searches direct children for a Spine animation object and returns the first match.
     * Supports both Spine 3.8 and Spine 4.0 runtime versions.
     * @returns The first `Spine` instance found, or `undefined` if none exists.
     */
    getSpine() {
        for (let child of this.children) {
            if (child instanceof PIXISpine3.Spine || child instanceof PIXISpine4.Spine) {
                return child;
            }
        }
        return undefined;
    }
    /**
     * Starts (or resumes) the particle emitter.
     * Must be called after `loadParticle` has initialised the emitter.
     */
    playParticleAnim() {
        if (!this.emitter) {
            console.warn("Emitter not initialized. Call loadParticle first.");
            return;
        }
        this.emitter.emit = true;
    }
    /**
     * Pauses particle emission by setting `emitter.emit = false`.
     * The existing particles continue to age and disappear naturally.
     */
    stopParticleAnim() {
        if (!this.emitter) {
            console.warn("Emitter not initialized. Call loadParticle first.");
            return;
        }
        this.emitter.emit = false;
    }
    destroy(options) {
        if (this.emitter) {
            this.emitter.cleanup();
            this.emitter = undefined;
        }
        super.destroy(options);
    }
}
//# sourceMappingURL=ZContainer.js.map