import { ZState } from "./ZState";
export declare class ZToggle extends ZState {
    private callback?;
    toggleCallback?: (state: boolean) => void;
    /**
     * Initialises the toggle: sets pointer cursor, attaches a click listener that
     * flips between `"onState"` and `"offState"`, and starts in `"offState"`.
     */
    init(): void;
    /**
     * Registers a function to be called whenever the toggle state changes.
     * @param func - Receives `true` when toggled on, `false` when toggled off.
     */
    setCallback(func: (t: boolean) => void): void;
    /** Clears the registered toggle callback. */
    removeCallback(): void;
    /**
     * Enables or disables pointer interactivity on the toggle.
     * @param val - `true` to make clickable, `false` to disable.
     */
    setIsClickable(val: boolean): void;
    /**
     * Returns whether the toggle is currently in the `"onState"`.
     * @returns `true` if on.
     */
    isOn(): boolean;
    /**
     * Programmatically sets the toggle to a specific state.
     * @param state - `true` for `"onState"`, `false` for `"offState"`.
     * @param sendCallback - When `true` (default), fires the toggle callback.
     */
    toggle(state: boolean, sendCallback?: boolean): void;
    /** Makes the toggle interactive and shows the pointer cursor. */
    enable(): void;
    /** Removes interactivity and reverts to the default cursor. */
    disable(): void;
    /**
     * Sets the same text label on all children named `label` across every state.
     * @param label - The child name to search for (e.g. `"labelContainer"`).
     * @param str - The text string to apply.
     */
    setLabelOnAllStates(label: string, str: string): void;
    /**
     * Returns the class type identifier.
     * @returns `"ZToggle"`
     */
    getType(): string;
}
//# sourceMappingURL=ZToggle.d.ts.map