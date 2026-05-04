const EventEmitter = require("events");

class Queue extends EventEmitter {
  constructor() {
    super();
  }

  add(event, data) {
    this.emit(event, data);
  }
}

module.exports = new Queue();