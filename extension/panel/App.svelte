<script lang="ts">
    import { onMount } from "svelte";
    import { get} from "svelte/store";
    import { Graph } from "./ts/graph";
    import { MAX_SCALE, MIN_SCALE, RenderedGraph } from "./ts/rendered_graph";
    import type { ReScalaEvent } from "./ts/re_scala";
    import Structure from "./components/Structure.svelte";
    import History from "./components/History.svelte";
    import ZoomIndicator from "./components/ZoomIndicator.svelte";
    import NodePopup from "./components/NodePopup.svelte";
    import SpeedSlider from "./components/SpeedSlider.svelte";

    let canvas: HTMLCanvasElement;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;

    let graph: Graph;
    let renderedGraph: RenderedGraph;

    onMount(() => {
        graph = new Graph();
        renderedGraph = new RenderedGraph(graph, canvas);

        const render = () => {
            renderedGraph?.render();
            requestAnimationFrame(render);
        };
        render();

        let eventsProcessed = 0;
        let lastId: number = null;

        if (typeof chrome === 'object' && chrome.devtools) {
            const handle = (result: { events: ReScalaEvent[], id: number }, isException: any) => {
                if (isException) {
                    console.log("exception", isException);
                    return;
                }

                if (!result.events) return;

                if (lastId !== result.id) {
                    eventsProcessed = 0;
                    graph = new Graph();
                    renderedGraph = new RenderedGraph(graph, canvas);
                }
                lastId = result.id;

                graph.supplyReScalaEvents(result.events.slice(eventsProcessed));
                eventsProcessed = result.events.length;
            };

            const getData = () => {
                let events = (window as any).reScalaEvents as ReScalaEvent[];

                return {
                    id: (window as any).reScalaId as number,
                    events
                };
            };
            setInterval(() => {
                chrome.devtools.inspectedWindow.eval(`(${getData.toString()})()`, handle);
            }, 1000/30);
        }
    });

    const onPointerMove = (e: PointerEvent) => {
        if (!renderedGraph) return;

        renderedGraph.supplyMousePosition({ x: e.clientX, y: e.clientY });

        if (!spacePressed || !mouseHeld) return;

        renderedGraph.originX += e.movementX; 
        renderedGraph.originY += e.movementY;
    };

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!renderedGraph) return;

        let currentScale = get(renderedGraph.scale);

        let scaleChange = Math.pow(1.002, -e.deltaY);
        if (currentScale * scaleChange <= MIN_SCALE) {
            scaleChange = MIN_SCALE / currentScale;
        } else if (currentScale * scaleChange >= MAX_SCALE) {
            scaleChange = MAX_SCALE / currentScale;
        }

        renderedGraph.originX = (renderedGraph.originX - e.clientX) * scaleChange + e.clientX;
        renderedGraph.originY = (renderedGraph.originY - e.clientY) * scaleChange + e.clientY;
        renderedGraph.scale.update(x => x * scaleChange);
    };

    const onPointerDown = (e: PointerEvent) => {
        if (!renderedGraph || spacePressed) return;
        renderedGraph.tryToSelect();
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
    on:pointerdown={() => mouseHeld = true}
    on:pointerup={() => mouseHeld = false}

    on:keydown={e => e.code === 'KeyI' && renderedGraph.layout.solve(e.shiftKey, 1)}
    on:keydown={e => e.code === 'KeyS' && renderedGraph.layout.solve(e.shiftKey)}
    on:keydown={e => e.code === 'KeyO'}
    on:keydown={e => e.code === 'KeyP' && renderedGraph.layout.spreadOut()}
    on:keydown={e => e.code === 'KeyD' && renderedGraph.layout.decross()}
    on:keydown={e => e.code === 'KeyB' && (renderedGraph.showNodeBoundingBoxes = !renderedGraph.showNodeBoundingBoxes)}
/>

<canvas
    class="w-full h-full"
    class:cursor-grab={spacePressed}
    class:cursor-grabbing={spacePressed && mouseHeld}
    bind:this={canvas}
    width={innerWidth * window.devicePixelRatio}
    height={innerHeight * window.devicePixelRatio}
    on:pointermove={onPointerMove}
    on:wheel={onWheel}
    on:pointerdown={onPointerDown}
/>

{#if renderedGraph}
    <NodePopup {renderedGraph} />
    <Structure {renderedGraph} />
    <History {renderedGraph} />
    <ZoomIndicator {renderedGraph} />
{/if}

<SpeedSlider />