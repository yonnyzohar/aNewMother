import { ZContainer } from "./ZContainer";
import { InstanceData } from "./SceneData";
import { IDestroyOptions } from "pixi.js";
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
export declare class ZTimeline extends ZContainer {
    [key: string]: any;
    totalFrames: number | undefined;
    _frames: any;
    currentFrame: number;
    looping: boolean;
    cuePoints: Record<number, string>;
    func: ((self: ZTimeline) => void) | undefined;
    constructor();
    setInstanceData(data: InstanceData, orientation: string): void;
    /**
     * Sets cue-point labels keyed by frame number. When playback reaches a
     * labelled frame, `ZCuePointsManager.triggerCuePoint` is called with the
     * label string and this timeline as the argument.
     * @param cuePoints - A map of `frameIndex -> cuePointName`.
     */
    setCuePoints(cuePoints: Record<number, string>): void;
    /**
     * Returns the raw frame-data object for all tracked children.
     * @returns The internal `_frames` record.
     */
    getFrames(): any;
    /**
     * Sets the frame data for all tracked children and calculates `totalFrames`
     * as the length of the longest child track.
     * @param value - A record mapping child instance names to their array of per-frame transform data.
     */
    setFrames(value: any): void;
    /**
     * Removes the end-of-timeline callback so no function is called when the
     * timeline finishes or loops.
     */
    removeStateEndEventListener(): void;
    /**
     * Registers a callback that is invoked each time the timeline reaches its last frame.
     * @param func - Called with this `ZTimeline` instance as the argument.
     */
    addStateEndEventListener(func: (self: ZTimeline) => void): void;
    /**
     * Registers this timeline (and all `ZTimeline` children) with `ZUpdatables`
     * so they receive `update()` calls each tick.
     */
    play(): void;
    /**
     * Unregisters this timeline (and all `ZTimeline` children) from `ZUpdatables`,
     * halting playback at the current frame.
     */
    stop(): void;
    /**
     * Jumps to `frameNum` and resumes playback from that point.
     * @param frameNum - The frame index to jump to.
     */
    gotoAndPlay(frameNum: number): void;
    /**
     * Called each tick by `ZUpdatables`. Applies the current frame's transforms,
     * fires any cue point at the current frame, increments the frame counter, and
     * handles looping / end-of-timeline notification.
     * @remarks Frame advancement is based on tick count, not elapsed time.
     */
    update(): void;
    /**
     * Jumps to `frameNum` and applies the transform data for every tracked child
     * at that frame (position, scale, rotation, pivot, alpha). Does not start or
     * stop playback.
     * @param frameNum - The frame index to display.
     */
    gotoAndStop(frameNum: number): void;
    destroy(options?: IDestroyOptions | boolean): void;
}
//# sourceMappingURL=ZTimeline.d.ts.map