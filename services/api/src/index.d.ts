declare namespace Express {
  type User = import("./types").IUser;
  type Webhook = import("./types").IWebhook;
  type Session = import("@ory/client").Session;

  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: User;
    webhook?: Webhook;
    session?: Session;
  }
}

// TODO: For some reason, we have to declare the mongoose types here as well. Otherwise,
// the build fails. Need to look into that. Ideally, the declaration should be in @vespper/db.
declare module "mongoose" {
  interface Document {
    encryptFieldsSync: () => void;
  }
}
