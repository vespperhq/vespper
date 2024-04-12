import Mixpanel, { PropertyDict } from "mixpanel";

export class MixpanelClient {
  public client: Mixpanel.Mixpanel;
  constructor(token: string) {
    this.client = Mixpanel.init(token);
  }

  getCommonProps() {
    const commonProps = {
      env: process.env.NODE_ENV,
    } as Record<string, string>;

    return commonProps;
  }

  async track(eventName: string, properties: PropertyDict = {}): Promise<void> {
    const commonProps = await this.getCommonProps();
    const allProps = { ...commonProps, ...properties };
    this.client.track(eventName, allProps);
  }
}
