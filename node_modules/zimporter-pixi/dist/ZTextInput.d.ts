import { TextInputData } from "./SceneData";
import { ZContainer } from "./ZContainer";
export declare class ZTextInput extends ZContainer {
    private textInput;
    private props;
    /**
     * Constructs a `ZTextInput` container from scene-editor data.
     * Creates the underlying `TextInput` instance, applies all input and box styles
     * from `data.props`, and adds the input as a child.
     * @param data - The `TextInputData` exported from the scene editor.
     */
    constructor(data: TextInputData);
}
//# sourceMappingURL=ZTextInput.d.ts.map