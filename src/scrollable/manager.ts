import { Controller } from './controller';

export class ScrollManager {
  private map: Map<string, Controller>;

  constructor() {
    if (!window.__scrollManager) {
      window.__scrollManager = this;
    }

    this.map = new Map();
  }

  static getInstance() {
    return window.__scrollManager as ScrollManager;
  }

  register(key: string, controller: Controller) {
    this.map.set(key, controller);
  }

  unregister(key: string) {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
  }

  getController(key: string) {
    return this.map.get(key);
  }
}

export const scrollManager = new ScrollManager();
