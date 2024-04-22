declare namespace Express {
  type User = import("./types").IUser;
  type Webhook = import("./types").IWebhook;

  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: User;
    webhook?: Webhook;
    auth?: {
      payload: {
        sub: string;
      };
    };
  }
}

// TODO: For some reason, we have to declare the mongoose types here as well. Otherwise,
// the build fails. Need to look into that. Ideally, the declaration should be in @merlinn/db.
declare module "mongoose" {
  interface Document {
    encryptFieldsSync: () => void;
  }
}
