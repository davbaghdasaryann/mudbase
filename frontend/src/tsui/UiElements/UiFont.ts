import { UiElement } from './UiElement'

import { SxObject } from '../Mui/SxPropsUtil'

export interface UiFontParams {
    fontSize?: number | string // CSS.Property.FontSize
    fontWeight?: number | string // CSS.Property.FontWeight
}

export class UiFont extends UiElement implements UiFontParams {
    fontSize?: number | string
    fontWeight?: number | string // CSS.Property.FontWeight

    constructor(i?: UiFontParams) {
        super()

        if (i) {
            Object.assign(this, i)
        } 
    }

    override onCss(): SxObject {
        return {
            fontSize: this.fontSize,
            fontWeight: this.fontWeight,
        }
    }

}
