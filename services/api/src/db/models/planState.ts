import { Types } from "mongoose";
import {
  FieldsState,
  IPlanField,
  IPlanState,
  PlanFieldKind,
} from "../../types";
import { PlanState } from "../schemas/planState";
import { BaseModel } from "./base";
import { planModel } from "./plan";

class PlanStateModel extends BaseModel<IPlanState> {
  async createInitialState(
    planId: Types.ObjectId,
    organizationId: Types.ObjectId,
  ) {
    const plan = await planModel.getOneById(planId).populate("fields");
    if (!plan) {
      throw new Error("Could not initiate state. Plan not found");
    }

    const state = (plan.fields as IPlanField[])
      .filter((field) => field.kind === PlanFieldKind.number)
      .reduce((total, { _id: fieldId, initialValue, granularity }) => {
        if (granularity === "organization") {
          total[String(fieldId)] = {
            value:
              typeof initialValue !== "undefined"
                ? (initialValue as number)
                : 0,
          };
        } else {
          total[String(fieldId)] = { users: {} };
        }
        return total;
      }, {} as FieldsState);
    return await this.create({
      plan: planId,
      organization: organizationId,
      state,
    });
  }
}
export const planStateModel = new PlanStateModel(PlanState);
