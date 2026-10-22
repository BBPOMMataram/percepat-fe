/**
 * Polyfills untuk browser lawas (Windows 7 / Chrome <= 109)
 * Memastikan fitur-fitur JS modern tidak menyebabkan layar putih (crash) pada browser lama.
 */
if (typeof window !== 'undefined') {
  // Array.prototype.at
  if (!Array.prototype.at) {
    Array.prototype.at = function (index: number) {
      const n = Math.trunc(index) || 0;
      const k = n >= 0 ? n : this.length + n;
      if (k < 0 || k >= this.length) return undefined;
      return this[k];
    };
  }

  // String.prototype.at
  if (!String.prototype.at) {
    String.prototype.at = function (index: number) {
      const n = Math.trunc(index) || 0;
      const k = n >= 0 ? n : this.length + n;
      if (k < 0 || k >= this.length) return undefined;
      return this[k];
    };
  }

  // Object.hasOwn
  if (!Object.hasOwn) {
    Object.hasOwn = function (obj: any, prop: any) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  // Array.prototype.toSorted
  if (!('toSorted' in Array.prototype)) {
    (Array.prototype as any).toSorted = function (compareFn?: any) {
      return [...this].sort(compareFn);
    };
  }

  // Array.prototype.toReversed
  if (!('toReversed' in Array.prototype)) {
    (Array.prototype as any).toReversed = function () {
      return [...this].reverse();
    };
  }

  // Array.prototype.toSpliced
  if (!('toSpliced' in Array.prototype)) {
    (Array.prototype as any).toSpliced = function (
      start: number,
      deleteCount?: number,
      ...items: any[]
    ) {
      const copy = [...this];
      if (typeof deleteCount === 'undefined') {
        copy.splice(start);
      } else {
        copy.splice(start, deleteCount, ...items);
      }
      return copy;
    };
  }

  // Array.prototype.with
  if (!('with' in Array.prototype)) {
    (Array.prototype as any).with = function (index: number, value: any) {
      const copy = [...this];
      const actualIndex = index < 0 ? copy.length + index : index;
      copy[actualIndex] = value;
      return copy;
    };
  }

  // URL.canParse
  if (typeof URL !== 'undefined' && !(URL as any).canParse) {
    (URL as any).canParse = function (url: string, base?: string) {
      try {
        new URL(url, base);
        return true;
      } catch {
        return false;
      }
    };
  }

  // Promise.withResolvers
  if (typeof Promise !== 'undefined' && !(Promise as any).withResolvers) {
    (Promise as any).withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: any) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  // structuredClone fallback
  if (typeof window !== 'undefined' && !(window as any).structuredClone) {
    (window as any).structuredClone = function (val: any) {
      if (val === undefined) return undefined;
      try {
        return JSON.parse(JSON.stringify(val));
      } catch {
        return val;
      }
    };
  }

  // crypto.randomUUID fallback
  if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    (crypto as any).randomUUID = function () {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    };
  }
}

export {};
