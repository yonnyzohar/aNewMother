import { ZCuePointsManager } from "./ZCuePointsManager";
import { ZContainer } from "./ZContainer";
import { ZUpdatables } from "./ZUpdatables";
/**
 * Represents a timeline container that manages frame-based animations for its children.
 * Extends `ZContainer` and provides methods to control playback, frame navigation, and event listeners.
 *
 * @property {number | undefined} totalFrames - The total number of frames in the timeline, determined by the longest child timeline.
 * @property {any} _frames - The frame data for all children with timelines.
 * @property {number} currentFrame - The current frame index being displayed.
 * @property {boolean} looping - Indicates whether the timeline should loop when it reaches the end.
 * @property {(self: ZTimeline) => void | undefined} func - Optional callback function invoked when the timeline ends.
 *
 * @method getFrames - Returns the frame data for the timeline.
 * @method setFrames - Sets the frame data and updates the total frame count based on the longest child timeline.
 * @method removeStateEndEventListener - Removes the end-of-state event listener.
 * @method addStateEndEventListener - Adds a callback to be invoked when the timeline ends.
 * @method play - Starts playback of the timeline and all child timelines.
 * @method stop - Stops playback of the timeline and all child timelines.
 * @method gotoAndPlay - Jumps to a specific frame and starts playback.
 * @method update - Advances the timeline by one frame, handles looping, and invokes the end event listener if present.
 * @method gotoAndStop - Jumps to a specific frame and updates all child transforms to match that frame.
 */
export class ZTimeline extends ZContainer {
    totalFrames;
    _frames;
    currentFrame = 0;
    looping = true;
    cuePoints = {};
    func;
    constructor() {
        super();
        this.totalFrames;
        this._frames;
        this.currentFrame = 0;
        this.looping = true;
    }
    setInstanceData(data, orientation) {
        super.setInstanceData(data, orientation);
        if (data.playOnStart) {
            this.play();
        }
    }
    /**
     * Sets cue-point labels keyed by frame number. When playback reaches a
     * labelled frame, `ZCuePointsManager.triggerCuePoint` is called with the
     * label string and this timeline as the argument.
     * @param cuePoints - A map of `frameIndex -> cuePointName`.
     */
    setCuePoints(cuePoints) {
        this.cuePoints = cuePoints;
    }
    /**
     * Returns the raw frame-data object for all tracked children.
     * @returns The internal `_frames` record.
     */
    getFrames() {
        return this._frames;
    }
    /**
     * Sets the frame data for all tracked children and calculates `totalFrames`
     * as the length of the longest child track.
     * @param value - A record mapping child instance names to their array of per-frame transform data.
     */
    setFrames(value) {
        this._frames = value;
        let totalFrames = 0;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k] instanceof Array) {
                    if (this._frames[k].length > totalFrames) {
                        totalFrames = this._frames[k].length;
                    }
                }
            }
            this.totalFrames = totalFrames;
        }
    }
    /**
     * Removes the end-of-timeline callback so no function is called when the
     * timeline finishes or loops.
     */
    removeStateEndEventListener() {
        this.func = undefined;
    }
    /**
     * Registers a callback that is invoked each time the timeline reaches its last frame.
     * @param func - Called with this `ZTimeline` instance as the argument.
     */
    addStateEndEventListener(func) {
        this.func = func;
    }
    /**
     * Registers this timeline (and all `ZTimeline` children) with `ZUpdatables`
     * so they receive `update()` calls each tick.
     */
    play() {
        ZUpdatables.addUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.play();
            }
        }
    }
    /**
     * Unregisters this timeline (and all `ZTimeline` children) from `ZUpdatables`,
     * halting playback at the current frame.
     */
    stop() {
        ZUpdatables.removeUpdateAble(this);
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child instanceof ZTimeline) {
                child.stop();
            }
        }
    }
    /**
     * Jumps to `frameNum` and resumes playback from that point.
     * @param frameNum - The frame index to jump to.
     */
    gotoAndPlay(frameNum) {
        this.currentFrame = frameNum;
        ZUpdatables.removeUpdateAble(this);
        this.play();
    }
    /**
     * Called each tick by `ZUpdatables`. Applies the current frame's transforms,
     * fires any cue point at the current frame, increments the frame counter, and
     * handles looping / end-of-timeline notification.
     * @remarks Frame advancement is based on tick count, not elapsed time.
     */
    update() {
        this.gotoAndStop(this.currentFrame);
        if (this.cuePoints && this.cuePoints[this.currentFrame] !== undefined) {
            //emit the cue point event
            ZCuePointsManager.triggerCuePoint(this.cuePoints[this.currentFrame], this);
        }
        this.currentFrame++;
        if (this.currentFrame > this.totalFrames) {
            if (this.looping) {
                this.currentFrame = 0;
            }
            else {
                ZUpdatables.removeUpdateAble(this);
            }
            if (this.func) {
                this.func.call(this, this);
            }
        }
    }
    /**
     * Jumps to `frameNum` and applies the transform data for every tracked child
     * at that frame (position, scale, rotation, pivot, alpha). Does not start or
     * stop playback.
     * @param frameNum - The frame index to display.
     */
    gotoAndStop(frameNum) {
        this.currentFrame = frameNum;
        if (this._frames != null) {
            for (const k in this._frames) {
                if (this._frames[k][this.currentFrame]) {
                    const frame = this._frames[k][this.currentFrame];
                    if (this[k]) {
                        if (frame.pivotX != undefined) {
                            this[k].pivot.x = frame.pivotX;
                        }
                        if (frame.pivotY != undefined) {
                            this[k].pivot.y = frame.pivotY;
                        }
                        if (frame.scaleX != undefined) {
                            this[k].scale.x = frame.scaleX;
                        }
                        if (frame.scaleY != undefined) {
                            this[k].scale.y = frame.scaleY;
                        }
                        if (frame.x != undefined) {
                            this[k].x = frame.x;
                        }
                        if (frame.y != undefined) {
                            this[k].y = frame.y;
                        }
                        if (frame.alpha != undefined) {
                            this[k].alpha = frame.alpha;
                        }
                        if (frame.rotation != undefined) {
                            this[k].rotation = frame.rotation;
                        }
                        // Apply Flash skew: skewY is Flash's X-axis angle (PIXI skew.y = skewY - rotation).
                        // Flash skewX is the Y-axis angle (PIXI skew.x = rotation - skewX).
                        if (frame.skewY != undefined) {
                            this[k].skew.y = frame.skewY - this[k].rotation;
                        }
                        if (frame.skewX != undefined) {
                            this[k].skew.x = this[k].rotation - frame.skewX;
                        }
                    }
                    /**/
                }
            }
        }
    }
    destroy(options) {
        this.stop();
        ZUpdatables.removeUpdateAble(this);
        super.destroy(options);
    }
}
//# sourceMappingURL=ZTimeline.js.map