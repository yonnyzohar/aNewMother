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
export class ZSceneStack {
    //the following is a stack of resources of tyoe T
    static stack = [];
    static stackSize = 0;
    static top = 0;
    /**
     * Pushes a scene onto the top of the stack.
     * @param resource - The `ZScene` to push.
     */
    static push(resource) {
        this.stack[this.top] = resource;
        this.top++;
        this.stackSize++;
    }
    /**
     * Removes and returns the scene at the top of the stack.
     * @returns The removed `ZScene`, or `null` if the stack is empty.
     */
    static pop() {
        if (this.stackSize > 0) {
            this.top--;
            this.stackSize--;
            return this.stack[this.top];
        }
        return null;
    }
    /**
     * Returns the scene at the top of the stack without removing it.
     * @returns The top `ZScene`, or `null` if the stack is empty.
     */
    static peek() {
        if (this.stackSize > 0) {
            return this.stack[this.top - 1];
        }
        return null;
    }
    /**
     * Returns the current number of scenes in the stack.
     * @returns The stack size.
     */
    static getStackSize() {
        return this.stackSize;
    }
    /**
     * Removes all scenes from the stack and resets the size and top-of-stack index.
     */
    static clear() {
        this.stack = [];
        this.stackSize = 0;
        this.top = 0;
    }
    //////
    /**
     * Searches the stack from top to bottom and calls `spawn(templateName)` on
     * each scene until one returns a container instance.
     * @param templateName - The template/asset name to spawn.
     * @returns The spawned `ZContainer`, or `undefined` if not found in any scene.
     */
    static spawn(templateName) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene = this.stack[i];
            let ent = gameScene.spawn(templateName);
            if (ent) {
                return ent;
            }
        }
    }
    /**
     * Calls `resize(width, height)` on every scene in the stack (top to bottom).
     * @param width - The new viewport width.
     * @param height - The new viewport height.
     */
    static resize(width, height) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            let gameScene = this.stack[i];
            gameScene.resize(width, height);
        }
    }
}
//# sourceMappingURL=ZSceneStack.js.map