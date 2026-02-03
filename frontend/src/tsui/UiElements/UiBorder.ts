import React from 'react'

import * as CSS from 'csstype'


import { UiElement } from './UiElement'

import * as Def from './UiDefaults'
import { SxObject } from '../Mui/SxPropsUtil'

export interface UiBorderParams {
    width?: number
    radius?: number
    color?: CSS.Property.Color
    style?: CSS.Property.BorderStyle
    boxSizing?: CSS.Property.BoxSizing
    useOutline?: boolean
    left?: boolean
    right?: boolean
    top?: boolean
    bottom?: boolean
}

export class UiBorder extends UiElement implements UiBorderParams {
    width?: number
    radius?: number // CSS.Property.BorderRadius
    color?: CSS.Property.Color
    style?: CSS.Property.BorderStyle
    boxSizing?: CSS.Property.BoxSizing
    useOutline?: boolean
    left?: boolean
    right?: boolean
    top?: boolean
    bottom?: boolean

    constructor(i?: UiBorderParams) {
        super()

        if (i) {
            //this.width = i.width ?? 0
            Object.assign(this, i)
        } 
    }

    override onCss(): SxObject {
        if (this.style === 'none') {
             return {
                 border: 'none',
             }
        }

        if (this.useOutline) {
            return {
                outlineWidth: this.width ?? 1,
                outlineOffset: -(this.width ?? 0),
                outlineColor: this.color ?? Def.defaultBorderColor,
                outlineStyle: this.style ?? Def.defaultBorderStyle,
            }
        }

            //css.borderWidth = this.width as CSS.Property.Width
            //css.borderRadius = this.radius as CSS.Property.Width

        let sx: SxObject = {
            boxSizing: this.boxSizing ?? Def.defaultBorderBoxSizing, //'border-box'
            borderRadius: this.radius, //this.radius as CSS.Property.Width
            //borderStyle: this.style ?? Def.defaultBorderStyle, //'solid'
        }
        

        if (this.top === undefined && this.right === undefined && this.bottom === undefined && this.left === undefined) {
            if (this.width !== undefined) {
                sx.borderWidth = this.width // as CSS.Property.Width
                sx.borderColor = this.color ?? Def.defaultBorderColor //'#ff0000' // as CssType.Property.Width;
                sx.borderStyle = this.style ?? Def.defaultBorderStyle
            }
            return sx
        }

        if (this.top) {
            sx.borderTopWidth = this.width
            sx.borderTopColor = this.color ?? Def.defaultBorderColor
            sx.borderTopStyle = (this.style ?? Def.defaultBorderStyle) as CSS.Property.BorderTopStyle
        }

        if (this.bottom) {
            sx.borderBottomWidth = this.width // as CSS.Property.Width
            sx.borderBottomColor = this.color ?? Def.defaultBorderColor //'#ff0000' // as CssType.Property.Width;
            sx.borderBottomStyle = (this.style ?? Def.defaultBorderStyle) as CSS.Property.BorderBottomStyle //'solid'
        }

        if (this.left) {
            sx.borderLeftWidth = this.width
            sx.borderLeftColor = this.color ?? Def.defaultBorderColor
            sx.borderLeftStyle = (this.style ?? Def.defaultBorderStyle) as CSS.Property.BorderTopStyle
        }

        if (this.right) {
            sx.borderRightWidth = this.width
            sx.borderRightColor = this.color ?? Def.defaultBorderColor
            sx.borderRightStyle = (this.style ?? Def.defaultBorderStyle) as CSS.Property.BorderTopStyle
        }



        // return {
        //     borderWidth: this.width, // as CSS.Property.Width
        //     borderRadius: this.radius, //this.radius as CSS.Property.Width
        //     borderColor: this.color ?? Def.defaultBorderColor, //'#ff0000' // as CssType.Property.Width;
        //     borderStyle: this.style ?? Def.defaultBorderStyle, //'solid'
        //     boxSizing: this.boxSizing ?? Def.defaultBorderBoxSizing, //'border-box'
        // }

        return sx
    }
}
