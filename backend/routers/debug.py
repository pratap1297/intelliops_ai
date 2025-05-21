from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Base
from sqlalchemy import select
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/orm-tables")
def get_orm_tables(db: Session = Depends(get_db)):
    tables = []
    for table in Base.metadata.sorted_tables:
        columns = []
        for col in table.columns:
            columns.append({
                "name": col.name,
                "type": str(col.type),
                "nullable": col.nullable,
                "primary_key": col.primary_key
            })
        tables.append({
            "name": table.name,
            "columns": columns
        })
    return JSONResponse(content={"tables": tables})

from fastapi import Query
import json

@router.get("/orm-table-data")
def get_orm_table_data(
    db: Session = Depends(get_db),
    table: str = Query(..., description="Table name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    filter: str = Query(None, description="JSON object as string for filtering, e.g. '{\"email\":\"foo@bar.com\"}'")
):
    # Find the table by name
    target_table = None
    for t in Base.metadata.sorted_tables:
        if t.name == table:
            target_table = t
            break
    if target_table is None:
        return JSONResponse(content={"error": f"Table '{table}' not found."}, status_code=404)

    stmt = select(target_table)

    # Filtering
    if filter:
        try:
            filter_dict = json.loads(filter)
            for key, value in filter_dict.items():
                if key in target_table.c:
                    stmt = stmt.where(target_table.c[key] == value)
        except Exception as e:
            return JSONResponse(content={"error": f"Invalid filter: {e}"}, status_code=400)

    # Pagination
    total = db.execute(select([target_table.count()])).scalar() if hasattr(target_table, 'count') else None
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    import datetime
    rows = db.execute(stmt).fetchall()
    def serialize_row(row):
        d = {}
        for k, v in dict(row._mapping).items():
            if isinstance(v, (datetime.datetime, datetime.date, datetime.time)):
                d[k] = v.isoformat()
            else:
                d[k] = v
        return d
    row_dicts = [serialize_row(row) for row in rows]
    return JSONResponse(content={
        "name": target_table.name,
        "rows": row_dicts,
        "page": page,
        "page_size": page_size,
        "total": total
    })

@router.get("/orm-table-list")
def get_orm_table_list():
    return JSONResponse(content={"tables": [t.name for t in Base.metadata.sorted_tables]})
