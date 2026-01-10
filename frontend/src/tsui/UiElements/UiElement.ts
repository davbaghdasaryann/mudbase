import React from 'react'

import {makeSxProps, SxObject, SxPropsParam} from '../Mui/SxPropsUtil'


import * as CSS from 'csstype'
import { uiGetPixelValue, uiGetWidthValue } from './UiUtil'

export class UiElement {
    css(override?: CSS.Properties): SxObject {
        let css = this.onCss()

        // if (override) {
        //     for (let key of Object.keys(override)) {
        //         css[key] = override[key]
        //     }
        // }
        
        return css
    }

    sx(override?: CSS.Properties): SxObject {
        let css = this.css(override)
        //return makeSxProps(css)
        return css as SxObject
    }

    apply(el: HTMLElement | undefined | null | React.RefObject<any>, override?: CSS.Properties) {
        if (!el) return

        let style: CSSStyleDeclaration

        if (el instanceof HTMLElement) {
            style = el.style
        } else {
            if (!el.current) return
            style = el.current.style
        }

        let sx = this.sx(override)

        // if (Array.isArray(css)) {
        // }

        if (sx) {
            if (Array.isArray(sx)) {
                for (let isx of sx) {
                    this.applySxToDom(style, isx)
                    // for (let key of Object.keys(isx)) {
                    //     style[key] = sx[key]
                    // }
                }
            } else {
                this.applySxToDom(style, sx)
                // for (let key of Object.keys(sx)) {
                //     style[key] = sx[key]
                // }
            }
        }
    }

    private applySxToDom(style: CSSStyleDeclaration, sx: SxObject) {
        if (!sx)
            return

        for (let key of Object.keys(sx)) {
            let val = sx[key]

            if (val === undefined)
                continue

            
            switch(key) {
            case 'width': 
            case 'height': 
                val = uiGetWidthValue(val)
                break

            case 'borderWidth': 
            case 'borderRadius':
                val = uiGetPixelValue(val)
                break
            default:
                break
            }

            if (val === undefined)
                continue

            //console.debug(key, sx[key], val)

            style[key] = val
        }
    }


    onCss(): SxObject {
        return {}
    }
}
