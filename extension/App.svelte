<script lang="ts">
    import { onMount } from "svelte";
    import { get, type Writable } from "svelte/store";
    import { fly } from "svelte/transition";
    import { Graph, type HistoryEntry } from "./graph";
    import type { LayoutNode } from "./graph_layout";
    import { MAX_SCALE, MIN_SCALE, NODE_HEIGHT, RenderedGraph } from "./rendered_graph";
    import type { ReScalaEvent } from "./re_scala";
    import { clamp } from "./utils";
    import Structure from "./Structure.svelte";
    import History from "./History.svelte";
    import ZoomIndicator from "./ZoomIndicator.svelte";

    let canvas: HTMLCanvasElement;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;

    let graph: Graph;
    let renderedGraph: RenderedGraph;
    let hoveredNode: Writable<LayoutNode>;
    let selectedNode: Writable<LayoutNode>;
    let viewedHistoryEntry: Writable<HistoryEntry>;
    let graphScale: Writable<number>;

    onMount(() => {
        graph = new Graph();
        renderedGraph = new RenderedGraph(graph, canvas);
        hoveredNode = renderedGraph.hoveredNode;
        selectedNode = renderedGraph.selectedNode;
        viewedHistoryEntry = renderedGraph.viewedHistoryEntry;
        graphScale = renderedGraph.scale;

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
                    hoveredNode = renderedGraph.hoveredNode;
                    selectedNode = renderedGraph.selectedNode;
                    viewedHistoryEntry = renderedGraph.viewedHistoryEntry;
                    graphScale = renderedGraph.scale;
                }
                lastId = result.id;

                graph.processReScalaEvents(result.events.slice(eventsProcessed));
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

    $: popupStyle = (() => {
        if (!$selectedNode) return;

        let width = 208;
        let height = 150;
        let left = clamp($selectedNode.visualCenter().x * $graphScale + renderedGraph.originX - width/2, 10, window.innerWidth - width - 10);
        let top = $selectedNode.visualPosition().y * $graphScale + renderedGraph.originY - height;
        let paddingTop = 0;
        let paddingBottom = 10;

        if (top < 10) {
            top += height + NODE_HEIGHT * $graphScale;
            [paddingTop, paddingBottom] = [paddingBottom, paddingTop];
        }

        return {
            width,
            height,
            left,
            top,
            paddingTop,
            paddingBottom
        };
    })();
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

{#if $selectedNode}
    <div
        transition:fly={{y: -10, duration: 150}}
        class="absolute text-xs opacity-20 hover:opacity-100 transition-opacity blur-sm hover:blur-none"
        style:width={popupStyle.width + 'px'}
        style:height={popupStyle.height + 'px'}
        style:left={popupStyle.left + 'px'}
        style:top={popupStyle.top + 'px'}
        style:padding-top={popupStyle.paddingTop + 'px'}
        style:padding-bottom={popupStyle.paddingBottom + 'px'}
    >
        <div class="w-full h-full bg-zinc-700 shadow rounded-md p-2 px-3 space-y-3">
            <p class="opacity-30 text-[10px] break-words">
                {@html '/' + $selectedNode.node.reScalaResource.path.slice(0, -1).join('/').replaceAll('/', '/<wbr>')}
            </p>
            <div class="flex w-full !mt-1">
                <p class="truncate flex-1">
                    <span class="opacity-50 font-bold uppercase text-[11px]">Label</span><br>
                    {$selectedNode.node.label}
                </p>
                <p class="truncate text-right">
                    <span class="opacity-50 font-bold uppercase text-[11px]">ID</span><br>
                    {$selectedNode.node.id}
                </p>
            </div>
            <p class="truncate">
                <span class="opacity-50 font-bold uppercase text-[11px]">Value</span><br>
                {$viewedHistoryEntry.values.get($selectedNode.node)}
            </p>
        </div>
    </div>
{/if}

{#if renderedGraph}
    <Structure {renderedGraph} />
    <History {renderedGraph} />
    <ZoomIndicator {renderedGraph} />
{/if}