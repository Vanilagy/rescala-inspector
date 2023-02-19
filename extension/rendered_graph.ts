import type { Graph, GraphNode } from "./graph";
import { GraphLayout } from "./graph_layout";
import { EaseType, Tweened } from "./tween";
import { catmullRom, lerp, quadraticBezierDerivative, remove, roundedRect } from "./utils";

const DUMMY_NODE_HEIGHT_FACTOR = 1/3;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 70;
const EDGE_ANIMATION_START = 0.5;

export class RenderedNode {
    layer: number = 0;
    x: number = 0;
    a: number;
    in: RenderedNode[] = [];
    out: RenderedNode[] = [];
    component: number = null;
    neighbor: RenderedNode = null;
    tweenedPosition = new Tweened<{ x: number, y: number}>(
        null,
        1000,
        (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }),
        EaseType.EaseOutElasticQuarter
    );
    visibility = new Tweened(
        0,
        1000,
        lerp,
        EaseType.EaseOutQuint
    );

    constructor(public node?: GraphNode) {
        this.visibility.target = 1;
    }

    get isDummy() {
        return !this.node;
    }

    get height() {
        return this.isDummy ? DUMMY_NODE_HEIGHT_FACTOR : 1;
    }

    computePosition() {
        let x = 350 * -this.layer;
        let y = 100 * this.x;

        return { x, y };
    }

    get visualPosition() {
        let actualPosition = this.computePosition();
        if (!this.tweenedPosition.target || this.tweenedPosition.target.x !== actualPosition.x || this.tweenedPosition.target.y !== actualPosition.y) {
            this.tweenedPosition.target = actualPosition;
        }

        let visibility = this.visibility.value;
        let pos = this.tweenedPosition.value;

        pos.y -= (1-visibility) * 100;

        return pos;
    }

    get visualHeight() {
        return lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.visibility.value);
    }

    get visualCenter() {
        let pos = this.visualPosition;
        pos.x += NODE_WIDTH/2;
        if (!this.isDummy) pos.y += this.visualHeight/2;

        return pos;
    }

    posOnBorder(angle: number) {
        let { x: centerX, y: centerY } = this.visualCenter;

        let margin = 7;
        let extendedWidth = NODE_WIDTH/2 + margin;
        let extendedHeight = this.visualHeight/2 + margin;

        let x = Math.cos(angle) * extendedWidth;
        let y = Math.sin(angle) * extendedHeight;

        if (Math.abs(Math.tan(angle)) < 1) { // equiv to Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let uh = extendedWidth / Math.abs(x);
            x *= uh;
            y *= uh;
        } else {
            let uh = extendedHeight / Math.abs(y);
            x *= uh;
            y *= uh;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
}

export class RenderedEdge extends Array<RenderedNode> {
    get span() {
        return this[0].layer - this[1].layer;
    }
}

export class RenderedGraph {
    ctx: CanvasRenderingContext2D;
    originX = window.innerWidth/2;
    originY = 100;
    scale = 1;
    showNodeBoundingBoxes = false;

    renderedNodes: RenderedNode[] = [];
    renderedEdges: RenderedEdge[] = [];
    nodeToRenderedNode = new WeakMap<GraphNode, RenderedNode>();
    graphHasChanged = true;

    layout = new GraphLayout(this);

    constructor(public graph: Graph, public canvas: HTMLCanvasElement) {
        graph.on('change', () => this.graphHasChanged = true);
        this.ctx = canvas.getContext('2d');
    }

    addNode(renderedNode: RenderedNode) {
        this.renderedNodes.push(renderedNode);
        if (renderedNode.node) this.nodeToRenderedNode.set(renderedNode.node, renderedNode);
    }

    addEdge(from: RenderedNode, to: RenderedNode) {
        this.renderedEdges.push(new RenderedEdge(from, to));

        from.out.push(to);
        to.in.push(from);
    }

    removeEdge(edge: RenderedEdge) {
        remove(this.renderedEdges, edge);
        remove(edge[0].out, edge[1]);
        remove(edge[1].in, edge[0]);
    }

    render() {
        let { ctx } = this;

        this.maybeReconcile();

        ctx.resetTransform();

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.translate(this.originX, this.originY);
        ctx.scale(this.scale, this.scale);

        for (let [index, edge] of this.renderedEdges.entries()) {
            this.drawEdge(edge, index);
        }

        for (let [index, node] of this.renderedNodes.entries()) {
            this.drawNode(node, index);
        }
    }

    drawNode(node: RenderedNode, n: number) {
        let { ctx } = this;
        let { x, y } = node.visualPosition;

        if (node.visibility.target === 0) node.visibility.target = 1;

        this.ctx.globalAlpha = node.visibility.value;

        if (!node.isDummy) {
            let label = node.node.label;
            let value = node.node.value;

            roundedRect(ctx, x, y, NODE_WIDTH, node.visualHeight, 6);

            ctx.strokeStyle = '#474a52';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#292a2d';
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.font = '14px Inter';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(node.node.id + ' | ' + label, x + NODE_WIDTH/2, y + node.visualHeight/2);

            if (node.node.value !== null) {
                ctx.font = '10px Inter';
                ctx.fillText(value, x+NODE_WIDTH/2, y + node.visualHeight - 10);
            }
        }

        if (this.showNodeBoundingBoxes) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
            roundedRect(ctx, x, y, NODE_WIDTH, 100 * node.height, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        this.ctx.globalAlpha = 1;
    }

    drawEdge(edge: RenderedEdge, n: number) {
        let { ctx } = this;

        if (edge[0].isDummy) return;

        // TODO: Transition from direct edge to dummy edge is wonky
        let visibility = edge[0].visibility.value * edge[1].visibility.value;
        ctx.globalAlpha = visibility;

        if (!edge[1].isDummy) {
            ctx.beginPath();
            
            let c1 = edge[0].visualCenter;
            let c2 = edge[1].visualCenter;
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x);
            const dampeningThreshold = Math.PI/6;
            if (Math.abs(angle) >= dampeningThreshold) {
                // Dampen the angle a bit
                angle = Math.sign(angle) * (dampeningThreshold + 0.5*(Math.abs(angle) - dampeningThreshold))
            }

            let { x: x1, y: y1 } = edge[0].posOnBorder(angle);
            let { x: x2, y: y2 } = edge[1].posOnBorder(Math.PI + angle);

            x2 = lerp(x1, x2, lerp(EDGE_ANIMATION_START, 1, visibility));
            y2 = lerp(y1, y2, lerp(EDGE_ANIMATION_START, 1, visibility));

            let cpx = (x1+x2)/2;
            let cpy = 0.2*y1 + 0.8*y2;
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cpx, cpy, x2, y2);

            let endAngle = Math.atan2(
                quadraticBezierDerivative(y1, cpy, y2, 1),
                quadraticBezierDerivative(x1, cpx, x2, 1)
            );

            this.drawArrow(n, x2, y2, endAngle);
        } else {
            let path = [edge[0], edge[1]];
            while (path.at(-1).isDummy) path.push(path.at(-1).out[0]);

            let points: { x: number, y: number }[] = [];

            for (let i = 0; i < path.length-1; i++) {
                let from = path[i];
                let to = path[i+1];

                let p1 = from.visualCenter;
                let p2 = to.visualCenter;
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (!from.isDummy) p1 = from.posOnBorder(angle);
                if (!to.isDummy) p2 = to.posOnBorder(Math.PI + angle);

                if (i === 0) points.push(p1);
                points.push(p2);
            }

            for (let point of points) {
                point.x = lerp(points[0].x, point.x, lerp(EDGE_ANIMATION_START, 1, visibility));
                point.y = lerp(points[0].y, point.y, lerp(EDGE_ANIMATION_START, 1, visibility));
            }

            points.unshift({
                x: points[0].x - (points[1].x - points[0].x),
                y: points[0].y - (points[1].y - points[0].y)
            });
            points.push({
                x: points.at(-1).x - (points.at(-2).x - points.at(-1).x),
                y: points.at(-1).y - (points.at(-2).y - points.at(-1).y)
            });

            ctx.beginPath();
            ctx.moveTo(points[1].x, points[1].y);
            let lastX = points[1].x;
            let lastY = points[1].y;
            let angle: number;
            for (let i = 0; i < points.length-3; i++) {
                let p0 = points[i+0];
                let p1 = points[i+1];
                let p2 = points[i+2];
                let p3 = points[i+3];
            
                for (let t = 0; t <= 1 + Number.EPSILON; t += 0.05) {
                    let x = catmullRom(t, p0.x, p1.x, p2.x, p3.x);
                    let y = catmullRom(t, p0.y, p1.y, p2.y, p3.y);
                    ctx.lineTo(x, y);

                    angle = Math.atan2(y-lastY, x-lastX);
                    lastX = x;
                    lastY = y;
                }
            }

            this.drawArrow(n, points.at(-2).x, points.at(-2).y, angle);
        }

        ctx.globalAlpha = 1;
    }

    drawArrow(n: number, endX: number, endY: number, endAngle: number) {
        let { ctx } = this;

        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(endAngle);

        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-7, 5);
        ctx.stroke();

        ctx.restore();
    }

    maybeReconcile() {
        if (!this.graphHasChanged) return;
        this.graphHasChanged = false;

        for (let node of this.graph.nodes) {
            if (this.nodeToRenderedNode.has(node)) continue;
            let renderedNode = new RenderedNode(node);
            this.addNode(renderedNode);
        }

        for (let edge of [...this.renderedEdges]) this.removeEdge(edge);

        for (let edge of this.graph.edges) {
            let from = this.nodeToRenderedNode.get(edge[0]);
            let to = this.nodeToRenderedNode.get(edge[1]);

            if (from.out.includes(to)) continue;
            this.addEdge(from, to);
        }
        
        console.log("baked", this.renderedEdges.filter(x => x[0].node?.id === 62 && x[1].node?.id === 9))

        this.layout.layOutNodes();
    }
}