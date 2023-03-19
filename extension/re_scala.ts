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
    inputs?: ReScalaResource[],
    value: string
} | {
    type: 'Discover',
    source: ReScalaResource,
    sink: ReScalaResource
} | {
    type: 'Drop',
    source: ReScalaResource,
    sink: ReScalaResource
} | {
    type: 'Value',
    source: ReScalaResource,
    value: string
};

export const extractPathFromReScalaResource = (resource: ReScalaResource) => {
    let path: string[] = [];
    let namespaceSegment = resource.enclosing.slice(0, resource.enclosing.indexOf('#'));
    path.push(...namespaceSegment.split('.'));

    let methodSegment = resource.enclosing.slice(namespaceSegment.length + 1);
    path.push(...methodSegment.split('#').flatMap(x => x.split(' ')));

    return path;
};

export interface ReScalaValue {
    raw: string,
    type: 'boolean' | 'number' | 'string' | 'instance' | 'list' | 'unknown',
    formatted: string,
    short: string
}

export const parseReScalaValue = (value: string): ReScalaValue => {
    let formatted = formatValue(value);
    let type: ReScalaValue['type'] = 'unknown';
    let short = value;

    if (value === 'true' || value === 'false') {
        type = 'boolean';
    } else if (Number(value).toString() === value) {
        type = 'number';
    } else if (value.startsWith('"') && value.endsWith('"')) {
        type = 'string';
    } else if (/^(\w\.?)+\(/.test(value)) {
        let match = /^(\w\.?)+\(/.exec(value)[0].slice(0, -1);
        type = match === 'List' ? 'list' : 'instance';
        short = match;
    }

    if (short.length > 20) {
        short = short.slice(0, 20) + '...';
    }

    return {
        raw: value,
        type,
        formatted,
        short
    };
};

const formatValue = (value: string) => {
    if (!value) return null;

    if (value === 'true' || value === 'false') {
        // It's a boolean
        return `<span class="text-boolean">${value}</span>`;
    } else if (Number(value).toString() === value) {
        // It's a number
        return `<span class="text-number">${value}</span>`;
    } else if (value.startsWith('"') && value.endsWith('"')) {
        // It's a string
        return `<span class="text-string">${escape(value)}</span>`;
    } else if (/^(\w\.?)+\(/.test(value)) {
        const process = (section: string) => {
            let parts = split(section);

            let mappedParts = parts.map(part => {
                let match = /(?<=^|\s)(\w\.?)+\(/.exec(part);
                if (match) {
                    let middle = part.slice(match.index + match[0].length, -1);
                    return part.slice(0, match.index)
                        + `<span class="${match[0] === 'List(' ? 'text-list' : 'text-instance'}">${escape(match[0].slice(0, -1))}</span>(`
                        + (middle.length > 0 ? '\n' + indent(process(middle)) + '\n)' : ')');
                }

                let equalsIndex = part.indexOf('=');
                if (equalsIndex >= 0 && part.indexOf('"') === -1 || part.indexOf('"') > equalsIndex) {
                    return part.slice(0, equalsIndex) + '= ' + formatValue(part.slice(equalsIndex + 2));
                } else {
                    return formatValue(part);
                }
            });

            return mappedParts.join(',\n');
        };

        return process(value);
    }

    return escape(value);
};

let div = document.createElement('div');
const escape = (string: string) => {
    div.textContent = string;
    return div.innerHTML;
};

const split = (string: string) => {
    let parts: string[] = [];
    let current = '';

    let inString = false;
    let parens = 0;
                
    for (let i = 0; i < string.length; i++) {
        let c = string[i];
        if (c === '(') parens++;
        else if (c === ')') parens--;
        else if (c === '"' && string[i-1] !== '\\') inString = !inString;
                    
        if (!inString && parens === 0 && string.slice(i).startsWith(', ')) {
            parts.push(current);
            current = '';
            i++;
        } else {
            current += c;
        }
    }

    parts.push(current);
    return parts;
};

const indent = (string: string) => {
    return '  ' + string.replaceAll('\n', '\n  ');
};