export class Emitter<T extends Record<string, unknown>> {
    listeners = new Map<keyof T, Set<(data: unknown) => void>>();

    emit<K extends keyof T>(type: K, ...data: T[K] extends void ? [] : [T[K]]) {
        let fns = this.listeners.get(type);
        if (!fns) return;

        for (let fn of fns) fn(data);
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
        let fns = this.listeners.get(type);
        if (!fns) return;

        fns.delete(callback);
    }
}