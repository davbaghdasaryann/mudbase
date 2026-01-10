import * as Geo from './geo';

export type MtxArray = Float32Array;

export class Mtx4 {
    a = new Float32Array(16);


    eye() { eye(this.a); }
    scale(s: number){  scale(this.a, s); }

    setScale(s: number) {
        this.a[15] = 1/s;
    }

    setTranslation(p: Geo.IPoint) {
        this.a[12] = p.x;
        this.a[13] = p.y;
    }

    setTranslationXY(x: number, y: number) {
        this.a[12] = x;
        this.a[13] = y;
    }

    setRotationSinCos(sin: number, cos: number) {setRotationSinCos(this.a, sin, cos);}
    setRotationSinCosInv(sin: number, cos: number) {setRotationSinCosInv(this.a, sin, cos);}
    setRotationAngle(theta: Geo.IAngle) {this.setRotationSinCos(theta.sin, theta.cos);}
    setRotationAngleInv(theta: Geo.IAngle) {this.setRotationSinCosInv(theta.sin, theta.cos);}


    // Projection matrices
    ortho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        this.a.fill(0);

        this.a[0] = -2 * lr;
        this.a[5] = -2 * bt;
        this.a[10] = 2 * nf;
        this.a[12] = (left + right) * lr;
        this.a[13] = (top + bottom) * bt;
        this.a[14] = (far + near) * nf;
        this.a[15] = 1;
    }


};

// Mtx4.prototype.toString = function Mtx4ToString() {
//     let s = `${this.a[0]} `;
//     return s;
// }

export function create4(): Mtx4 {
    return new Mtx4();
}

export function createEye4(): Mtx4 {
    let m = new Mtx4();
    m.eye();
    return m;
}

//export type Mtx4 = mat4;

//Mtx4.


//export type Mtx4 = mat4;

//mat4.proto

//export function create(): Mtx4 {
//}


export function eye(m: MtxArray) {
    m.fill(0);
    m[0] = m[5] = m[10] = m[15] = 1;
}

export function scale(m: MtxArray, s: number) {
    for (let i in m) {
        m[i] *= s;
    }
}

export function setRotationSinCos(m: MtxArray, sin: number, cos: number)
{
    m[0] = cos;
    m[1] = -sin;
    m[4] = sin;
    m[5] = cos;
}

// Clockwise
export function setRotationSinCosInv(m: MtxArray, sin: number, cos: number)
{
    m[0] = cos;
    m[1] = sin;
    m[4] = -sin;
    m[5] = cos;
}

export function setRotationAngle(m: MtxArray, a: Geo.IAngle) {
    setRotationSinCos(m, a.sin, a.cos);
}

export function setRotationAngleInv(m: MtxArray, a: Geo.IAngle) {
    setRotationSinCosInv(m, a.sin, a.cos);
}

export function setTranslation(m: MtxArray, p: Geo.IPoint) {
    m[12] = p.x;
    m[13] = p.y;
}

export function setTranslationSub(m: MtxArray, p: Geo.IPoint) {
    m[12] = -p.x;
    m[13] = -p.y;
}

