from db.base import BaseModel
from db.db_types import Vendor

vendor_model = BaseModel[Vendor](collection_name="vendors", model_class=Vendor)
