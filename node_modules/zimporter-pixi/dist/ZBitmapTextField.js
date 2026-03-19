import * as PIXI from 'pixi.js';
export class ZBitmapTextField extends PIXI.BitmapText {
    setName(_name, placement = "") {
        this.name = _name;
        if (placement == "middle") {
            this.pivot.x = this.width * 0.5;
            this.pivot.y = this.height * 0.5;
        }
    }
    setText(str) {
        ////console.log("setText " + str);
        this.text = str;
    }
    killMe() {
        this.parent?.removeChild(this);
    }
}
//# sourceMappingURL=ZBitmapTextField.js.map