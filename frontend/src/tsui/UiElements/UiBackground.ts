import * as CssType from 'csstype';
import {UiElement} from './UiElement';

import {SxObject} from '../Mui/SxPropsUtil';

interface UiBackgroundParams {
    color?: CssType.Property.Color;
    background?: string;
}

export class UiBackground extends UiElement {
    color?: CssType.Property.Color;
    background?: string;

    constructor(i?: UiBackgroundParams) {
        super();
        if (i) Object.assign(this, i);
    }

    override onCss(): SxObject {
        let sx: SxObject = {
            backgroundColor: this.color,
            background: this.background,
        };
        
        return sx;
    }

    getColor = () => this.color ?? 'transparent';
}
