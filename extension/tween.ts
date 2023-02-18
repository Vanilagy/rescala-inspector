export class Tweened<T> {
    from: T = null;
    to: T = null;
    lastChangedAt = -Infinity;

    constructor(
        public initial: T,
        public duration: number,
        public lerp: (a: T, b: T, t: number) => T,
        public easing: EaseType = EaseType.EaseInOutQuad
    ) {
        this.from = initial;
        this.to = initial;
    }

    public get value() {
        if (this.to === null) return null;

        let elapsed = document.timeline.currentTime - this.lastChangedAt;
        let t = Math.min(elapsed / this.duration, 1);
        return this.lerp(this.from, this.to, ease(t, this.easing));
    }

    public get target() {
        return this.to;
    }

    public set target(newTarget: T) {
        this.from = this.value ?? newTarget;
        this.to = newTarget;
        this.lastChangedAt = document.timeline.currentTime;
    }
}

export enum EaseType {
    Linear,
    EaseInQuad,
    EaseOutQuad,
    EaseInOutQuad,
    EaseInCubic,
    EaseOutCubic,
    EaseInOutCubic,
    EaseInQuart,
    EaseOutQuart,
    EaseInOutQuart,
    EaseInQuint,
    EaseOutQuint,
    EaseInOutQuint,
    EaseInElastic,
    EaseOutElastic,
    EaseInSine,
    EaseOutSine,
    EaseInOutSine,
    EaseInExpo,
    EaseOutExpo,
    EaseInOutExpo,
    EaseInCirc,
    EaseOutCirc,
    EaseInOutCirc,
    EaseInBack,
    EaseOutBack,
    EaseInOutBack,
    EaseInElasticAlternative,
    EaseOutElasticAlternative,
    EaseOutElasticHalf,
    EaseOutElasticQuarter,
    EaseInOutElasticAlternative,
    EaseInBounce,
    EaseOutBounce,
    EaseInOutBounce
}

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;
const elasticConst = 2 * Math.PI / 0.3;
const elasticConst2 = 0.3 / 4;
const elasticOffsetHalf = Math.pow(2, -10) * Math.sin((.5 - elasticConst2) * elasticConst);
const elasticOffsetQuarter = Math.pow(2, -10) * Math.sin((.25 - elasticConst2) * elasticConst);
export const ease = (x: number, type: EaseType, p = 0.3) => {
    switch (type) {
        case EaseType.Linear:
            return x;
        case EaseType.EaseInQuad:
            return x * x;
        case EaseType.EaseOutQuad:
            return x * (2 - x);
        case EaseType.EaseInOutQuad:
            return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
        case EaseType.EaseInCubic:
            return x * x * x;
        case EaseType.EaseOutCubic:
            return (--x) * x * x + 1;
        case EaseType.EaseInOutCubic:
            return x < 0.5 ? 4 * x * x * x : (x - 1) * (2 * x - 2) * (2 * x - 2) + 1;
        case EaseType.EaseInQuart:
            return x * x * x * x;
        case EaseType.EaseOutQuart:
            return 1-(--x) * x * x * x;
        case EaseType.EaseInOutQuart:
            return x < 0.5 ? 8 * x * x * x * x : 1 - 8 * (--x) * x * x * x;
        case EaseType.EaseInQuint:
            return x * x * x * x * x;
        case EaseType.EaseOutQuint:
            return 1+(--x) * x * x * x * x;
        case EaseType.EaseInOutQuint:
            return x < 0.5 ? 16 * x * x * x * x * x : 1 + 16*(--x) * x * x * x * x;
        case EaseType.EaseInElastic:
            return 1 - ease(1 - x, EaseType.EaseOutElastic, p);
        case EaseType.EaseOutElastic:
            return Math.pow(2,-10*x) * Math.sin((x-p/4)*(2*Math.PI)/p) + 1;
        case EaseType.EaseInSine:
            return -1 * Math.cos(x * (Math.PI / 2)) + 1;
        case EaseType.EaseOutSine:
            return Math.sin(x * (Math.PI / 2));
        case EaseType.EaseInOutSine:
            return Math.cos(Math.PI * x) * -0.5 + 0.5;
        case EaseType.EaseInExpo:
            return x === 0 ? 0 : Math.pow(2, 10 * (x - 1));
        case EaseType.EaseOutExpo:
            return x === 1 ? 1 : (-Math.pow(2, -10 * x) + 1);
        case EaseType.EaseInOutExpo:
            if (x === 0 || x === 1) return x;

            const scaledTime = x * 2;
            const scaledTime1 = scaledTime - 1;

            if (scaledTime < 1) {
                return 0.5 * Math.pow(2, 10 * (scaledTime1));
            }

            return 0.5 * (-Math.pow(2, -10 * scaledTime1) + 2);
        case EaseType.EaseInCirc:
            return 1 - Math.sqrt(1 - Math.pow(x, 2));
        case EaseType.EaseOutCirc:
            return Math.sqrt(1 - Math.pow(x - 1, 2));
        case EaseType.EaseInOutCirc:
            return x < 0.5
                ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
                : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
        case EaseType.EaseInBack:
            return c3 * x * x * x - c1 * x * x;
        case EaseType.EaseOutBack:
            return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        case EaseType.EaseInOutBack:
            return x < 0.5
                ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
                : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
        case EaseType.EaseInElasticAlternative:
            return x === 0
                ? 0
                : x === 1
                ? 1
                : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
        case EaseType.EaseOutElasticAlternative:
            return x === 0
                ? 0
                : x === 1
                ? 1
                : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
        case EaseType.EaseInOutElasticAlternative:
            return x === 0
                ? 0
                : x === 1
                ? 1
                : x < 0.5
                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
        case EaseType.EaseOutElasticHalf:
            return Math.pow(2, -10 * x) * Math.sin((.5 * x - elasticConst2) * elasticConst) + 1 - elasticOffsetHalf * x;
        case EaseType.EaseOutElasticQuarter:
            return Math.pow(2, -10 * x) * Math.sin((.25 * x - elasticConst2) * elasticConst) + 1 - elasticOffsetQuarter * x;
        case EaseType.EaseInBounce:
            return 1 - ease(1 - x, EaseType.EaseOutBounce);
        case EaseType.EaseOutBounce:
            const n1 = 7.5625;
            const d1 = 2.75;

            if (x < 1 / d1) {
                return n1 * x * x;
            } else if (x < 2 / d1) {
                return n1 * (x -= 1.5 / d1) * x + 0.75;
            } else if (x < 2.5 / d1) {
                return n1 * (x -= 2.25 / d1) * x + 0.9375;
            } else {
                return n1 * (x -= 2.625 / d1) * x + 0.984375;
            }
        case EaseType.EaseInOutBounce:
            return x < 0.5
                ? (1 - ease(1 - 2 * x, EaseType.EaseOutBounce)) / 2
                : (1 + ease(2 * x - 1, EaseType.EaseOutBounce)) / 2;
        default:
            return x;
    }
};