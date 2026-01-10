import { UiElement } from './UiElement'

import { SxObject } from '../Mui/SxPropsUtil'

export interface UiShadowParams {
    fontSize?: number | string // CSS.Property.FontSize
    fontWeight?: number | string // CSS.Property.FontWeight
}

export class UiFont extends UiElement implements UiShadowParams {
    fontSize?: number | string
    fontWeight?: number | string // CSS.Property.FontWeight

    constructor(i?: UiShadowParams) {
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
