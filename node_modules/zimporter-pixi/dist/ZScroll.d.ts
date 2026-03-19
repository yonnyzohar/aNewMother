import { Graphics, FederatedPointerEvent, Point } from "pixi.js";
import { ZContainer } from "./ZContainer";
interface DragEvent extends FederatedPointerEvent {
    global: Point;
}
export declare class ZScroll extends ZContainer {
    scrollBarHeight: number;
    contentHeight: number;
    dragStartY: number;
    beedStartY: number;
    isDragging: boolean;
    isBeedDragging: boolean;
    beed: ZContainer;
    scrollBar: ZContainer;
    scrollContent: ZContainer;
    msk: Graphics | null;
    scrollArea: Graphics | null;
    scrollingEnabled: boolean;
    private onPointerDownBinded;
    private onPointerMoveBinded;
    private onPointerUpBinded;
    private onBeedDownBinded;
    private onBeedUpBinded;
    private onWheelBinded;
    /**
     * Initialises the scroll component: resolves the required children (`beed`,
     * `scrollBar`, `scrollContent`), binds event handlers, and calculates the
     * initial scroll bar dimensions.
     */
    init(): void;
    /**
     * Returns the class type identifier.
     * @returns `"ZScroll"`
     */
    getType(): string;
    /**
     * (Re-)calculates the scroll bar, mask, and interactive scroll area based on
     * the current dimensions of `scrollBar` and `scrollContent`.
     * If the content fits within the scroll bar height, scrolling is hidden.
     */
    private calculateScrollBar;
    /**
     * Forwards pointer events from interactive children (`ZButton`, `ZToggle`)
     * inside `scrollContent` to the `scrollArea`, so that dragging over a button
     * still scrolls the list.
     */
    private enableChildPassThrough;
    /**
     * Attaches all pointer, touch, and wheel event listeners to `scrollArea` and
     * `beed`. Calls `removeEventListeners` first to avoid duplicates.
     */
    addEventListeners(): void;
    /**
     * Removes all pointer/touch/wheel event listeners from `scrollArea`, `beed`,
     * and the document body.
     */
    removeEventListeners(): void;
    /**
     * Public alias for `removeEventListeners`; call this when removing the
     * scroll component from the stage to clean up all listeners.
     */
    removeListeners(): void;
    /**
     * Begins a drag on the scroll area (inverts direction relative to beed drag).
     * @param event - The pointer-down event.
     */
    onPointerDown(event: DragEvent): void;
    /**
     * Begins a direct drag on the scroll thumb (`beed`).
     * @param event - The pointer-down event.
     */
    onBeedDown(event: DragEvent): void;
    /**
     * Handles pointer movement during a drag. Moves the `beed` thumb and
     * scrolls `scrollContent` proportionally. Clamps the thumb within the
     * scroll bar bounds.
     * @param event - The pointer-move event.
     */
    onPointerMove(event: DragEvent): void;
    /** Ends the scroll-area drag. */
    onPointerUp(): void;
    /** Ends the beed (thumb) drag. */
    onBeedUp(): void;
    /**
     * Scrolls the content in response to a mouse-wheel event.
     * Only active when `scrollingEnabled` is `true`.
     * @param event - The native `WheelEvent`.
     */
    onWheel(event: WheelEvent): void;
    /**
     * Overrides `ZContainer.applyTransform` to recalculate the scroll bar
     * whenever the container's transform (position, scale, etc.) changes.
     */
    applyTransform(): void;
}
export {};
//# sourceMappingURL=ZScroll.d.ts.map