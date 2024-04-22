import { FilterQuery } from "mongoose";
import { IIntegration, IVendor } from "../types";
import { Integration } from "../schemas/integration";
import { BaseModel } from "./base";
import { vendorModel } from "./vendor";

class IntegrationModel extends BaseModel<IIntegration> {
  async getIntegrationByName(
    vendorName: string,
    query: FilterQuery<IIntegration>,
  ) {
    const vendor = (await vendorModel.getOne({
      name: vendorName,
    })) as IVendor;
    const integration = await integrationModel.getOne({
      vendor: vendor._id,
      ...query,
    });
    return integration;
  }
}

export const integrationModel = new IntegrationModel(Integration);
