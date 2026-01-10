import {IPoint, Point} from './point'
import {ISize, Size} from './size'

export interface IRect {
    x: number
    y: number
    w: number
    h: number
}

export class Rect {
    x: number = 0
    y: number = 0
    w: number = 0
    h: number = 0

    constructor(x = 0, y = 0, w = 0, h = 0) {
        ;[this.x, this.y, this.w, this.h] = [x, y, w, h]
    }

    setSize(s: IRect | ISize): Rect {
        ;[this.w, this.h] = [s.w, s.h]
        return this
    }

    setPos(p: IPoint): Rect {
        ;[this.x, this.y] = [p.x, p.y]
        return this
    }

    assign(r: IRect): Rect {
        ;[this.x, this.y, this.w, this.h] = [r.x, r.y, r.w, r.h]
        return this
    }

    set(x: number, y: number, w: number, h: number): Rect {
        ;[this.x, this.y, this.w, this.h] = [x, y, w, h]
        return this
    }

    getSize() {
        return new Size(this.w, this.h)
    }

    getPoint() {
        return new Point(this.x, this.y)
    }

    getTop() {
        return this.y + this.h
    }
    getRight() {
        return this.x + this.w
    }

    scale(s: number): Rect {
        this.x *= s
        this.y *= s
        this.w *= s
        this.h *= s
        return this
    }

    scaleSize(s: ISize): Rect {
        this.x *= s.w
        this.y *= s.h
        this.w *= s.w
        this.h *= s.h
        return this
    }

    divSize(s: ISize): Rect {
        this.x /= s.w
        this.y /= s.h
        this.w /= s.w
        this.h /= s.h
        return this
    }

    chop() {
        this.x = Math.floor(this.x)
        this.y = Math.floor(this.y)
        this.w = Math.floor(this.w)
        this.h = Math.floor(this.h)
        return this
    }

    isEqual(r: IRect): boolean {
        return this.x === r.x && this.y === r.y && this.w === r.w && this.h === r.h
    }

    containsPoint(p: IPoint): boolean {
        return p.x >= this.x && p.x < this.x + this.w && p.y >= this.y && p.y < this.y + this.h
    }
}

export function rectTop(r: Rect) {
    return r.y + r.h
}
export function rectRight(r: Rect) {
    return r.x + r.w
}

export function makeRect(ix?: number | IRect, iy?: number, iw?: number, ih?: number): Rect {
    if (ix === undefined)
        return new Rect()

    if (typeof ix === 'number') {
        return new Rect(ix, iy, iw, ih)
    }

    return new Rect(ix.x, ix.y, ix.w, ix.h)
}

export function arrayToRect(arr: number[]): Rect {
    return new Rect(arr[0], arr[1], arr[2], arr[3])
}
export function apiToRect(arr: number[]): Rect {
    return new Rect(arr[0], arr[1], arr[2], arr[3])
}
