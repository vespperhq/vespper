from db.base import BaseModel
from db.db_types import Snapshot


snapshot_model = BaseModel[Snapshot](collection_name="snapshots", model_class=Snapshot)


async def get_previous_snapshot(current_snapshot_id: str) -> Snapshot | None:
    current_snapshot = await snapshot_model.get_one_by_id(current_snapshot_id)

    # If there is no current snapshot, this is the first snapshot
    if not current_snapshot:
        return None

    previous_snapshot = await snapshot_model.get_one(
        {"createdAt": {"$lt": current_snapshot.createdAt}},
        sort=[("createdAt", -1)],
    )

    return previous_snapshot


snapshot_model.get_previous_snapshot = get_previous_snapshot
