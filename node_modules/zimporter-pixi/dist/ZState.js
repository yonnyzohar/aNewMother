import { ZContainer } from "./ZContainer";
import { ZTimeline } from "./ZTimeline";
//in a state, all children are turned off at any given moment except one
/**
 * Represents a stateful container that manages its child containers as states.
 * Extends the `ZContainer` class and provides methods to initialize, query, and switch between states.
 *
 * Each state is represented by a child container, and only the current state is visible at any time.
 * If the desired state is not found, it falls back to the "idle" state or the first child.
 *
 * Methods:
 * - `init()`: Initializes the state container by setting the current state to "idle".
 * - `getCurrentState()`: Returns the currently active state container or `null` if none is set.
 * - `hasState(str: string)`: Checks if a child state with the given name exists.
 * - `setState(str: string)`: Sets the current state to the child with the given name, hiding all others.
 *    If the state is a `ZTimeline`, it will be played or stopped accordingly.
 */
export class ZState extends ZContainer {
    currentState = null;
    //this is called once all children of the container are loaded
    /**
     * Initialises the state container by showing the `"idle"` state (or the
     * first child if `"idle"` does not exist).
     */
    init() {
        this.setState("idle");
    }
    /**
     * Returns the currently visible state container.
     * @returns The active `ZContainer` state, or `null` if none has been set.
     */
    getCurrentState() {
        return this.currentState;
    }
    /**
     * Checks whether a direct child with the given name exists.
     * @param str - The state name to look for.
     * @returns `true` if a matching child exists.
     */
    hasState(str) {
        return this.getChildByName(str) !== null;
    }
    /**
     * Makes the named child visible and hides all others.
     * If a `ZTimeline` state is being deactivated it is stopped; the newly
     * active one is played. Falls back to `"idle"`, then the first child.
     * @param str - The name of the state to activate.
     * @returns The activated `ZContainer`, or `null` if no children exist.
     */
    setState(str) {
        let chosenChild = this.getChildByName(str);
        if (!chosenChild) {
            chosenChild = this.getChildByName("idle");
            if (!chosenChild && this.children.length > 0) {
                chosenChild = this.getChildAt(0);
            }
        }
        if (this.children) {
            for (let i = 0; i < this.children.length; i++) {
                let child = this.children[i];
                if (child instanceof ZContainer) {
                    child.setVisible(false);
                }
                else {
                    child.visible = false;
                }
                if (child instanceof ZTimeline) {
                    let t = child;
                    t.stop();
                }
            }
        }
        if (chosenChild) {
            if (chosenChild instanceof ZContainer) {
                chosenChild.setVisible(true);
            }
            else {
                chosenChild.visible = true;
            }
            this.currentState = chosenChild;
            chosenChild.parent.addChild(chosenChild);
            if (chosenChild instanceof ZTimeline) {
                let t = chosenChild;
                t.play();
            }
            return chosenChild;
        }
        return null;
    }
    /**
     * Returns the names of all direct children (states).
     * @returns An array of child name strings (may contain `null` for unnamed children).
     */
    getAllStateNames() {
        return this.children.map((child) => child.name);
    }
    /**
     * Returns the class type identifier.
     * @returns `"ZState"`
     */
    getType() {
        return "ZState";
    }
}
//# sourceMappingURL=ZState.js.map