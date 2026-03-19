import { ZContainer } from "./ZContainer";
import { ZScene } from "./ZScene";
/**
 * Manages a stack of `ZScene` instances, providing static methods to manipulate the stack.
 *
 * This class allows pushing, popping, peeking, and clearing scenes from the stack.
 * It also provides utility methods to spawn entities from the topmost scene and resize all scenes in the stack.
 *
 * @remarks
 * - The stack is implemented as a static array, so all operations affect the global stack.
 * - The stack size and top index are tracked separately for efficient access.
 *
 * @public
 */
export declare class ZSceneStack {
    private static stack;
    private static stackSize;
    private static top;
    /**
     * Pushes a scene onto the top of the stack.
     * @param resource - The `ZScene` to push.
     */
    static push(resource: ZScene): void;
    /**
     * Removes and returns the scene at the top of the stack.
     * @returns The removed `ZScene`, or `null` if the stack is empty.
     */
    static pop(): ZScene | null;
    /**
     * Returns the scene at the top of the stack without removing it.
     * @returns The top `ZScene`, or `null` if the stack is empty.
     */
    static peek(): ZScene | null;
    /**
     * Returns the current number of scenes in the stack.
     * @returns The stack size.
     */
    static getStackSize(): number;
    /**
     * Removes all scenes from the stack and resets the size and top-of-stack index.
     */
    static clear(): void;
    /**
     * Searches the stack from top to bottom and calls `spawn(templateName)` on
     * each scene until one returns a container instance.
     * @param templateName - The template/asset name to spawn.
     * @returns The spawned `ZContainer`, or `undefined` if not found in any scene.
     */
    static spawn(templateName: string): ZContainer | undefined;
    /**
     * Calls `resize(width, height)` on every scene in the stack (top to bottom).
     * @param width - The new viewport width.
     * @param height - The new viewport height.
     */
    static resize(width: number, height: number): void;
}
//# sourceMappingURL=ZSceneStack.d.ts.map