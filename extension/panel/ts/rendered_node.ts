import type { LayoutNode } from "./layout_graph";
import { animationDuration, type RenderedGraph, NODE_WIDTH, NODE_HEIGHT } from "./rendered_graph";
import type { ReScalaValue } from "./re_scala";
import { Tweened, EaseType } from "./tween";
import { type Point, lerpPoints, lerp } from "./utils";

export class RenderedNode {
    tweenedPosition = new Tweened<Point>(
        null,
        animationDuration,
        lerpPoints,
        EaseType.EaseOutElasticQuarter
    );
    entryCompletion = new Tweened(
        0,
        animationDuration,
        lerp,
        EaseType.EaseOutQuint
    );
    exitCompletion = new Tweened(
        0,
        () => 0.4 * animationDuration(),
        lerp,
        EaseType.EaseOutQuint
    );
    valueChangeCompletion = new Tweened(
        1,
        () => 0.75 * animationDuration(),
        lerp
    );
    lastRenderedValue: ReScalaValue = null;

    constructor(public layoutNode: LayoutNode, public renderedGraph: RenderedGraph) {
        this.entryCompletion.target = 1;
    }

    get in() {
        return this.layoutNode.in.map(x => this.renderedGraph.layoutToRenderedNode.get(x));
    }
    
    get out() {
        return this.layoutNode.out.map(x => this.renderedGraph.layoutToRenderedNode.get(x));
    }

    computePosition(center = false): Point {
        let x = 350 * -this.layoutNode.layer;
        let y = 100 * this.layoutNode.x;
        let pos = { x, y };

        if (center) {
            pos.x += NODE_WIDTH/2;
            pos.y += NODE_HEIGHT/2;
        }

        return pos;
    }

    visualPosition(time?: number) {
        let actualPosition = this.computePosition();
        if (!this.tweenedPosition.target || this.tweenedPosition.target.x !== actualPosition.x || this.tweenedPosition.target.y !== actualPosition.y) {
            this.tweenedPosition.target = actualPosition;
        }

        let entryCompletion = this.entryCompletion.valueAt(time);
        let pos = this.tweenedPosition.valueAt(time);

        pos.y -= (1 - entryCompletion) * 100;

        return pos;
    }

    visualHeight(time?: number) {
        return lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.entryCompletion.valueAt(time));
    }

    visualCenter(time?: number) {
        let pos = this.visualPosition(time);
        pos.x += NODE_WIDTH/2;
        pos.y += this.visualHeight(time)/2;

        return pos;
    }

    posOnBorder(angle: number, time?: number) {
        let { x: centerX, y: centerY } = this.visualCenter(time);

        let margin = 7;
        let extendedWidth = NODE_WIDTH/2 + margin;
        let extendedHeight = NODE_HEIGHT/2 + margin;

        let x = Math.cos(angle) * extendedWidth;
        let y = Math.sin(angle) * extendedHeight;

        if (Math.abs(Math.tan(angle)) < 1) { // equiv to Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let fac = extendedWidth / Math.abs(x);
            x *= fac;
            y *= fac;
        } else {
            let fac = extendedHeight / Math.abs(y);
            x *= fac;
            y *= fac;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
}