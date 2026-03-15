"""Report download endpoints — Markdown export."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.services.report_generator import generate_markdown_report

router = APIRouter(tags=["reports"])


@router.get("/simulations/{sim_id}/report/download")
async def download_report(sim_id: int, format: str = "md"):
    """Download simulation report as Markdown."""
    if format not in ("md",):
        raise HTTPException(status_code=400, detail="Supported formats: md")

    try:
        markdown = generate_markdown_report(sim_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return PlainTextResponse(
        content=markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=sybil-swarm-report-{sim_id}.md"},
    )
