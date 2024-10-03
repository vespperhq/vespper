from db.base import BaseModel
from db.db_types import PlanField

plan_field_model = BaseModel[PlanField](
    collection_name="plan_fields", model_class=PlanField
)
