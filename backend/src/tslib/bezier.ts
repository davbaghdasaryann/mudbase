import * as Geo from './geo';

export class BezierEasing {
    p = new Geo.Point();
    q = new Geo.Point();

    // Polynomial coefficients
    a = new Geo.Point();
    b = new Geo.Point();
    c = new Geo.Point();

    constructor(px = 0, py = 0, qx = 0, qy = 0) {
        this.set(px, py, qx, py);
    }

    set(px: number, py: number, qx: number, qy: number) {
        this.p.set(px, py);
        this.q.set(qx, qy);

        this.calcPolynomial();
    }

    setPoint(p: Geo.IPoint, q: Geo.IPoint) {
        this.set(p.x, p.y, q.x, q.y);
    }

    solve(t: number, epsilon = 1e-6) {
        if (t <= 0)
            return 0;
        if (t >= 1)
            return 1;
        return this.curveY(this.solveCurveX(t, epsilon));
    }


    // Calculate polynomial coefficients. 
    // First is assumed (0, 0). Last - (1, 1)
    private calcPolynomial() {
        this.c.x = this.p.x * 3;
        this.b.x = (this.q.x - this.p.x) * 3 - this.c.x;
        this.a.x = 1 - (this.c.x + this.b.x);

        this.c.y = this.p.y * 3;
        this.b.y = (this.q.y - this.p.y) * 3 - this.c.y;
        this.a.y = 1 - (this.c.y + this.b.y);
    }

    // a_x t^3 + b_x t^2 + c_x t
    private curveX(t: number): number {
        return ((this.a.x * t + this.b.x) * t + this.c.x) * t;
    }

    private curveY(t: number): number {
        return ((this.a.y * t + this.b.y) * t + this.c.y) * t;
    }

    private derivativeX(t: number): number {
        return (this.a.x * t * 3 + this.b.x * 2) * t + this.c.x;
    }

    private solveCurveX(x: number, epsilon = 1e-6) {
        // Some iteration of Newton's method
        let t = x;
        for (let i = 0; i < 8; i++) {
            let x2 = this.curveX(t) - x;
            if (Math.abs(x2) < epsilon) 
                return t;

            let d2 = this.derivativeX(t);
            if (Math.abs(d2) < epsilon) 
                break;

            t = t - x2 / d2;
        }

        // Use bisection method for more stability.
        let t0 = 0;
        let t1 = 1;
        t = x;

        for (let i = 0; i < 20; i++) {
            let x2 = this.curveX(t);
            if (Math.abs(x2 - x) < epsilon) 
                break;

            if (x > x2) {
                t0 = t;
            } else {
                t1 = t;
            }

            t = (t1 - t0) * 0.5 + t0;
        }

        return t;
    }


};
