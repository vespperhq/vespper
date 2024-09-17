import NodeEventEmitter from "events";
import { SystemEvent } from "./types";

class EventEmitter extends NodeEventEmitter {
  publish(event: SystemEvent) {
    this.emit(event.type, event);
  }
}

export const events = new EventEmitter();
