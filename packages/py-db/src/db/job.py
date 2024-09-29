from db.base import BaseModel
from db.db_types import Job


job_model = BaseModel[Job](collection_name="jobs", model_class=Job)
