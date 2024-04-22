declare module "mongoose" {
  interface Document {
    encryptFieldsSync: () => void;
  }
}
