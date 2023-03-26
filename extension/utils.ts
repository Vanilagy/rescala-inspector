export const remove = <T>(arr: T[], item: T) => {
    let index = arr.indexOf(item);
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

export const lerpPoints = (p1: Point, p2: Point, t: number): Point => {
    return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
};

export const saturate = (x: number) => Math.min(Math.max(x, 0), 1);

export const clamp = (x: number, min: number, max: number) => x < min ? min : (x > max ? max : x);

/** Picks singular or plural based on the passed value. */
export const pickNumber = (value: number, singular: string, plural = singular + 's') => {
    return Math.abs(value) === 1 ? singular : plural;
};

export const groupBy = <T>(arr: T[], callback: (item: T) => unknown): T[][] => {
    let result: T[][] = [];

    if (arr.length === 0) {
        return result;
    }

    let currentGroup: T[] = [arr[0]];
    let currentKey = callback(arr[0]);

    for (let i = 1; i < arr.length; i++) {
        let element = arr[i];
        let elementKey = callback(element);

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