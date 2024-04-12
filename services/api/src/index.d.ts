declare module "mongoose" {
  interface Document {
    encryptFieldsSync: () => void;
  }
}

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
