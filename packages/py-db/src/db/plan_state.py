from db.base import BaseModel
from db.db_types import PlanState

plan_state_model = BaseModel[PlanState](
    collection_name="plan_states", model_class=PlanState
)
