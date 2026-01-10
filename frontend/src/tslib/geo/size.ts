export interface ISize {
    w: number
    h: number
}

export interface SizeParam {
    w: number
    h: number
}

export class Size implements ISize {
    w: number
    h: number

    constructor(w = 0, h = 0) {
        this.w = w
        this.h = h
    }

    set(w: number, h: number) {
        ;[this.w, this.h] = [w, h]
        return this
    }

    assign(s: ISize) {
        ;[this.w, this.h] = [s.w, s.h]
        return this
    }

    clone(): Size {
        return new Size(this.w, this.h)
    }
    tuple(): [number, number] {
        return [this.w, this.h]
    }

    add(s: ISize) {
        this.w += s.w
        this.h += s.h
        return this
    }

    scale(s: number) {
        this.w *= s
        this.h *= s
        return this
    }

    scaleWH(w: number, h: number) {
        this.w *= w
        this.h *= h
        return this
    }

    scaleSize(s: ISize) {
        this.w *= s.w
        this.h *= s.h
        return this
    }

    divSize(s: ISize) {
        this.w /= s.w
        this.h /= s.h
        return this
    }

    floor() {
        this.w = Math.floor(this.w)
        this.h = Math.floor(this.h)
        return this
    }

    chop() {
        this.w = Math.floor(this.w)
        this.h = Math.floor(this.h)
        return this
    }
}

export type SizeTuple = number[]

//Size.prototype.toString = function SizeToString() {
//    return `${this.w}, ${this.h}`;
//}

export function sizeTuple(s: Size): [number, number] {
    return [s.w, s.h]
}
export function makeSize(w: number, h: number): Size {
    return new Size(w, h)
}
export function arrayToSize(arr: number[]): Size {
    return new Size(arr[0], arr[1])
}
export function apiToSize(arr: number[]): Size {
    return new Size(arr[0], arr[1])
}
