import { SystemEvent } from "./types";

export interface EventListener {
  listen: () => void;
  handleEvent: (event: SystemEvent) => void | Promise<void>;
}
