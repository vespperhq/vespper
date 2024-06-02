import { Plan } from "../schemas/plan";
import {
  IPlan,
  IPlanField,
  PlanFieldCode,
  PlanFieldKind,
  ResetMode,
} from "../types";
import { BaseModel } from "./base";
import { planFieldModel } from "./planField";

export const planModel = new BaseModel(Plan);

const fetchOrCreate = async (
  code: PlanFieldCode,
  data: Omit<IPlanField, "_id">,
) => {
  const field = await planFieldModel.getOne({ code });
  if (!field) {
    return planFieldModel.create({ ...data, code });
  }
  return field;
};

export const seedPlans = async () => {
  const seatsField = await fetchOrCreate(PlanFieldCode.seats, {
    name: "Amount of seats",
    code: PlanFieldCode.seats,
    kind: PlanFieldKind.number,
    granularity: "organization",
    initialValue: 1,
  });
  const alertsField = await fetchOrCreate(PlanFieldCode.alerts, {
    name: "Amount of alerts",
    code: PlanFieldCode.alerts,
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.daily,
  });
  const queriesField = await fetchOrCreate(PlanFieldCode.queries, {
    name: "Queries",
    code: PlanFieldCode.queries,
    kind: PlanFieldKind.number,
    granularity: "user",
    resetMode: ResetMode.daily,
  });
  const indexingAttemptsField = await fetchOrCreate(
    PlanFieldCode.indexingAttempts,
    {
      name: "Indexing attempts",
      code: PlanFieldCode.indexingAttempts,
      kind: PlanFieldKind.number,
      granularity: "organization",
      resetMode: ResetMode.monthly,
    },
  );
  const indexingDocumentsField = await fetchOrCreate(
    PlanFieldCode.indexingDocuments,
    {
      name: "Indexing documents",
      code: PlanFieldCode.indexingDocuments,
      kind: PlanFieldKind.number,
      granularity: "organization",
    },
  );

  const freePlan = new Plan({
    name: "free",
    fields: [
      seatsField._id,
      alertsField._id,
      queriesField._id,
      indexingAttemptsField._id,
      indexingDocumentsField._id,
    ],
    values: {
      [String(seatsField._id)]: 4,
      [String(alertsField._id)]: 20,
      [String(queriesField._id)]: 50,
      [String(indexingAttemptsField._id)]: 5,
      [String(indexingDocumentsField._id)]: 10000,
    },
  });
  const businessPlan = new Plan({
    name: "business",
    fields: [
      seatsField._id,
      alertsField._id,
      queriesField._id,
      indexingAttemptsField._id,
      indexingDocumentsField._id,
    ],
    values: {
      [String(seatsField._id)]: 30,
      [String(alertsField._id)]: 50,
      [String(queriesField._id)]: 50,
      [String(indexingAttemptsField._id)]: 10,
      [String(indexingDocumentsField._id)]: 100000,
    },
  });
  const plansData = [freePlan, businessPlan] as IPlan[];

  const plans = await planModel.get();
  for (const plan of plansData) {
    const exists = plans.find((p) => p.name === plan.name);
    if (exists) {
      // TODO: handle this case better
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      const { _id, ...data } = (plan as any).toObject();
      await planModel.getOneByIdAndUpdate(exists._id, data);
    } else {
      await planModel.create(plan);
    }
  }
};
