export default class EventEmitter {
  constructor() {
    this._events = {};
  }

  on(eventName, callback) {
    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }
    this._events[eventName].push(callback);
  }

  emit(eventName, data) {
    const eventCallbacks = this._events[eventName];
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => callback(data));
    }
  }
  off(eventName, callback) {
    if (this._events[eventName]) {
      this._events[eventName] = this._events[eventName].filter(
        (cb) => cb !== callback
      );
    }
  }
  once(eventName, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(eventName, wrapper); // Automatically remove after first execution
    };
    this.on(eventName, wrapper);
  }
}
