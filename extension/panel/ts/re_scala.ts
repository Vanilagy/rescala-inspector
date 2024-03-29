export interface ReScalaResource {
	idCounter: number,
	description: string,
	enclosing: string,
	file: string,
	line: number,
	path?: string[]
}

export type ReScalaEvent = ({
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
} | {
	type: 'Transaction',
	id: number,
	phase: 'started' | 'preparation' | 'admission' | 'propagation' | 'commit' | 'release' | 'observer' | 'ended'
}) & {
	transaction: number,
	batch: number
};

/** Splits up a single REScala resource path into an array. */
export const extractPathFromReScalaResource = (resource: ReScalaResource) => {
	const path: string[] = [];
	const namespaceSegment = resource.enclosing.slice(0, resource.enclosing.indexOf('#'));
	path.push(...namespaceSegment.split('.'));

	const methodSegment = resource.enclosing.slice(namespaceSegment.length + 1);
	path.push(...methodSegment.split('#').flatMap(x => x.split(' ')));

	return path;
};

/** Wrapper to describe a REScala value. */
export interface ReScalaValue {
	raw: string,
	type: 'boolean' | 'number' | 'string' | 'instance' | 'list' | 'dom-element' | 'unknown',
	formatted: string,
	short: string
}

export const parseReScalaValue = (value: string): ReScalaValue => {
	const formatted = formatValue(value);

	let type: ReScalaValue['type'] = 'unknown';
	let short = value;

	if (value === 'true' || value === 'false') {
		type = 'boolean';
	} else if (Number(value).toString() === value) {
		type = 'number';
	} else if (value.startsWith('"') && value.endsWith('"')) {
		type = 'string';
	} else if (value === '<some html>') {
		type = 'dom-element';
	} else if (/^(\w\.?)+\(/.test(value)) {
		const match = /^(\w\.?)+\(/.exec(value)[0].slice(0, -1);
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

/** Given a REScala value, formats it into pretty-printed HTML. */
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
		// It's a complex data type

		const process = (section: string) => {
			const parts = split(section);

			const mappedParts = parts.map(part => {
				const match = /(?<=^|\s)(\w\.?)+\(/.exec(part);
				if (match) {
					const middle = part.slice(match.index + match[0].length, -1);
					return part.slice(0, match.index)
						+ `<span class="${
							match[0] === 'List(' ? 'text-list' : 'text-instance'
						}">${escape(match[0].slice(0, -1))}</span>(`
						+ (middle.length > 0 ? '\n' + indent(process(middle)) + '\n)' : ')');
				}

				const equalsIndex = part.indexOf('=');
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

const div = document.createElement('div');
const escape = (string: string) => {
	div.textContent = string;
	return div.innerHTML;
};

/** Splits the given string at every comma, while respecting parentheses and string literals. */
const split = (string: string) => {
	const parts: string[] = [];
	let current = '';

	let inString = false;
	let parens = 0;

	for (let i = 0; i < string.length; i++) {
		const c = string[i];
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