import { AttachClickListener } from "./ZButton";
import { ZState } from "./ZState";
export class ZToggle extends ZState {
    callback;
    toggleCallback;
    /**
     * Initialises the toggle: sets pointer cursor, attaches a click listener that
     * flips between `"onState"` and `"offState"`, and starts in `"offState"`.
     */
    init() {
        this.cursor = "pointer";
        AttachClickListener(this, () => {
            this.setState(this.currentState.name === "offState" ? "onState" : "offState");
            if (this.callback) {
                this.callback(this.currentState.name === "onState");
            }
            if (this.toggleCallback) {
                this.toggleCallback(this.currentState.name === "onState");
            }
        });
        this.setState("offState");
    }
    /**
     * Registers a function to be called whenever the toggle state changes.
     * @param func - Receives `true` when toggled on, `false` when toggled off.
     */
    setCallback(func) {
        this.toggleCallback = func;
    }
    /** Clears the registered toggle callback. */
    removeCallback() {
        this.toggleCallback = undefined;
    }
    /**
     * Enables or disables pointer interactivity on the toggle.
     * @param val - `true` to make clickable, `false` to disable.
     */
    setIsClickable(val) {
        this.interactive = val;
        this.cursor = val ? "pointer" : "default";
    }
    /**
     * Returns whether the toggle is currently in the `"onState"`.
     * @returns `true` if on.
     */
    isOn() {
        return this.currentState.name === "onState";
    }
    /**
     * Programmatically sets the toggle to a specific state.
     * @param state - `true` for `"onState"`, `false` for `"offState"`.
     * @param sendCallback - When `true` (default), fires the toggle callback.
     */
    toggle(state, sendCallback = true) {
        this.setState(state ? "onState" : "offState");
        if (this.toggleCallback && sendCallback) {
            this.toggleCallback(state);
        }
    }
    /** Makes the toggle interactive and shows the pointer cursor. */
    enable() {
        this.interactive = true;
        this.cursor = "pointer";
    }
    /** Removes interactivity and reverts to the default cursor. */
    disable() {
        this.interactive = false;
        this.cursor = "default";
    }
    /**
     * Sets the same text label on all children named `label` across every state.
     * @param label - The child name to search for (e.g. `"labelContainer"`).
     * @param str - The text string to apply.
     */
    setLabelOnAllStates(label, str) {
        let containers = this.getAll(label);
        for (let container of containers) {
            container.setText(str);
        }
    }
    /**
     * Returns the class type identifier.
     * @returns `"ZToggle"`
     */
    getType() {
        return "ZToggle";
    }
}
//# sourceMappingURL=ZToggle.js.map