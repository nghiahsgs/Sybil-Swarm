"""Parse product input — URL scraping or plain text extraction."""

import ipaddress
import logging
import socket
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Block private/internal IP ranges to prevent SSRF
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / cloud metadata
    ipaddress.ip_network("::1/128"),
]


def _is_safe_url(url: str) -> bool:
    """Validate URL is not targeting internal networks."""
    parsed = urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        return False
    try:
        resolved = socket.getaddrinfo(hostname, None)
        for _, _, _, _, addr in resolved:
            ip = ipaddress.ip_address(addr[0])
            if any(ip in net for net in _BLOCKED_NETWORKS):
                return False
    except (socket.gaierror, ValueError):
        return False
    return True


class ProductInfo(BaseModel):
    """Structured product information extracted from input."""

    name: str = "Unknown Product"
    description: str = ""
    features: list[str] = []
    pricing: str = ""
    target_audience: str = ""
    raw_text: str = ""


async def parse_url(url: str) -> ProductInfo:
    """Scrape URL and extract product information."""
    if not _is_safe_url(url):
        logger.warning(f"Blocked SSRF attempt: {url}")
        return ProductInfo(name="Blocked URL", description="URL targets internal network", raw_text=url)

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "SybilSwarm/0.1"})
            resp.raise_for_status()
    except httpx.HTTPError as e:
        logger.warning(f"URL scrape failed: {e}")
        return ProductInfo(name="URL Scrape Failed", description=str(e), raw_text=url)

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract key elements
    title = soup.title.string.strip() if soup.title and soup.title.string else "Unknown"
    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta_desc = meta_tag["content"]

    # Collect headings
    headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3"])[:10]]

    # Collect paragraph text (first 2000 chars)
    paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")[:20]]
    body_text = " ".join(paragraphs)[:2000]

    # Look for pricing elements
    pricing_text = ""
    for el in soup.find_all(string=lambda s: s and ("$" in s or "price" in s.lower() or "plan" in s.lower())):
        pricing_text += el.strip() + " "
        if len(pricing_text) > 500:
            break

    return ProductInfo(
        name=title,
        description=meta_desc or (body_text[:300] if body_text else ""),
        features=headings[:8],
        pricing=pricing_text.strip()[:500],
        raw_text=body_text,
    )


def parse_text(text: str) -> ProductInfo:
    """Parse plain text product description."""
    lines = text.strip().split("\n")
    name = lines[0][:100] if lines else "Product"
    description = " ".join(lines[1:])[:1000] if len(lines) > 1 else text[:1000]

    return ProductInfo(
        name=name,
        description=description,
        raw_text=text[:2000],
    )


async def parse_input(product_input: str) -> ProductInfo:
    """Auto-detect input type and parse accordingly."""
    cleaned = product_input.strip()
    if cleaned.startswith(("http://", "https://")):
        return await parse_url(cleaned)
    return parse_text(cleaned)
