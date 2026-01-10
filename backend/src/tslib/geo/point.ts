import * as cmath from '../cmath';
import { ISize } from './size';


export interface IPoint {
    x: number;
    y: number;
}    

// export interface PointParam {
//     x: number;
//     y: number;
// }    

export class Point implements IPoint {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        [this.x, this.y] = [x, y];
    }

    assign(p: IPoint) {
        [this.x, this.y] = [p.x, p.y];
        return this;
    }

    set(x: number, y: number) {
        [this.x, this.y] = [x, y];
        return this;
    }

    clone() { return new Point(this.x, this.y); }
    tuple() { return [this.x, this.y]; }

    sub(p: IPoint) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    }

    add(p: IPoint) {
        this.x += p.x;
        this.y += p.y;
        return this;
    }

    scale(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    scaleSize(s: ISize) {
        this.x *= s.w;
        this.y *= s.h;
        return this;
    }

    equ(p: IPoint) { return this.x === p.x && this.y === p.y; }

    lerp(a: IPoint, b: IPoint, lambda: number) {
        this.x = cmath.lerp(a.x, b.x, lambda);
        this.y = cmath.lerp(a.y, b.y, lambda);
        return this;
    }

    norm() {  return Math.hypot(this.x, this.y); }
}

//export type PointTuple = [number, number];
export type PointTuple = number [];

// Point instantiation
export function makePoint(x: number, y: number): Point { return new Point(x, y); }
export function clonePoint(p: IPoint): Point { return new Point(p.x, p.y); }
export function arrayToPoint(arr: number[]): Point { return new Point(arr[0], arr[1]);  }
export function apiToPoint(arr: number[]): Point { return new Point(arr[0], arr[1]);  }
export function convertPoint(pt: any): Point { return new Point(pt.x, pt.y); }

export function makePointSub(a: IPoint, b: IPoint): Point {
    return new Point(a.x - b.x, a.y - b.y);
}

export function makePointAdd(a: IPoint, b: IPoint): Point {
    return new Point(a.x + b.x, a.y + b.y);
}

export function makePointScale(a: IPoint, s: number): Point {
    return new Point(a.x * s, a.y * s);
}

export function makePointRotate(p: IPoint, sin: number, cos: number): Point {
    return new Point(
        cos * p.x - sin * p.y,
        sin * p.x + cos * p.y);
}

// Counterclockwise
export function makePointRotateCC(p: IPoint, sin: number, cos: number): Point {
    return new Point(
        cos * p.x + sin * p.y,
      - sin * p.x + cos * p.y);
}

export function rotatePoint(p: IPoint, sin: number, cos: number) {
    let x = cos * p.x - sin * p.y;
    let y = sin * p.x + cos * p.y;
    p.x = x;
    p.y = y;
}

// Counterclockwise
export function rotatePointCC(p: IPoint, sin: number, cos: number) {
    let x =   cos * p.x + sin * p.y;
    let y = - sin * p.x + cos * p.y;
    p.x = x;
    p.y = y;
}

export function pointDist(p: IPoint, q: IPoint) {
    return Math.hypot(p.x - q.x, p.y - q.y);
}

