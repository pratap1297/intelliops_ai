from fastapi import APIRouter
import logging

router = APIRouter()
logger = logging.getLogger("gcp_simple")

@router.get("/api/gcp-simple/test")
def test_gcp_simple():
    logger.info("GCP simple test endpoint called")
    return {"status": "ok", "message": "GCP simple endpoint is working"}
