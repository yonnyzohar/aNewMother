import * as PIXI from 'pixi.js';
import { ZContainer } from "./ZContainer";
import TextInput from './text-input';
/**
 * Removes all pointer/touch click listeners that were attached by `AttachClickListener`.
 * @param container - The `ZContainer` to clean up listeners on.
 */
export declare const RemoveClickListener: (container: ZContainer) => void;
/**
 * Attaches a unified click / long-press listener to any `ZContainer`.
 * A press is only fired if the pointer has not moved more than 20 px (drag guard)
 * and a long-press has not been triggered first.
 * @param container - The target container.
 * @param pressCallback - Called on a normal tap/click.
 * @param longPressCallback - Called after the pointer is held for 500 ms without moving.
 */
export declare const AttachClickListener: (container: ZContainer, pressCallback?: () => void, longPressCallback?: () => void) => void;
/**
 * Attaches `mouseover` and `mouseout` listeners to a container.
 * @param container - The container to listen on.
 * @param hoverCallback - Called when the pointer enters.
 * @param outCallback - Called when the pointer leaves.
 */
export declare const AddHoverListener: (container: ZContainer, hoverCallback: (...args: any[]) => void, outCallback: (...args: any[]) => void) => void;
/**
 * Removes any hover listeners that were attached via `AddHoverListener`.
 * @param container - The container to clean up.
 */
export declare const RemoveHoverListener: (container: ZContainer) => void;
export declare class ZButton extends ZContainer {
    topLabelContainer2: ZContainer;
    topLabelContainer: ZContainer;
    overState: ZContainer;
    overLabelContainer: ZContainer;
    overLabelContainer2: ZContainer;
    downState: ZContainer;
    downLabelContainer: ZContainer;
    downLabelContainer2: ZContainer;
    upState: ZContainer;
    upLabelContainer: ZContainer;
    upLabelContainer2: ZContainer;
    disabledState: ZContainer;
    disabledLabelContainer: ZContainer;
    disabledLabelContainer2: ZContainer;
    pressCallback?: () => void;
    longPressCallback?: () => void;
    private labelState;
    /**
     * Returns the class type identifier.
     * @returns `"ZButton"`
     */
    getType(): string;
    /**
     * Initialises the button by resolving label containers and visual states
     * from the scene-editor hierarchy, then calls `enable()`.
     * @param _labelStr - Optional initial label string (reserved for future use).
     */
    init(_labelStr?: string): void;
    /**
     * Sets the primary label text on all visible label containers.
     * In `"single"` label mode all `labelContainer` descendants are updated;
     * in `"multi"` mode each state's `labelContainer` is updated individually.
     * @param name - The string to display.
     */
    setLabel(name: string): void;
    /**
     * Sets the secondary label text on all visible `labelContainer2` containers
     * in the same manner as `setLabel`.
     * @param name - The string to display.
     */
    setLabel2(name: string): void;
    /**
     * Enables or disables fixed-box-size mode on every label container so that
     * long strings are automatically shrunk to fit.
     * @param fixed - `true` to constrain text size, `false` to allow free sizing.
     */
    setFixedTextSize(fixed: boolean): void;
    /**
     * Hides `labelContainer2` everywhere and repositions `labelContainer` to
     * the vertical centre of its parent, effectively making the button single-line.
     */
    makeSingleLine(): void;
    /**
     * Returns the primary label text field for this button.
     * In `"single"` mode, returns the field from `topLabelContainer`;
     * in `"multi"` mode, returns the field from the `upState`'s `labelContainer`.
     * @returns The text field, or `null` if none is present.
     */
    getLabel(): PIXI.Text | TextInput | null;
    /**
     * Returns the secondary label text field for this button.
     * In `"single"` mode, returns the field from `topLabelContainer2`;
     * in `"multi"` mode, returns the field from the `upState`'s `labelContainer2`.
     * @returns The text field, or `null` if none is present.
     */
    getLabel2(): PIXI.Text | TextInput | null;
    /**
     * Returns `true` if this button has a primary label text field.
     */
    hasLabel(): boolean;
    /**
     * Returns `true` if this button has a secondary label text field.
     */
    hasLabel2(): boolean;
    /**
     * Registers a function to be called when the button is clicked.
     * @param func - The click handler.
     */
    setCallback(func: () => void): void;
    /**
     * Clears the registered click callback so pressing the button does nothing.
     */
    removeCallback(): void;
    /**
     * Registers a function to be called when the button is long-pressed (≥500 ms).
     * @param func - The long-press handler.
     */
    setLongPressCallback(func: () => void): void;
    /**
     * Clears the registered long-press callback.
     */
    removeLongPressCallback(): void;
    /**
     * Re-enables the button: restores pointer-cursor, re-attaches hover/down
     * listeners, shows the `upState`, and re-registers the click callback.
     */
    enable(): void;
    /**
     * Disables the button: removes interactivity, switches to `disabledState`,
     * and dims label containers to 0.5 alpha.
     */
    disable(): void;
    /**
     * Sets all visual state containers (`upState`, `overState`, `downState`,
     * `disabledState`) to invisible. Used internally before showing the active state.
     */
    hideAllStates(): void;
    /** Shows `downState` and dims label containers to 0.5 alpha. */
    onDown(): void;
    /** Restores `upState` and sets label containers to full alpha. */
    onOut(): void;
    /** Shows `overState` and sets label containers to full alpha. */
    onOver(): void;
}
//# sourceMappingURL=ZButton.d.ts.map