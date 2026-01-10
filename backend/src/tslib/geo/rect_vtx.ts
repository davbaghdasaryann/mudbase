import { epsilon } from "./const";
import { IPoint, Point } from "./point";
import { IRect } from "./rect";


export class RectVtx {
    lb = new Point();  // left bottom
    lt = new Point();  // left top
    rt = new Point();  // right top
    rb = new Point();  // right bottom

    setRect(r: IRect) {
        this.lb.set(r.x, r.y);
        this.lt.set(r.x, r.y + r.h);
        this.rt.set(r.x + r.w, r.y + r.h);
        this.rb.set(r.x + r.w, r.y);
    }

    calcPointEdgeDistance = RectVtx_calcPointEdgeDistance;

}

/*
// Calculates the distance from a point to the closest edge
// Negative if the point is inside the rectangle
// Accepts optional rectangle width and height parameters to speed up the calculation


    // Test Code
    let rect = new Geo.Rect(1, 1, 3, 3);
    let vrect = new Geo.RectVtx();
    vrect.setRect(rect);
    let pt = new Geo.Point(3, 3.5);
    let dist = vrect.calcPointEdgeDistance(pt, rect.w, rect.h);

    console.debug(dist);
*/

class CalcPointDistanceState {
    inside = true;
    minRidgeDist = Number.MAX_SAFE_INTEGER;  // Closest distance to the edges
    minVtxDistSqr = Number.MAX_SAFE_INTEGER; // Closes distance to the vertices
    length?: number;  // Calculate edge length
}

// class CaclPointtDistanceResult {
//     inside = true;
// }

function calcPointDistance(p1: IPoint, p2: IPoint, pt: IPoint, st: CalcPointDistanceState, length?: number) {
    let [v1x, v1y] = [p2.x - p1.x, p2.y - p1.y];
    let [v2x, v2y] = [pt.x - p1.x, pt.y - p1.y];

    // We calculate distance to the line only if we are inside
    if (st.inside) {
        let cross = v1x * v2y - v2x * v1y;

        if (cross > 0) {
            st.inside = false;
        } else {
            let norm = length ?? Math.hypot(v1x, v1y);
            st.length = norm;

            let ridgeDist = Math.abs(cross) / norm;

            if (ridgeDist < st.minRidgeDist)
                st.minRidgeDist = ridgeDist;
        }
    }

    // Now calculate distance to the first point
    let ptDistSqr = v2x*v2x + v2y*v2y;
    if (ptDistSqr < st.minVtxDistSqr)
        st.minVtxDistSqr = ptDistSqr;
}

function RectVtx_calcPointEdgeDistance(this: RectVtx, pt: IPoint, width?: number, height?: number): number {
    let st = new CalcPointDistanceState();

    calcPointDistance(this.lb, this.lt, pt, st, height);
    let h = st.length;
    if (st.minVtxDistSqr < epsilon)
        return 0;

    calcPointDistance(this.lt, this.rt, pt, st, width);
    if (st.minVtxDistSqr < epsilon)
        return 0;
    let w = st.length;


    calcPointDistance(this.rt, this.rb, pt, st, h);
    if (st.minVtxDistSqr < epsilon)
        return 0;

    calcPointDistance(this.rb, this.lb, pt, st, w);
    if (st.minVtxDistSqr < epsilon)
        return 0;
   
    // Now choose the correct distance 
    // For inside we choose the closet distance to ridges
    // For outside we pick closes distance to the vertices
    if (st.inside) {
        return -st.minRidgeDist;
    } else {
        return Math.sqrt(st.minVtxDistSqr);
    }
}

