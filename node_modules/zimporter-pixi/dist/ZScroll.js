import { Graphics } from "pixi.js";
import { ZContainer } from "./ZContainer";
export class ZScroll extends ZContainer {
    scrollBarHeight = 0;
    contentHeight = 0;
    dragStartY = 0;
    beedStartY = 0;
    isDragging = false;
    isBeedDragging = false;
    beed;
    scrollBar;
    scrollContent;
    msk = null;
    scrollArea = null;
    scrollingEnabled = true;
    onPointerDownBinded;
    onPointerMoveBinded;
    onPointerUpBinded;
    onBeedDownBinded;
    onBeedUpBinded;
    onWheelBinded;
    /**
     * Initialises the scroll component: resolves the required children (`beed`,
     * `scrollBar`, `scrollContent`), binds event handlers, and calculates the
     * initial scroll bar dimensions.
     */
    init() {
        super.init();
        this.onPointerDownBinded = this.onPointerDown.bind(this);
        this.onPointerMoveBinded = this.onPointerMove.bind(this);
        this.onPointerUpBinded = this.onPointerUp.bind(this);
        this.onBeedDownBinded = this.onBeedDown.bind(this);
        this.onBeedUpBinded = this.onBeedUp.bind(this);
        this.onWheelBinded = this.onWheel.bind(this);
        this.beed = this.getChildByName("beed");
        this.scrollBar = this.getChildByName("scrollBar");
        this.scrollContent = this.getChildByName("scrollContent");
        if (!this.beed || !this.scrollBar || !this.scrollContent) {
            console.warn("ZScroll requires 'beed', 'scrollBar', and 'scrollContent' children.");
            return;
        }
        this.calculateScrollBar();
    }
    /**
     * Returns the class type identifier.
     * @returns `"ZScroll"`
     */
    getType() {
        return "ZScroll";
    }
    ;
    /**
     * (Re-)calculates the scroll bar, mask, and interactive scroll area based on
     * the current dimensions of `scrollBar` and `scrollContent`.
     * If the content fits within the scroll bar height, scrolling is hidden.
     */
    calculateScrollBar() {
        if (!this.scrollBar || !this.scrollContent) {
            return;
        }
        let scrollBarHeight = this.scrollBar.height;
        let contentHeight = this.scrollContent.height;
        // Clean up old mask & scroll area before rebuilding
        if (this.msk) {
            this.msk.removeAllListeners();
            this.msk.removeFromParent();
            this.msk.destroy({ children: true });
            this.msk = null;
        }
        if (this.scrollArea) {
            this.scrollArea.removeAllListeners();
            this.scrollArea.removeFromParent();
            this.scrollArea.destroy({ children: true });
            this.scrollArea = null;
        }
        if (contentHeight <= scrollBarHeight) {
            console.log("Content fits, no scroll needed.");
            this.scrollBar.setVisible(false);
            this.scrollContent.y = 0;
            return;
        }
        this.scrollBar.setVisible(true);
        let w = this.scrollBar.x - this.scrollContent.x;
        console.log("Calculated scroll width:", w);
        this.msk = new Graphics();
        this.msk.name = "mask";
        this.msk.beginFill(0x000000, 0.5); // match MadHatScrollComponent alpha
        this.msk.drawRect(0, 0, w, scrollBarHeight);
        this.msk.endFill();
        this.scrollContent.mask = this.msk;
        this.addChild(this.msk);
        console.log("Mask dimensions:", w, scrollBarHeight);
        this.scrollArea = new Graphics();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.beginFill(0x000000, 0.5); // match MadHatScrollComponent alpha
        this.scrollArea.drawRect(0, 0, w, scrollBarHeight);
        this.scrollArea.endFill();
        this.addChildAt(this.scrollArea, 0);
        this.scrollArea.interactive = true;
        this.scrollContent.y = 0;
        this.scrollBar.y = 0;
        this.addEventListeners();
        this.enableChildPassThrough();
    }
    /**
     * Forwards pointer events from interactive children (`ZButton`, `ZToggle`)
     * inside `scrollContent` to the `scrollArea`, so that dragging over a button
     * still scrolls the list.
     */
    enableChildPassThrough() {
        // Allow buttons/toggles inside scrollContent to propagate events to scrollArea
        //now we need to go over all child components of the scroll contents and make sure they pass the events to the scroll area
        //this is needed for example for buttons to work inside the scroll area
        //without this the button will capture the event and the scroll area won't get it
        let scrollContent = this.scrollContent;
        let scrollArea = this.scrollArea;
        let types = ["ZToggle", "ZButton"];
        for (let type of types) {
            let allButtons = scrollContent.getAllOfType(type);
            for (let i = 0; i < allButtons.length; i++) {
                let child = allButtons[i];
                child.on("pointerdown", (event) => {
                    scrollArea.emit("pointerdown", event);
                });
                child.on("ontouchstart", (event) => {
                    scrollArea.emit("ontouchstart", event);
                });
                child.on("pointerup", (event) => {
                    scrollArea.emit("pointerup", event);
                });
                child.on("ontouchend", (event) => {
                    scrollArea.emit("ontouchend", event);
                });
                child.on("pointerupoutside", (event) => {
                    scrollArea.emit("pointerupoutside", event);
                });
                child.on("ontouchendoutside", (event) => {
                    scrollArea.emit("ontouchendoutside", event);
                });
                child.on("pointermove", (event) => {
                    scrollArea.emit("pointermove", event);
                });
                child.on("ontouchmove", (event) => {
                    scrollArea.emit("ontouchmove", event);
                });
            }
        }
    }
    /**
     * Attaches all pointer, touch, and wheel event listeners to `scrollArea` and
     * `beed`. Calls `removeEventListeners` first to avoid duplicates.
     */
    addEventListeners() {
        this.removeEventListeners();
        if (this.scrollArea) {
            this.scrollArea.on('pointerdown', this.onPointerDownBinded);
            this.scrollArea.on('pointermove', this.onPointerMoveBinded);
            this.scrollArea.on('pointerup', this.onPointerUpBinded);
            this.scrollArea.on('pointerupoutside', this.onPointerUpBinded);
            this.scrollArea.on('touchstart', this.onPointerDownBinded);
            this.scrollArea.on('touchmove', this.onPointerMoveBinded);
            this.scrollArea.on('touchend', this.onPointerUpBinded);
            this.scrollArea.on('touchendoutside', this.onPointerUpBinded);
        }
        // Enable dragging beed directly
        this.beed.interactive = true;
        this.beed.on('pointerdown', this.onBeedDownBinded);
        this.beed.on('pointermove', this.onPointerMoveBinded);
        this.beed.on('pointerup', this.onBeedUpBinded);
        this.beed.on('pointerupoutside', this.onBeedUpBinded);
        this.beed.on('touchstart', this.onBeedDownBinded);
        this.beed.on('touchmove', this.onPointerMoveBinded);
        this.beed.on('touchend', this.onBeedUpBinded);
        this.beed.on('touchendoutside', this.onBeedUpBinded);
        document.body.addEventListener('wheel', this.onWheelBinded);
    }
    /**
     * Removes all pointer/touch/wheel event listeners from `scrollArea`, `beed`,
     * and the document body.
     */
    removeEventListeners() {
        this.scrollArea?.removeAllListeners();
        this.beed?.removeAllListeners();
        document.body.removeEventListener('wheel', this.onWheelBinded);
    }
    /**
     * Public alias for `removeEventListeners`; call this when removing the
     * scroll component from the stage to clean up all listeners.
     */
    removeListeners() {
        this.removeEventListeners();
    }
    /**
     * Begins a drag on the scroll area (inverts direction relative to beed drag).
     * @param event - The pointer-down event.
     */
    onPointerDown(event) {
        this.isDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.data.global.y;
        this.beedStartY = this.beed.y;
    }
    /**
     * Begins a direct drag on the scroll thumb (`beed`).
     * @param event - The pointer-down event.
     */
    onBeedDown(event) {
        this.isBeedDragging = true;
        this.scrollBarHeight = this.scrollBar.height;
        this.dragStartY = event.data.global.y;
        this.beedStartY = this.beed.y;
    }
    /**
     * Handles pointer movement during a drag. Moves the `beed` thumb and
     * scrolls `scrollContent` proportionally. Clamps the thumb within the
     * scroll bar bounds.
     * @param event - The pointer-move event.
     */
    onPointerMove(event) {
        if (this.isDragging || this.isBeedDragging) {
            const currentY = event.data.global.y;
            const sensitivity = 2;
            let deltaY = this.isDragging
                ? (this.dragStartY - currentY) * sensitivity // scroll area inverts direction
                : (currentY - this.dragStartY) * sensitivity; // beed is direct drag
            this.beed.y = this.beedStartY + deltaY;
            if (this.beed.y < 0)
                this.beed.y = 0;
            if (this.beed.y > this.scrollBarHeight - this.beed.height)
                this.beed.y = this.scrollBarHeight - this.beed.height;
            const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
            this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);
            event.stopPropagation();
        }
    }
    /** Ends the scroll-area drag. */
    onPointerUp() {
        this.isDragging = false;
    }
    /** Ends the beed (thumb) drag. */
    onBeedUp() {
        this.isBeedDragging = false;
    }
    /**
     * Scrolls the content in response to a mouse-wheel event.
     * Only active when `scrollingEnabled` is `true`.
     * @param event - The native `WheelEvent`.
     */
    onWheel(event) {
        if (!this.scrollingEnabled) {
            return;
        }
        let delta = -event.deltaY * 0.5;
        this.scrollBarHeight = this.scrollBar.height;
        this.beed.y -= delta;
        if (this.beed.y < 0)
            this.beed.y = 0;
        if (this.beed.y > this.scrollBarHeight - this.beed.height)
            this.beed.y = this.scrollBarHeight - this.beed.height;
        const per = this.beed.y / (this.scrollBarHeight - this.beed.height);
        this.scrollContent.y = -per * (this.scrollContent.height - this.scrollBarHeight);
        event.stopPropagation();
    }
    /**
     * Overrides `ZContainer.applyTransform` to recalculate the scroll bar
     * whenever the container's transform (position, scale, etc.) changes.
     */
    applyTransform() {
        super.applyTransform();
        this.calculateScrollBar();
    }
}
//# sourceMappingURL=ZScroll.js.map