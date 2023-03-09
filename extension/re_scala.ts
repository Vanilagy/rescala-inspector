export interface ReScalaResource {
    idCounter: number,
    description: string,
    enclosing: string,
    file: string,
    line: number,
    path?: string[]
}

export type ReScalaEvent = {
    type: 'Create',
    resource: ReScalaResource,
    inputs?: ReScalaResource[]
} | {
    type: 'Discover',
    source: ReScalaResource,
    sink: ReScalaResource
} | {
    type: 'Value',
    source: ReScalaResource,
    value: string
} | {
    type: 'Drop',
    source: ReScalaResource,
    sink: ReScalaResource
}

export const extractPathFromReScalaResource = (resource: ReScalaResource) => {
    let path: string[] = [];
    let namespaceSegment = resource.enclosing.slice(0, resource.enclosing.indexOf('#'));
    path.push(...namespaceSegment.split('.'));

    let methodSegment = resource.enclosing.slice(namespaceSegment.length + 1);
    path.push(...methodSegment.split('#').flatMap(x => x.split(' ')));

    return path;
};