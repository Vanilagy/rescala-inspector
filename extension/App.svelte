<script lang="ts">
    import { onMount } from "svelte";

    const NODE_WIDTH = 100;
    const NODE_HEIGHT = 70;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;
    let originX = 200;
    let originY = 200;
    
    onMount(() => {
        ctx = canvas.getContext('2d', { desynchronized: true });
        render();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!spacePressed || !mouseHeld) return;

        originX += e.movementX; 
        originY += e.movementY;
    };

    interface Node {
        label: string,
        value: string,
        depth?: number,
        height?: number
    }
    type Edge = {
        from: Node,
        to: Node
    };

    let n1: Node = { label: 'username', value: '"Vanilagy"' };
    let n4: Node = { label: 'username', value: '"Cute"' };
    let n2: Node = { label: 'username', value: '"Frog"' };
    let n3: Node = { label: 'username', value: '"Cleaned"' };
    let n5: Node = { label: 'username', value: '"Oofsie"' };
    let nodes = [n1, n4, n2, n3, n5];
    let edges: Edge[] = [
        { from: n1, to: n2 },
        { from: n2, to: n3 },
        { from: n4, to: n3 },
        //{ from: n1, to: n4 },
        //{ from: n5, to: n4 },
        //{ from: n5, to: n3 },
    ];

    /*
    function shuffle<T>(a: T[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    let nodes = Array(20).fill(0).map((x, i): Node => ({ label: 'username', value: i.toString() }));
    let edges: Edge[] = [];
    for (let [i, node] of nodes.entries()) {
        let availableNodes = shuffle(nodes.slice(i + 1));
        let connections = Math.floor(Math.random() * 5 * availableNodes.length/nodes.length);
        for (let to of availableNodes.slice(0, connections)) edges.push({ from: node, to: to });
    }
    */

    const markDepths = (node: Node, edges: Edge[], depth: number) => {
        if (!node.depth || node.depth < depth) node.depth = depth;

        for (let edge of edges) {
            if (edge.from !== node) continue;
            markDepths(edge.to, edges, depth+1);
        }
    };
    for (let node of nodes.filter(x => !edges.some(y => y.to === x))) markDepths(node, edges, 0);

    let sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth);

    //nodes.forEach(x => x.height = 0);
    for (let [i, node] of sortedNodes.filter(x => x.depth === sortedNodes.at(-1).depth).entries()) {
        node.height = i;
    }

    for (let depth = sortedNodes.at(-1).depth; depth >= 0; depth--) {
        let ofThisDepth = sortedNodes.filter(x => x.depth === depth);

        ofThisDepth.sort((a, b) => a.height - b.height);
        let hasHeight = ofThisDepth.filter(x => x.height !== undefined);
        let avgHeight = hasHeight.reduce((a, b) => a + b.height, 0) / hasHeight.length;

        let lastHeight = -Infinity;
        for (let [i, node] of [...hasHeight, ...ofThisDepth.filter(x => x.height === undefined)].entries()) {
            if (node.height !== undefined) {
                node.height /= edges.filter(x => x.from === node).length || 1;
                node.height = avgHeight - (hasHeight.length-1)/2 + i;
                lastHeight = node.height;
            } else {
                lastHeight++;
                if (!isFinite(lastHeight)) lastHeight = 0
                node.height = lastHeight;
            }
        }

        for (let node of ofThisDepth) {
            for (let edge of edges) {
                if (edge.to !== node || edge.from.depth !== depth-1) continue;
                if (!edge.from.height) edge.from.height = 0;
                edge.from.height += node.height;
            }
        }
    }

    const getNodePosition = (node: Node) => {
        let x = 300 * node.depth;
        let y = 100 * node.height;

        return { x, y };
    };

    const render = () => {
        ctx.resetTransform();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        //ctx.scale(0.1, 0.1);
        ctx.translate(originX, originY);

        for (let edge of edges) {
            drawEdge(edge, edges.indexOf(edge));
        }

        for (let node of nodes) {
            let pos = getNodePosition(node);
            drawNode(pos.x, pos.y, node.value ?? node.label, node.height?.toString() ?? node.value);
        }
        /*

        drawEdge(300+7, 235, 500-7, 335);
        drawEdge(300+7, 235, 700-7, 135);

        drawNode(200, 200);
        drawNode(500, 300);
        drawNode(700, 100);
        */

        requestAnimationFrame(render);
    };

    const drawNode = (x: number, y: number, label: string, value: string) => {
        roundedRect(x, y, NODE_WIDTH, NODE_HEIGHT, 6);

        ctx.strokeStyle = '#474a52';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#292a2d';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = '14px Inter';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.fillText(label, x+50, y+20);

        ctx.font = '10px Inter';
        ctx.fillText(value, x+50, y+40);
    };

    const roundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
		if (h < 2 * r) r = h / 2;
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.arcTo(x+w, y,   x+w, y+h, r);
		ctx.arcTo(x+w, y+h, x,   y+h, r);
		ctx.arcTo(x,   y+h, x,   y,   r);
		ctx.arcTo(x,   y,   x+w, y,   r);
		ctx.closePath();
    };

    const getPosAroundNode = (nodeX: number, nodeY: number, angle: number) => {
        let centerX = nodeX + NODE_WIDTH/2;
        let centerY = nodeY + NODE_HEIGHT/2;

        let margin = 7;

        let x = Math.cos(angle) * (NODE_WIDTH/2 + margin);
        let y = Math.sin(angle) * (NODE_HEIGHT/2 + margin);

        if (Math.abs(Math.tan(angle)) < 1) { // Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let uh = (NODE_WIDTH/2 + margin) / Math.abs(x);
            x *= uh;
            y *= uh;
        } else {
            let uh = (NODE_HEIGHT/2 + margin) / Math.abs(y);
            x *= uh;
            y *= uh;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
    
    const quadraticBezierDerivative = (p0: number, p1: number, p2: number, t: number) => {
        return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
    };

    const drawEdge = (edge: Edge, n = 0) => {
        let p1 = getNodePosition(edge.from);
        let p2 = getNodePosition(edge.to);

        let angle = 0;
        let ex: number;
        let ey: number;

        ctx.beginPath();
        
        const bezierPathFromNode = (node: Node, x2: number, y2: number, angleOverride?: number, computeControlPoints?: (x1: number, x2: number) => { cx: number, cy: number }) => {
            let p = getNodePosition(node);
            let { x: x1, y: y1 } = getPosAroundNode(p.x, p.y, 0);
            let cx = (x1+x2)/2;
            let cy = y2;
            let angle = 0;

            for (let i = 0; i < 3; i++) {
                cx = (x1+x2)/2;
                cy = y2;

                if (computeControlPoints) ({ cx, cy } = computeControlPoints(x1, x2));

                angle = angleOverride ?? Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 0),
                    quadraticBezierDerivative(x1, cx, x2, 0)
                );
                ({ x: x1, y: y1 } = getPosAroundNode(p.x, p.y, angle));
            }

            //ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);

            return {
                x: x1,
                y: y1,
                startAngle: Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 0),
                    quadraticBezierDerivative(x1, cx, x2, 0)
                ),
                endAngle: Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 1),
                    quadraticBezierDerivative(x1, cx, x2, 1)
                )
            };
        };

        if (edge.to.depth - edge.from.depth > 1) {
            // Highway

            let highwayHeight = Math.max(...nodes.filter(x => edge.from.depth < x.depth && x.depth < edge.to.depth).map(x => x.height)) + 1.25;
            let { x: x1, y: y1 } = getPosAroundNode(p1.x, p1.y, 0);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            bezierPathFromNode(edge.from, x1 + 300 - NODE_WIDTH, 100 * highwayHeight + 10 * edge.from.height)

            let { x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI);
            ctx.lineTo(x2 - 300 + NODE_WIDTH, 100 * highwayHeight + 10 * edge.from.height);

            let naturalAngle = Math.atan2(y2-y1, x2-x1);

            let coords = bezierPathFromNode(edge.to, x2 - 300 + NODE_WIDTH, 100 * highwayHeight + 10 * edge.from.height, Math.PI + naturalAngle);
            ex = coords.x;
            ey = coords.y;
            angle = Math.PI + coords.startAngle;
        } else {
            let { x: x1, y: y1 } = getPosAroundNode(p1.x, p1.y, 0);
            let { x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI);

            //ctx.beginPath();
            //ctx.moveTo(x1, y1);
            //ctx.bezierCurveTo(x1+100, y1, x2-100, y2, x2 - 7, y2);

            angle = Math.atan2(y2-y1, x2-x1);

            ({ x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI + angle));

            let bruh: any;
            if (edge.to.depth - edge.from.depth > 1) {
                let highwayHeight = Math.max(...nodes.filter(x => edge.from.depth < x.depth && x.depth < edge.to.depth).map(x => x.height)) + 1.25;
                bruh = (x1, x2) => ({ cx: (x1+x2)/2, cy: 150 * highwayHeight });
            }

            let res = bezierPathFromNode(edge.from, x2, y2, undefined, bruh);

            ex = x2;
            ey = y2;
            angle = res.endAngle;
        }

        //let angle = Math.atan2(y2-y1, x2-x1);

        
        //ctx.lineTo(x2 - 7*Math.cos(angle), y2 - 7*Math.sin(angle));

        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-7, 5);
        ctx.stroke();

        ctx.restore();
    };
</script>

<svelte:head>
    <title>REScala Inspector</title>
</svelte:head>

<svelte:window
    bind:innerWidth
    bind:innerHeight
    on:keydown={(e) => e.code === 'Space' && (spacePressed = true)}
    on:keyup={(e) => e.code === 'Space' && (spacePressed = false)}
    on:mousedown={() => mouseHeld = true}
    on:mouseup={() => mouseHeld = false}
/>

<canvas
    class="w-full h-full"
    class:cursor-grab={spacePressed}
    class:cursor-grabbing={spacePressed && mouseHeld}
    bind:this={canvas}
    width={innerWidth * window.devicePixelRatio}
    height={innerHeight * window.devicePixelRatio}
    on:mousemove={onMouseMove}
/>