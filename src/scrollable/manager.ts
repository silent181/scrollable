import { Controller } from './controller';

export class ScrollManager {
  private map: Map<string, Controller>;

  constructor() {
    if (!window.__scrollManager) {
      window.__scrollManager = this;
    }

    this.map = new Map();
  }

  getInstance() {
    return window.__scrollManager as ScrollManager;
  }

  register(key: string, controller: Controller) {
    if (this.map.has(key)) {
      return;
    }

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
