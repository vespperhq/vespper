import crypto from "crypto";

class PagerDutyVerifier {
  private readonly key: string;
  private readonly version: string;

  constructor(key: string, version: string) {
    this.key = key;
    this.version = version;
  }

  verify(payload: string, signatures: string) {
    const signature = crypto
      .createHmac("sha256", this.key)
      .update(payload)
      .digest("hex");

    const signatureWithVersion = this.version + "=" + signature;
    const signatureList = signatures.split(",");

    return signatureList.indexOf(signatureWithVersion) > -1;
  }
}

const secret = process.env.PAGERDUTY_SECRET as string;
export const pdVerifier = new PagerDutyVerifier(secret, "v1");
