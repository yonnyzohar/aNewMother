import { ZContainer } from "./ZContainer";
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
export declare class ZState extends ZContainer {
    currentState: ZContainer | null;
    /**
     * Initialises the state container by showing the `"idle"` state (or the
     * first child if `"idle"` does not exist).
     */
    init(): void;
    /**
     * Returns the currently visible state container.
     * @returns The active `ZContainer` state, or `null` if none has been set.
     */
    getCurrentState(): ZContainer | null;
    /**
     * Checks whether a direct child with the given name exists.
     * @param str - The state name to look for.
     * @returns `true` if a matching child exists.
     */
    hasState(str: string): boolean;
    /**
     * Makes the named child visible and hides all others.
     * If a `ZTimeline` state is being deactivated it is stopped; the newly
     * active one is played. Falls back to `"idle"`, then the first child.
     * @param str - The name of the state to activate.
     * @returns The activated `ZContainer`, or `null` if no children exist.
     */
    setState(str: string): ZContainer | null;
    /**
     * Returns the names of all direct children (states).
     * @returns An array of child name strings (may contain `null` for unnamed children).
     */
    getAllStateNames(): (string | null)[];
    /**
     * Returns the class type identifier.
     * @returns `"ZState"`
     */
    getType(): string;
}
//# sourceMappingURL=ZState.d.ts.map