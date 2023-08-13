export class Opposite<T> {
  value: T;
  firstReturn?: T;

  constructor(value: T) {
    this.value = value;
  }

  determineFirstReturn(val: T) {
    this.firstReturn = val;
    return this;
  }

  matchOne<V1, V2>(value1: V1, value2: V2) {
    if (!this.firstReturn) {
      throw new Error('firstReturn  must be determined');
    }

    if (typeof value1 === 'function' && typeof value2 === 'function') {
      if (this.value === this.firstReturn) {
        value1();
      } else {
        value2();
      }
    }

    return this.value === this.firstReturn ? value1 : value2;
  }
}
