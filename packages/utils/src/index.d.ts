// TODO: For some reason, we have to declare the mongoose types here as well. Otherwise,
// the build fails. Need to look into that. Ideally, the declaration should be in @merlinn/db.
declare module "mongoose" {
  interface Document {
    encryptFieldsSync: () => void;
  }
}
