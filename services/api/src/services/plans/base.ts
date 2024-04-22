import {
  organizationModel,
  planFieldModel,
  planStateModel,
  userModel,
  ComputedOrgLevelFieldState,
  ComputedUserLevelFieldState,
  IPlan,
  OrgLevelFieldState,
  PlanFieldCode,
  PlanFieldKind,
  ResetMode,
  UserLevelFieldState,
} from "@merlinn/db";

interface BaseUpdateParams {
  fieldCode?: PlanFieldCode;
  fieldId?: string;
  organizationId: string;
  userId?: string;
  updater: (prevValue: number) => number;
}

interface UpdateParams extends Omit<BaseUpdateParams, "updater"> {
  value?: number;
}

export async function updatePlanFieldState(params: BaseUpdateParams) {
  const { organizationId, userId, updater } = params;

  if (!params.fieldId && !params.fieldCode) {
    throw new Error(
      "Get field state failed. Either field id or code must be provided",
    );
  } else if (params.fieldId && params.fieldCode) {
    throw new Error(
      "Get field state failed. Either field id or code must be provided",
    );
  }

  const organization = await organizationModel
    .getOneById(organizationId)
    .populate("plan");
  if (!organization) {
    throw new Error("Update field failed. Organization was not found");
  }
  const planState = await planStateModel.getOne({
    organization: organizationId,
  });
  if (!planState) {
    throw new Error("Update field failed. Plan state was not found");
  }

  const field = params.fieldId
    ? await planFieldModel.getOneById(params.fieldId)
    : await planFieldModel.getOne({ code: params.fieldCode });

  if (!field) {
    throw new Error(`Increment field failed. Field was not found`);
  } else if (field.kind !== PlanFieldKind.number) {
    throw new Error(`Update field failed. Field kind is not a number`);
  } else if (field.granularity === "user" && !userId) {
    throw new Error(
      "Update field failed. Field granularity is 'user', but user ID was not provided",
    );
  }
  const fieldId = field._id.toString();

  switch (field.granularity) {
    case "organization": {
      const fieldState = planState.state[fieldId] as OrgLevelFieldState;
      fieldState.value = updater(fieldState.value);
      planState.state[fieldId] = fieldState;

      await planStateModel.getOneByIdAndUpdate(planState._id, planState);
      break;
    }
    case "user": {
      const user = await userModel.getOneById(userId!);
      if (!user) {
        throw new Error(`Update field failed. User ${userId} does not exist`);
      }

      const fieldState = planState.state[fieldId] as UserLevelFieldState;
      if (typeof fieldState.users[userId!] === "undefined") {
        fieldState.users[userId!] = updater(0);
      } else {
        fieldState.users[userId!] = updater(fieldState.users[userId!]);
      }
      planState.state[fieldId] = fieldState;
      await planStateModel.getOneByIdAndUpdate(planState._id, planState);
    }
  }
  return planState;
}

export async function incrementPlanFieldState({
  value = 1,
  ...params
}: UpdateParams) {
  return updatePlanFieldState({
    ...params,
    updater: (prevValue: number) => prevValue + value,
  });
}

export async function decrementPlanFieldState({
  value = 1,
  ...params
}: UpdateParams) {
  return updatePlanFieldState({
    ...params,
    updater: (prevValue: number) => (prevValue > value ? prevValue - value : 0),
  });
}

export async function setPlanFieldState({ value, ...params }: UpdateParams) {
  if (!value) {
    throw new Error("Set field failed. Value must be provided");
  }
  return updatePlanFieldState({
    ...params,
    updater: () => value,
  });
}

interface GetStateParams {
  fieldCode?: PlanFieldCode;
  fieldId?: string;
  organizationId: string;
  userId?: string;
}
export async function getPlanFieldState(
  params: GetStateParams,
): Promise<ComputedOrgLevelFieldState | ComputedUserLevelFieldState> {
  const { organizationId, userId } = params;
  if (!params.fieldId && !params.fieldCode) {
    throw new Error(
      "Get field state failed. Either field id or code must be provided",
    );
  } else if (params.fieldId && params.fieldCode) {
    throw new Error(
      "Get field state failed. Either field id or code must be provided",
    );
  }

  const organization = await organizationModel
    .getOneById(organizationId)
    .populate("plan");
  if (!organization) {
    throw new Error("Get field state failed. Organization was not found");
  }

  const plan = organization.plan as IPlan;
  const planState = await planStateModel.getOne({
    organization: organizationId,
  });
  if (!planState) {
    throw new Error("Get field state failed. Plan state was not found");
  }

  const field = params.fieldId
    ? await planFieldModel.getOneById(params.fieldId)
    : await planFieldModel.getOne({ code: params.fieldCode });
  if (!field) {
    throw new Error(
      `Get field state failed. Field id "${params.fieldId}" was not found`,
    );
  }

  const fieldId = field._id.toString();
  const fieldValue = plan.values[fieldId] as number;

  if (field.kind !== PlanFieldKind.number) {
    // TODO: Implement getFieldValue!
    throw new Error(
      `Get field state failed. Field id "${fieldId}" is stateless. Use getFieldValue instead`,
    );
  }

  if (field.granularity === "user" && !userId) {
    throw new Error(
      "Get field state failed. Field granularity is 'user', but user ID was not provided",
    );
  }

  switch (field.granularity) {
    case "organization": {
      const fieldState = planState.state[fieldId] as OrgLevelFieldState;
      return {
        value: fieldState.value,
        limit: fieldValue,
        isAllowed: fieldState.value < fieldValue || fieldValue === -1,
      };
    }
    case "user": {
      const user = await userModel.getOne({
        _id: userId,
        organization: organizationId,
      });
      if (!user) {
        throw new Error(
          `Get field state failed. User ${userId} does not exist`,
        );
      }
      const fieldState = planState.state[fieldId] as UserLevelFieldState;

      const fieldUserValue = fieldState.users[userId!];
      if (typeof fieldUserValue === "undefined") {
        return {
          value: 0,
          limit: fieldValue,
          isAllowed: true,
        };
      }

      return {
        value: fieldUserValue,
        limit: fieldValue,
        isAllowed: fieldUserValue < fieldValue || fieldValue === -1,
      };
    }
  }
}

export async function resetPlanStates(resetMode: ResetMode) {
  const fields = await planFieldModel.get({
    resetMode,
    kind: PlanFieldKind.number,
  });

  const planStates = await planStateModel.get();

  await Promise.all(
    planStates.map(async (planState) => {
      for (const field of fields) {
        if (field.granularity === "organization") {
          const { initialValue = 0 } = field;
          planState.state[String(field._id)] = {
            value: initialValue as number,
          };
        } else if (field.granularity === "user") {
          planState.state[String(field._id)] = { users: {} };
        }
      }
      await planStateModel.getOneByIdAndUpdate(planState._id, planState);
    }),
  );
}
