import * as PIXI from 'pixi.js';
import { InstanceData } from './SceneData';
import { OrientationData } from './SceneData';
import { Emitter } from "@pixi/particle-emitter";
import TextInput from './text-input';
import * as PIXISpine3 from "@pixi-spine/runtime-3.8";
import * as PIXISpine4 from "@pixi-spine/all-4.0";
export interface AnchorData {
    anchorType: string;
    anchorPercentage: {
        x: number;
        y: number;
    };
}
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
export declare class ZContainer extends PIXI.Container {
    portrait: OrientationData;
    landscape: OrientationData;
    currentTransform: OrientationData;
    resizeable: boolean;
    name: string;
    _fitToScreen: boolean;
    emitter: Emitter | undefined;
    originalTextWidth?: number;
    originalTextHeight?: number;
    originalFontSize?: number;
    fixedBoxSize?: boolean;
    _props?: any;
    /**
     * Performs a breadth-first search and returns the first descendant `ZContainer` with the given name.
     * @param childName - The `name` to search for.
     * @returns The first matching `ZContainer`, or `null` if not found.
     */
    get(childName: string): ZContainer | null;
    /**
     * Performs a breadth-first search and returns all descendant `ZContainer` instances with the given name.
     * @param childName - The `name` to search for.
     * @returns An array of all matching `ZContainer` instances (may be empty).
     */
    getAll(childName: string): ZContainer[];
    /**
     * Called once all children of the container are loaded.
     * Captures the original text-field dimensions and font size so they can be
     * restored when `setText` is called later.
     */
    init(): void;
    /**
     * Returns a string identifier for the class type.
     * @returns `"ZContainer"`
     */
    getType(): string;
    /**
     * Enables or disables fixed-box-size mode. When enabled, `setText` will
     * shrink the font size to keep the text within the original measured bounds.
     * @param value - `true` to enable fixed-box mode, `false` to disable.
     */
    setFixedBoxSize(value: boolean): void;
    /**
     * Performs a breadth-first search and returns all descendants that report
     * the given type string via their `getType()` method.
     * @param type - The type string to match (e.g. `"ZButton"`, `"ZToggle"`).
     * @returns An array of matching `ZContainer` descendants.
     */
    getAllOfType(type: string): ZContainer[];
    /**
     * Sets the text content of the first text-field child (named `"label"` or
     * the first `PIXI.Text` / `TextInput` found). If fixed-box-size mode is on,
     * the font size will be reduced until the text fits within the original bounds.
     * @param text - The string to display.
     */
    setText(text: string): void;
    /**
     * Merges additional style properties onto the text-field's existing style
     * and re-runs the resize logic to keep the text within bounds.
     * @param data - Partial `PIXI.TextStyle` properties to merge.
     */
    setTextStyle(data: Partial<PIXI.TextStyle>): void;
    /**
     * Returns the raw instance-data props object that was set via `setInstanceData`.
     * @returns The stored `_props` object, or `undefined` if not yet set.
     */
    getProps(): any;
    /**
     * Shrinks the font size of `textChild` until both its width and height fit
     * within `originalTextWidth` / `originalTextHeight` (only active when
     * `fixedBoxSize` is `true`).
     * @param textChild - The `PIXI.Text` whose style will be adjusted.
     */
    private resizeText;
    /**
     * Finds and returns the first text-field child. Prefers a child named
     * `"label"`, then falls back to the first `PIXI.Text` or `TextInput` found
     * among direct children.
     * @returns The text field, or `null` if none exists.
     */
    getTextField(): PIXI.Text | TextInput | null;
    /**
     * Applies scene-editor instance data to this container: stores portrait /
     * landscape transforms, sets the active orientation, applies the resulting
     * transform, and captures original text dimensions.
     * @param data - The `InstanceData` exported from the scene editor.
     * @param orientation - `"portrait"` or `"landscape"`.
     */
    setInstanceData(data: InstanceData, orientation: string): void;
    /**
     * When set to `true`, stretches this container to fill the entire screen
     * on the next `applyTransform` call.
     * @param value - `true` to enable fit-to-screen mode.
     */
    set fitToScreen(value: boolean);
    /** Returns `true` if fit-to-screen mode is currently active. */
    get fitToScreen(): boolean;
    /**
     * Reads `currentTransform` (or delegates to `executeFitToScreen`) and
     * writes position, scale, rotation, pivot, alpha, and visibility onto
     * this container. Skips the update while a parent `ZTimeline` is playing.
     */
    applyTransform(): void;
    /**
     * Switches the active orientation data and re-applies the transform.
     * Called by the scene or parent when the viewport size changes.
     * @param width - The new viewport width (unused directly; stored by parent).
     * @param height - The new viewport height (unused directly; stored by parent).
     * @param orientation - The new orientation: `"portrait"` or `"landscape"`.
     */
    resize(width: number, height: number, orientation: "portrait" | "landscape"): void;
    /**
     * Stretches this container (or its first `ZNineSlice` child) to cover the
     * full browser viewport. Assumes the asset pivot is at the top-left.
     * In landscape mode scales by width; in portrait mode scales by height.
     */
    executeFitToScreen(): void;
    /**
     * Positions the container at a screen-percentage anchor point when
     * `currentTransform.isAnchored` is `true`. Converts the percentage
     * coordinates to local space relative to the parent.
     */
    applyAnchor(): void;
    /**
     * Returns whether this container is currently configured to use anchor-based positioning.
     * @returns `true` if the current transform has `isAnchored` set.
     */
    isAnchored(): boolean;
    /**
     * Sets the x position and mirrors the value into `currentTransform` so it
     * is preserved across orientation changes.
     */
    set x(value: number);
    /**
     * Sets the display width and mirrors the derived `scaleX` back into
     * `currentTransform`.
     */
    set width(value: number);
    get width(): number;
    get height(): number;
    /**
     * Sets the display height and mirrors the derived `scaleY` back into
     * `currentTransform`.
     */
    set height(value: number);
    /**
     * Sets the y position and mirrors the value into `currentTransform`.
     */
    set y(value: number);
    /**
     * Sets the rotation (in radians) and mirrors the value into `currentTransform`.
     */
    set rotation(value: number);
    get x(): number;
    get y(): number;
    get rotation(): number;
    get scaleX(): number;
    get scaleY(): number;
    get pivotX(): number;
    get pivotY(): number;
    /**
     * Sets the horizontal scale and mirrors the value into `currentTransform`.
     */
    set scaleX(value: number);
    /**
     * Sets the vertical scale and mirrors the value into `currentTransform`.
     */
    set scaleY(value: number);
    /**
     * Sets the horizontal pivot and mirrors the value into `currentTransform`.
     */
    set pivotX(value: number);
    /**
     * Sets the vertical pivot and mirrors the value into `currentTransform`.
     */
    set pivotY(value: number);
    /**
     * Sets the alpha (opacity) and mirrors the value into `currentTransform`.
     * @param value - Opacity in the range [0, 1].
     */
    setAlpha(value: number): void;
    /**
     * Returns the current alpha (opacity) value.
     * @returns Opacity in the range [0, 1].
     */
    getAlpha(): number;
    /**
     * Sets the visibility of this container and mirrors the value into `currentTransform`.
     * @param value - `true` to show, `false` to hide.
     */
    setVisible(value: boolean): void;
    /**
     * Returns whether this container is currently visible.
     * @returns `true` if visible.
     */
    getVisible(): boolean;
    /**
     * Returns the `PIXI.TextStyle` of this container's text field, or `null`
     * if no text field exists or it is a `TextInput`.
     * @returns The text style, or `null`.
     */
    getTextStyle(): PIXI.TextStyle | null;
    /**
     * Creates a shallow structural clone of this `ZContainer`, copying position,
     * pivot, scale, rotation, alpha, visibility, and name. Direct children are
     * cloned by type: `PIXI.Text`, `PIXI.BitmapText`, `PIXI.Sprite`,
     * `PIXI.NineSlicePlane`, and any object that exposes its own `clone()` method.
     * @returns A new `ZContainer` with cloned children.
     */
    clone(): ZContainer;
    /**
     * Initialises and starts a particle emitter on this container.
     * Injects `texture` into the `textureSingle` behavior of `emitterConfig`
     * before creating the `Emitter` instance.
     * @param emitterConfig - A PixiJS particle-emitter `behaviors`-based config object.
     * @param texture - The texture to use for individual particles.
     * @param name - An identifier for this particle effect (currently unused internally).
     */
    loadParticle(emitterConfig: any, texture: PIXI.Texture, name: string): void;
    /**
     * Searches direct children for a Spine animation object and returns the first match.
     * Supports both Spine 3.8 and Spine 4.0 runtime versions.
     * @returns The first `Spine` instance found, or `undefined` if none exists.
     */
    getSpine(): PIXISpine3.Spine | PIXISpine4.Spine | undefined;
    /**
     * Starts (or resumes) the particle emitter.
     * Must be called after `loadParticle` has initialised the emitter.
     */
    playParticleAnim(): void;
    /**
     * Pauses particle emission by setting `emitter.emit = false`.
     * The existing particles continue to age and disappear naturally.
     */
    stopParticleAnim(): void;
}
//# sourceMappingURL=ZContainer.d.ts.map