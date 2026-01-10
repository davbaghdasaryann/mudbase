import { UiElement } from './UiElement'
import { UiBorder } from './UiBorder'

import { SxObject } from '../Mui/SxPropsUtil'


export interface UiHoverParams {
    border?: UiBorder
    boxShadow?: string
    boxShadowColor?: string
}

export class UiHover extends UiElement implements UiHoverParams {
    border?: UiBorder
    boxShadow?: string
    boxShadowColor?: string

    constructor(i?: UiHoverParams) {
        super()

        if (i) {
            Object.assign(this, i)
        } 
    }

    override onCss(): SxObject {


        let boxShadow: string | undefined = undefined

        if (this.boxShadowColor) {
            boxShadow = `inset 0 0 0 2em ${this.boxShadowColor}`
        }

        if (this.boxShadow) {
            boxShadow = this.boxShadow
        }

        let sx: SxObject = {
            "&:hover": {
                ...(this.border && this.border!.sx()),
                // border: this.border ? this.border!.sx() : undefined,
                // border: undefined,
                // border: this.border!.sx(),
                boxShadow: boxShadow,
            }
        }

        // sx["&:hover"] = 


        // return {
        //     "&:hover": {
        //         border: this.border ? this.border.css() : undefined,
        //         boxShadow: this.boxShadowColor ? `inset 0 0 0 2em ${this.boxShadowColor}` : undefined,
        //     }
        // }

        return sx
    }

}
