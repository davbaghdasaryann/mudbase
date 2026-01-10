import { epsilon } from "./const";
import { IPoint } from "./point";

export interface IAngle {
    sin: number;
    cos: number;
    angle: number;
};

export class Angle implements IAngle {
    sin: number;
    cos: number;
    angle: number;

    constructor(sn?: number, cs?: number) {
        this.sin = sn !== undefined ? sn : 0;
        this.cos = cs !== undefined ? cs : 1;
        this.angle = this.calcAngle();
    }

    assign(a: IAngle): Angle {
        this.sin = a.sin;
        this.cos = a.cos;
        this.angle = a.angle;
        return this;
    }

    // Assigns inverse angle
    assignInv(a: IAngle): Angle {
        this.sin = -a.sin;
        this.cos = a.cos;
        this.angle = -a.angle;
        return this;
    }

    sub(a: IAngle): Angle {
        return this.set(this.angle - a.angle);
    }

    add(a: IAngle): Angle {
        return this.set(this.angle + a.angle);
    }
   

    setPos(pos: IPoint): Angle {
        if (Math.abs(pos.x) < epsilon) {
            if (Math.abs(pos.y) < epsilon)
                return this.setSinCos(0, 0);
            return this.setSinCos(Math.sign(pos.y), 0);
        }
    
        if (Math.abs(pos.y) < epsilon)
            return this.setSinCos(0, Math.sign(pos.x));
    
        let l = Math.hypot(pos.x, pos.y);
        return this.setSinCos(pos.y / l, pos.x / l);
    }

    setSinCos(sin: number, cos: number): Angle {
        this.sin = sin;
        this.cos = cos;
        this.angle = this.calcAngle();
        return this;
    }

    set(a: number): Angle {
        this.angle = a;
        this.sin = Math.sin(a);
        this.cos = Math.cos(a);
        return this;
    }

    setInfinity(): Angle {
        this.sin = this.cos = 0;
        this.angle = Infinity;
        return this;
    }

    isInfinity(): boolean {
        return this.angle === Infinity;
    }

    calcAngle(): number { return calcSinCosAngle(this.sin, this.cos); }

};

// Sine and cosine calculations
export function calcPosSinCos(x: number, y: number): [number, number] {
    if (Math.abs(x) < epsilon) {
        if (Math.abs(y) < epsilon)
            return [0, 0];

        return [Math.sign(y), 0];
    }

    if (Math.abs(y) < epsilon) {
        return [0, Math.sign(x)];
    }

    let l = Math.hypot(x, y);
    return [y / l, x / l];
}

export function calcSinCosAngle(sin: number, cos: number): number {
    if (sin === 0 && cos === 0)
        return Infinity;

    if (sin === 0)
        return cos > 0 ? 0 : Math.PI;

    if (cos === 0)
        return sin > 0 ? Math.PI/2 : -Math.PI/2;

    return cos > 0 ? Math.asin(sin) : Math.PI - Math.asin(sin);
}

