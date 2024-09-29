from db.base import BaseModel
from db.db_types import Organization

organization_model = BaseModel[Organization](
    collection_name="organizations", model_class=Organization
)
