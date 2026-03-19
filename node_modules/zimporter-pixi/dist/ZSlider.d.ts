import { ZContainer } from "./ZContainer";
import { FederatedPointerEvent, Point } from "pixi.js";
interface DragEvent extends FederatedPointerEvent {
    global: Point;
}
export declare class ZSlider extends ZContainer {
    dragging: boolean;
    sliderWidth: number | undefined;
    callback?: (t: number) => void;
    onDragStartBinded: any;
    onDragEndBinded: any;
    onDragBinded: any;
    /**
     * Initialises the slider: resolves the `handle` and `track` children,
     * measures the track width, binds drag handlers, and attaches listeners to
     * the handle.
     */
    init(): void;
    /**
     * Returns the class type identifier.
     * @returns `"ZSlider"`
     */
    getType(): string;
    /**
     * Programmatically moves the handle to the given normalised position and
     * fires the callback.
     * @param t - A value in [0, 1] representing the handle position across the track.
     */
    setHandlePosition(t: number): void;
    /**
     * Registers a function to be called whenever the slider value changes.
     * @param callback - Receives a normalised value in [0, 1].
     */
    setCallback(callback: (t: number) => void): void;
    /** Clears the registered value-change callback. */
    removeCallback(): void;
    /**
     * Starts a drag interaction: attaches pointer-up and pointer-move listeners
     * to both the handle and the window.
     * @param e - The pointer-down event that initiated the drag.
     */
    onDragStart(e: DragEvent): void;
    /**
     * Ends a drag interaction: removes all pointer-up and pointer-move listeners.
     * @param e - The pointer-up event that ended the drag.
     */
    onDragEnd(e: DragEvent): void;
    /**
     * Handles pointer movement during a drag. Converts the global pointer
     * position to local track space, clamps it to track bounds, moves the
     * handle, and fires the callback with a normalised [0, 1] value.
     * @param e - A PIXI `FederatedPointerEvent`, browser `PointerEvent`, or `TouchEvent`.
     */
    onDrag(e: DragEvent | PointerEvent | TouchEvent): void;
}
export {};
//# sourceMappingURL=ZSlider.d.ts.map