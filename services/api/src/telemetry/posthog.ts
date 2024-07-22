import { PostHog as OriginalPosthog } from "posthog-node";

// Safe as it is intended to be public
const POSTHOG_API_KEY = "phc_eifETYrGPaTRYKvlarnFMJj9dNfYzoP5CS46K9nsdif";
const POSTHOG_HOST = "https://us.i.posthog.com";

// const DEBUG = process.env.NODE_ENV === "development";
const DEBUG = false;

export class PostHogClient extends OriginalPosthog {
  constructor() {
    super(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
    });

    if (DEBUG) {
      this.debug();
    }
  }
}
