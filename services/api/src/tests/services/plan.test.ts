import {
  PlanState,
  PlanField,
  Plan,
  planStateModel,
  planFieldModel,
  PlanFieldKind,
  ResetMode,
} from "@merlinn/db";
import { Types } from "mongoose";
import type { IPlanState } from "@merlinn/db";
import { resetPlanStates } from "../../services/plans/base";

const DUMMY_FIELDS = [
  new PlanField({
    name: "Ability to eat pizzas",
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.hourly,
  }),
  new PlanField({
    name: "Ability to teleport",
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.daily,
  }),
  new PlanField({
    name: "Ability to launch rockets",
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.weekly,
  }),
  new PlanField({
    name: "Ability to play ping pong",
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.monthly,
  }),
  new PlanField({
    name: "Ability to drink water",
    kind: PlanFieldKind.number,
    granularity: "organization",
    resetMode: ResetMode.yearly,
  }),
];

const DUMMY_PLAN = new Plan({
  name: "free",
  fields: DUMMY_FIELDS.map((f) => f._id),
  values: {
    [String(DUMMY_FIELDS[0]._id)]: 2, // Can eat 2 pizzas per hour
    [String(DUMMY_FIELDS[1]._id)]: 4, // Can teleport 4 times per day
    [String(DUMMY_FIELDS[2]._id)]: 6, // Can launch 6 rockets per week
    [String(DUMMY_FIELDS[3]._id)]: 8, // Can play ping pong 8 times per month
    [String(DUMMY_FIELDS[4]._id)]: 1, // Can drink water just one time per year!
  },
});

function getFieldByResetMode(resetMode: ResetMode) {
  return DUMMY_FIELDS.find((f) => f.resetMode === resetMode)!;
}
describe("test plan service", () => {
  let planState: IPlanState;
  beforeAll(async () => {
    jest.useFakeTimers();
  });
  afterAll(async () => {
    jest.useRealTimers();
  });
  beforeEach(async () => {
    planState = new PlanState({
      organization: new Types.ObjectId(),
      plan: DUMMY_PLAN,
      state: {
        [String(DUMMY_FIELDS[0]._id)]: {
          value: 2,
        },
        [String(DUMMY_FIELDS[1]._id)]: {
          value: 3,
        },
        [String(DUMMY_FIELDS[2]._id)]: {
          value: 3,
        },
        [String(DUMMY_FIELDS[3]._id)]: {
          value: 2,
        },
        [String(DUMMY_FIELDS[4]._id)]: {
          value: 1,
        },
      },
    });
  });
  test("should reset plan state successfully", async () => {
    jest.spyOn(planFieldModel, "get").mockImplementation((params) => {
      return Promise.resolve(
        DUMMY_FIELDS.filter((f) => f.resetMode === params!.resetMode),
      ) as never;
    });
    jest.spyOn(planStateModel, "get").mockResolvedValue([planState as never]);
    jest
      .spyOn(planStateModel, "getOneByIdAndUpdate")
      .mockImplementation(jest.fn());

    await Promise.all([
      resetPlanStates(ResetMode.hourly),
      resetPlanStates(ResetMode.daily),
      resetPlanStates(ResetMode.weekly),
      resetPlanStates(ResetMode.monthly),
      resetPlanStates(ResetMode.yearly),
    ]);

    for (const resetMode of [
      ResetMode.hourly,
      ResetMode.daily,
      ResetMode.weekly,
      ResetMode.monthly,
      ResetMode.yearly,
    ]) {
      const field = getFieldByResetMode(resetMode);
      expect(planState.state[String(field!._id)]).toEqual({ value: 0 });
    }
  });
});
