/** Removes an item from an array. */
export const remove = <T>(arr: T[], item: T) => {
	const index = arr.indexOf(item);
	if (index >= 0) arr.splice(index, 1);
};

export const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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

export const quadraticBezier = (p0: number, p1: number, p2: number, t: number) => {
	return p1 + (p0-p1)*(1-t)**2 + (p2-p1)*t**2;
};

export const quadraticBezierDerivative = (p0: number, p1: number, p2: number, t: number) => {
	return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
};

/** Computes a point on a 1-dimensional centripetal Catmull–Rom spline given four control points and `t`. */
export const catmullRom = (t: number, p0: number, p1: number, p2: number, p3: number) => {
	let point = t*t*t*((-1) * p0 + 3 * p1 - 3 * p2 + p3) / 2;
	point += t*t*(2*p0 - 5 * p1+ 4 * p2 - p3) / 2;
	point += t*((-1) * p0 + p2) / 2;
	point += p1;

	return point;
};

export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export interface Point {
	x: number,
	y: number
}
export type Path = Point[];

/** Linearly inpolates between two points. */
export const lerpPoints = (p1: Point, p2: Point, t: number): Point => {
	return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
};

/** Linearly interpolates between two paths. */
export const lerpPaths = (path1: Path, path2: Path, t: number) => {
	const finalPath: Path = Array(Math.max(path1.length, path2.length));

	for (let i = 0; i < finalPath.length; i++) {
		const u = i / (finalPath.length - 1);
		const p1 = getPositionAlongPath(path1, u);
		const p2 = getPositionAlongPath(path2, u);
		finalPath[i] = lerpPoints(p1, p2, t);
	}

	return finalPath;
};

export const getPositionAlongPath = (path: { x: number, y: number }[], t: number) => {
	const index = (path.length-1) * t;
	const indexLow = Math.floor(index);
	const indexHigh = Math.ceil(index);

	const p1 = path[indexLow];
	const p2 = path[indexHigh];

	if (index === indexLow) return p1;
	return lerpPoints(p1, p2, index - indexLow);
};

/** Clamps a value into the range [0, 1]. */
export const saturate = (x: number) => Math.min(Math.max(x, 0), 1);

export const clamp = (x: number, min: number, max: number) => x < min ? min : (x > max ? max : x);

/** Picks a singular or plural word based on the passed value. */
export const pickNumber = (value: number, singular: string, plural = singular + 's') => {
	return Math.abs(value) === 1 ? singular : plural;
};

/**
 * Groups successive array elements such that the callback evaluated on every items in a group returns the same value.
 */
export const groupBy = <T>(arr: T[], callback: (item: T) => unknown): T[][] => {
	const result: T[][] = [];

	if (arr.length === 0) {
		return result;
	}

	let currentGroup: T[] = [arr[0]];
	let currentKey = callback(arr[0]);

	for (let i = 1; i < arr.length; i++) {
		const element = arr[i];
		const elementKey = callback(element);

		if (elementKey === currentKey) {
			currentGroup.push(element);
		} else {
			result.push(currentGroup);
			currentGroup = [element];
			currentKey = elementKey;
		}
	}

	if (currentGroup.length > 0) {
		result.push(currentGroup);
	}

	return result;
};

/** Custom event emitter implementation */
export class Emitter<T extends Record<string, unknown>> {
	listeners = new Map<keyof T, Set<(data: unknown) => void>>();

	emit<K extends keyof T>(type: K, ...data: T[K] extends void ? [] : [T[K]]) {
		const fns = this.listeners.get(type);
		if (!fns) return;

		for (const fn of fns) fn(data);
	}

	on<K extends keyof T>(type: K, callback: (data: T[K]) => void) {
		let fns = this.listeners.get(type);
		if (!fns) {
			fns = new Set();
			this.listeners.set(type, fns);
		}

		fns.add(callback);
	}

	off<K extends keyof T>(type: K, callback: (data: T[K]) => void) {
		const fns = this.listeners.get(type);
		if (!fns) return;

		fns.delete(callback);
	}
}