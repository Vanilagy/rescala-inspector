import { animationDuration } from "./rendered_graph";
import type { RenderedNode } from "./rendered_node";
import { Tweened, EaseType } from "./tween";
import { lerp, type Path, quadraticBezier, catmullRom, lerpPoints, lerpPaths } from "./utils";

let renderedEdgeId = 0;
export class RenderedEdge extends Array<RenderedNode> {
    id = renderedEdgeId++;
    waypoints: RenderedNode[] = [this[0], this[1]];
    tweenedPath = new Tweened<{ x: number, y: number }[]>(
        null,
        animationDuration,
        lerpPaths,
        EaseType.EaseOutElasticQuarter,
        true
    );
    visibility = new Tweened(
        0,
        (_, to: number) => (to === 0 ? 0.4 : 1) * animationDuration(),
        lerp,
        EaseType.EaseOutQuint
    );

    constructor(from: RenderedNode, to: RenderedNode) {
        super(from, to);
    }

    computePath(time?: number) {
        let path: Path = [];

        if (this.waypoints.length === 2) {
            let c1 = this[0].visualCenter(time);
            let c2 = this[1].visualCenter(time);
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x);
            const dampeningThreshold = Math.PI/6;
            if (Math.abs(angle) >= dampeningThreshold) {
                // Dampen the angle a bit
                angle = Math.sign(angle) * (dampeningThreshold + 0.5*(Math.abs(angle) - dampeningThreshold))
            }

            let { x: x1, y: y1 } = this[0].posOnBorder(angle, time);
            let { x: x2, y: y2 } = this[1].posOnBorder(Math.PI + angle, time);

            let cpx = (x1+x2)/2;
            let cpy = lerp(y1, y2, 0.8);

            for (let i = 0; i <= 20; i++) {
                let t = i/20;
                path.push({
                    x: quadraticBezier(x1, cpx, x2, t),
                    y: quadraticBezier(y1, cpy, y2, t)
                });
            }
        } else {
            let points: { x: number, y: number }[] = [];

            for (let i = 0; i < this.waypoints.length-1; i++) {
                let from = this.waypoints[i];
                let to = this.waypoints[i+1];

                let p1 = from.visualCenter(time);
                let p2 = to.visualCenter(time);
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (!from.layoutNode.isDummy) p1 = from.posOnBorder(angle, time);
                if (!to.layoutNode.isDummy) p2 = to.posOnBorder(Math.PI + angle, time);

                if (i === 0) points.push(p1);
                points.push(p2);
            }

            points.unshift({
                x: points[0].x - (points[1].x - points[0].x),
                y: points[0].y - (points[1].y - points[0].y)
            });
            points.push({
                x: points.at(-1).x - (points.at(-2).x - points.at(-1).x),
                y: points.at(-1).y - (points.at(-2).y - points.at(-1).y)
            });

            path.push(points[1]);
            for (let i = 0; i < points.length-3; i++) {
                let p0 = points[i+0];
                let p1 = points[i+1];
                let p2 = points[i+2];
                let p3 = points[i+3];
            
                for (let j = 1; j <= 20; j++) {
                    let t = j/20;
                    let x = catmullRom(t, p0.x, p1.x, p2.x, p3.x);
                    let y = catmullRom(t, p0.y, p1.y, p2.y, p3.y);
                    path.push({ x, y });
                }
            }
        }

        return path;
    }
}