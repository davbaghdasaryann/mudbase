import { StandardCSSProperties } from '@mui/system'

import * as Geo from '@/tslib/geo'

import { SxObject } from '../Mui/SxPropsUtil'
import { UiElement } from './UiElement'

export interface UiLayoutParams {
    position?: StandardCSSProperties['position']
    width?: number
    height?: number

    top?: StandardCSSProperties['top']
    right?: StandardCSSProperties['right']
    bottom?: StandardCSSProperties['bottom']
    left?: StandardCSSProperties['left']
    transform?: string

    transformAbsoluteCenter?: boolean
    transformAbsoluteCenterX?: boolean
}

export class UiLayout extends UiElement implements UiLayoutParams {
    position?: StandardCSSProperties['position']
    width?: number
    height?: number

    top?: StandardCSSProperties['top']
    right?: StandardCSSProperties['right']
    bottom?: StandardCSSProperties['bottom']
    left?: StandardCSSProperties['left']

    transform?: string
    transformAbsoluteCenter?: boolean
    transformAbsoluteCenterX?: boolean

    constructor(i?: UiLayoutParams) {
        super()

        if (i) {
            Object.assign(this, i)
        } 
    }

    override onCss(): SxObject{

        let sx: SxObject = {
            position: this.position,
            left: this.left,
            top: this.top,
            right: this.right,
            bottom: this.bottom,

            width: this.width,
            height: this.height,

            //p: 1,
        }

        if (this.transformAbsoluteCenter === true) {
            sx.left = '50%'
            sx.top = '50%'
            sx.transform = 'translate(-50%, -50%)'
        }

        if (this.transformAbsoluteCenterX === true) {
            sx.left = '50%'
            sx.transform = 'translate(-50%)'
        }


        if (this.transform) {
            sx.transform = this.transform
        }

        return sx
    }


    setAbsoluteCenter(f: boolean) {
        this.transformAbsoluteCenter = f

        if (f) {
            this.transformAbsoluteCenterX = false
            this.right = undefined
            this.bottom = undefined
        }
    }

    setAbsoluteCenterX(f: boolean) {
        this.transformAbsoluteCenterX = f

        if (f) {
            this.transformAbsoluteCenter = false
            this.right = undefined
        }
    }

    getWidth(): number {
        if (this.width !== undefined)
            return this.width
        if (this.right !== undefined && this.left !== undefined)
            return (this.right as number) - (this.left as number)
        return 0
    }

    getHeight(): number {
        if (this.height !== undefined)
            return this.height
        if (this.top !== undefined && this.bottom !== undefined)
            return this.getPropVal(this.bottom) - this.getPropVal(this.top)
        return 0
    }

    getTop(): number {
        if (this.top !== undefined) return this.getPropVal(this.top)
        return this.getPropVal(this.bottom) + this.getPropVal(this.height)
    }

    getRight(): number {
        if (this.right !== undefined) return this.right as number
        return (this.left! as number) + this.width!
    }

    getLeft(): number {
        if (this.left !== undefined) return this.left as number
        return (this.right! as number) - this.width!
    }

    setSize(s: Geo.ISize) {
        this.width = s.w
        this.height = s.h
    }

    scaleSize(sw: number | Geo.ISize, sh?: number) {

        if (typeof sw === 'number') {
            if (sh === undefined)
                sh = sw

            if (this.width)
                this.width *= sw
            if (this.height)
                this.height *= sh
        } else {
            this.scaleSize(sw.w, sw.h)
        }
    }

    getSize() {
        return Geo.makeSize(this.getWidth(), this.getHeight())
    }


    private getPropVal(prop: any): number {
        if (prop === undefined) return 0
        if (typeof prop === 'number') return prop
        return 0
    }

}


