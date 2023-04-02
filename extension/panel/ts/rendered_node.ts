import type { LayoutNode } from './layout_graph';
import { animationDuration, type RenderedGraph, NODE_WIDTH, NODE_HEIGHT } from './rendered_graph';
import type { ReScalaValue } from './re_scala';
import { Tweened, EaseType } from './tween';
import { type Point, lerpPoints, lerp } from './utils';

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
		const x = 350 * -this.layoutNode.layer;
		const y = 100 * this.layoutNode.x;
		const pos = { x, y };

		if (center) {
			pos.x += NODE_WIDTH/2;
			pos.y += NODE_HEIGHT/2;
		}

		return pos;
	}

	visualPosition(time?: number) {
		const actualPosition = this.computePosition();
		if (
			!this.tweenedPosition.target
			|| this.tweenedPosition.target.x !== actualPosition.x
			|| this.tweenedPosition.target.y !== actualPosition.y
		) {
			this.tweenedPosition.target = actualPosition;
		}

		const entryCompletion = this.entryCompletion.valueAt(time);
		const pos = this.tweenedPosition.valueAt(time);

		pos.y -= (1 - entryCompletion) * 100;

		return pos;
	}

	visualHeight(time?: number) {
		return lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.entryCompletion.valueAt(time));
	}

	visualCenter(time?: number) {
		const pos = this.visualPosition(time);
		pos.x += NODE_WIDTH/2;
		pos.y += this.visualHeight(time)/2;

		return pos;
	}

	posOnBorder(angle: number, time?: number) {
		const { x: centerX, y: centerY } = this.visualCenter(time);

		const margin = 7;
		const extendedWidth = NODE_WIDTH/2 + margin;
		const extendedHeight = NODE_HEIGHT/2 + margin;

		let x = Math.cos(angle) * extendedWidth;
		let y = Math.sin(angle) * extendedHeight;

		if (Math.abs(Math.tan(angle)) < 1) { // equiv to Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
			const fac = extendedWidth / Math.abs(x);
			x *= fac;
			y *= fac;
		} else {
			const fac = extendedHeight / Math.abs(y);
			x *= fac;
			y *= fac;
		}

		return {
			x: centerX + x,
			y: centerY + y
		};
	}
}