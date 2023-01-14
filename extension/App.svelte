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
    let scale = 0.8;
    let originX = 200 / scale;
    let originY = 100 / scale;
    let doIterate = false;
    
    onMount(() => {
        ctx = canvas.getContext('2d', { desynchronized: true });
        render();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!spacePressed || !mouseHeld) return;

        originX += e.movementX; 
        originY += e.movementY;
    };

    interface Node {
        label: string,
        value: string,
        layer?: number,
        x?: number,
        dx?: number,
        in?: Node[],
        out?: Node[],
        neighbor?: Node,
    }
    type Edge = {
        from: Node,
        to: Node
    };

    let n1: Node = { label: 'username', value: '"1"' };
    let n2: Node = { label: 'username', value: '"2"' };
    let n3: Node = { label: 'username', value: '"3"' };
    let n4: Node = { label: 'username', value: '"4"' };
    let n5: Node = { label: 'username', value: '"5"' };
    let n6: Node = { label: 'username', value: '"6"' };
    let n7: Node = { label: 'username', value: '"7"' };
    let n8: Node = { label: 'username', value: '"8"' };
    let n9: Node = { label: 'username', value: '"9"' };
    let nodes = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
    let edges: Edge[] = [];

    function shuffle<T>(a: T[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    nodes = Array(10).fill(0).map((x, i): Node => ({ label: 'username', value: i.toString() }));
    edges = [];
    for (let [i, node] of nodes.entries()) {
        let availableNodes = shuffle(nodes.slice(i + 1));
        let connections = Math.floor(Math.random() * 4 * (1 ?? availableNodes.length/nodes.length));
        for (let to of availableNodes.slice(0, connections)) edges.push({ from: node, to: to });
    }

    // Remove unconnected nodes
    nodes = nodes.filter(x => edges.some(y => y.from === x || y.to === x));

    for (let node of nodes) node.layer = 0;
    let q: Node[] = nodes.filter(x => !edges.some(y => y.to === x));
    while (q.length > 0) {
        let rn = q.pop();
        let children = edges.filter(x => x.from === rn).map(x => x.to);
        for (let child of children) {
            child.layer = Math.min(child.layer, rn.layer-1);
        }
        q.push(...children);
    }
    let lowestLayer = Math.min(...nodes.map(x => x.layer));
    nodes.forEach(x => x.layer -= lowestLayer);

    // Add dummy nodes for long edges
    for (let j = 0; j < edges.length; j++) {
        let edge = edges[j];

        if (edge.from.layer - edge.to.layer > 1) {
            edges.splice(j--, 1);

            let prevNode = edge.from;
            for (let i = edge.from.layer; i > edge.to.layer; i--) {
                let nextNode: Node = (i === edge.to.layer + 1) ? edge.to : { label: '', value: 'dummy', layer: i - 1 };
                if (nextNode !== edge.to) nodes.push(nextNode);
                edges.push({ from: prevNode, to: nextNode });

                prevNode = nextNode;
            }
        }
    }

    for (let node of nodes) {
        node.in = [];
        node.out = [];
    }
    for (let edge of edges) {
        edge.from.out.push(edge.to);
        edge.to.in.push(edge.from);
    }

    for (let node of nodes) node.x = Infinity;
    
    let highestLayer = Math.max(...nodes.map(x => x.layer));
    for (let layer = 0; layer <= highestLayer; layer++) {
        let deezNodes = nodes.filter(x => x.layer === layer);
        if (layer === 0) {
            deezNodes.forEach((x, i) => x.x = i);
        } else {
            deezNodes.forEach(x => x.x /= x.out.length);
            deezNodes.sort((a, b) => a.x - b.x);
            deezNodes.forEach((x, i) => x.x = i);
        }

        for (let edge of edges) {
            if (edge.to.layer !== layer) continue;
            if (!isFinite(edge.from.x)) edge.from.x = 0;
            edge.from.x += edge.to.x;
        }
    }

    let sortedNodes = [...nodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
    for (let node of nodes) {
        node.neighbor = sortedNodes.find((x, i) => x.layer === node.layer && i > sortedNodes.indexOf(node));
    }

    const computeDx = () => {
        let did = new Set<Node>();

        for (let node of nodes) node.dx = 0;
        for (let edge of edges) {
            edge.to.dx += (edge.from.x - edge.to.x) / 2;
            edge.from.dx -= (edge.from.x - edge.to.x) / 2;
        }

        for (let node of nodes) {
            if (!node.neighbor) continue;
            if (did.has(node)) continue;

            const nodeHeight = (n: Node) => {
                return n.value === 'dummy' ? 0.5 : 1;
            };

            let connected = [node];
            while (connected.at(-1).neighbor && connected.at(-1).neighbor.x - (connected.at(-1).x + nodeHeight(connected.at(-1)) + 1e-6) <= 0) {
                connected.push(connected.at(-1).neighbor);
            }

            connected.forEach(x => did.add(x));
            if (connected.length === 1) continue;

            let avg = connected.reduce((a, b) => a + b.dx, 0) / connected.length;
            for (let n of connected) {
                n.dx = avg;
            }

            for (let n of connected.slice(0, -1)) {
                for (let m of connected) {
                    let sign = connected.indexOf(m) <= connected.indexOf(n) ? 1 : -1;
                    m.dx += sign * Math.min(n.neighbor.x - (n.x + nodeHeight(n)), 0);
                }
            }
        }
    };

    const iterateNew = () => {
        let h = 0.8;

        console.time()
        for (let i = 0; i < 1000; i++) {
            let x = nodes.map(n => n.x);
            computeDx();
            nodes.forEach(n => n.x += h**2 * n.dx / 2);

            let highestDx = Math.max(...nodes.map((n, i) => Math.abs(x[i] - n.x)));
            if (highestDx < 0.001) break;
        }
        console.timeEnd()
    };

    const getNodePosition = (node: Node, center = false) => {
        let x = 300 * (highestLayer - node.layer);
        let y = 100 * node.x;

        if (center) {
            x += NODE_WIDTH/2;
            y += NODE_HEIGHT/2;
        }

        return { x, y };
    };

    const render = () => {
        //if (doIterate) iterate(undefined, undefined, 5);

        ctx.resetTransform();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.scale(scale, scale);
        ctx.translate(originX, originY);

        for (let edge of edges) {
            drawEdge(edge, edges.indexOf(edge));
        }

        for (let node of nodes) {
            if (node.value === 'dummy') continue;

            let pos = getNodePosition(node);
            drawNode(pos.x, pos.y, node.value ?? node.label, `${node.x.toFixed(2)} ${node.dx?.toFixed(2)}` ?? node.value);
        }

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

    const drawEdge = (edge: Edge, n = 0) => {
        if (edge.from.value === 'dummy') return;

        if (edge.to.value !== 'dummy') {
            let p1 = getNodePosition(edge.from);
            let p2 = getNodePosition(edge.to);

            let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 0.8; // Dampen the angle a bit

            ctx.beginPath();
            
            let { x: x1, y: y1 } = getPosAroundNode(p1.x, p1.y, angle);
            let { x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI + angle);

            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo((x1+x2)/2, y2, x2, y2);

            drawArrow(n, x2, y2, 0);
        } else {
            let path = [edge.from, edge.to];
            while (path.at(-1).value === 'dummy') path.push(path.at(-1).out[0]);

            const catmullRom = (t: number, p0: number, p1: number, p2: number, p3: number) => {
                let point = t*t*t*((-1) * p0 + 3 * p1 - 3 * p2 + p3) / 2;
                point += t*t*(2*p0 - 5 * p1+ 4 * p2 - p3) / 2;
                point += t*((-1) * p0 + p2) / 2;
                point += p1;

                return point;
            };

            let points: { x: number, y: number }[] = [];

            for (let i = 0; i < path.length-1; i++) {
                let from = path[i];
                let to = path[i+1];

                let p1 = getNodePosition(from, true);
                let p2 = getNodePosition(to, true);
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (from.value !== 'dummy') p1 = getPosAroundNode(getNodePosition(from).x, getNodePosition(from).y, angle);
                if (to.value !== 'dummy') p2 = getPosAroundNode(getNodePosition(to).x, getNodePosition(to).y, Math.PI + angle);

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

            drawArrow(n, points.at(-2).x, points.at(-2).y, angle);
        }
    };

    const drawArrow = (n: number, endX: number, endY: number, endAngle: number) => {
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
    on:keydown={e => e.code === 'KeyI' && iterateNew()}
    on:keyup={e => e.code === 'KeyI' && (doIterate = false)}
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
<button class="absolute top-0 left-0 bg-[#292a2d] px-2 py-1 rounded-md shadow m-3 text-sm">Do the Harlem Shake</button>