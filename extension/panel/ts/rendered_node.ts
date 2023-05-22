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

	// Separate entry and exit completions as they have different animations
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
		this.entryCompletion.target = 1; // Fade in
	}

	get in() {
		return this.layoutNode.in.map(x => this.renderedGraph.layoutToRenderedNode.get(x));
	}

	get out() {
		return this.layoutNode.out.map(x => this.renderedGraph.layoutToRenderedNode.get(x));
	}

	/** Computes the screen coordinates of the top-left corner of the node. */
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

	/** Computes the animated screen coordinates of the top-left corner of the node. */
	visualPosition(time?: number) {
		const actualPosition = this.computePosition();
		if (
			!this.tweenedPosition.target
			|| this.tweenedPosition.target.x !== actualPosition.x
			|| this.tweenedPosition.target.y !== actualPosition.y
		) {
			// Update the tweened variable if the position has changed
			this.tweenedPosition.target = actualPosition;
		}

		const entryCompletion = this.entryCompletion.valueAt(time);
		const pos = this.tweenedPosition.valueAt(time);

		pos.y -= (1 - entryCompletion) * 100;

		return pos;
	}

	visualHeight(time?: number) {
		return this.layoutNode.height * lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.entryCompletion.valueAt(time));
	}

	visualCenter(time?: number) {
		const pos = this.visualPosition(time);
		pos.x += NODE_WIDTH/2;
		pos.y += this.visualHeight(time)/2;

		return pos;
	}

	// Find the position on the border of the node based on an angle, from the center of the node
	posOnBorder(angle: number, time?: number) {
		const { x: centerX, y: centerY } = this.visualCenter(time);

		const margin = 7;
		const extendedWidth = NODE_WIDTH / 2 + margin;
		const extendedHeight = NODE_HEIGHT / 2 + margin;

		const aspectRatio = extendedHeight / extendedWidth;

		const x = Math.cos(angle);
		const y = Math.sin(angle);

		const t = Math.abs(x * aspectRatio) > Math.abs(y) ? Math.abs(extendedWidth / x) : Math.abs(extendedHeight / y);
		const borderX = centerX + x * t;
		const borderY = centerY + y * t;

		return { x: borderX, y: borderY };
	}
}