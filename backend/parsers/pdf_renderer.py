import base64
import pymupdf

def pdf_to_images(pdf_path: str, zoom: float = 2.0) -> list[str]:
    """Render every PDF page as a base64-encoded PNG for the LLM."""

    images_b64 = []
    matrix = pymupdf.Matrix(zoom, zoom)

    with pymupdf.open(pdf_path) as document:
        for page in document:
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            image_bytes = pixmap.tobytes("png")
            images_b64.append(
                base64.b64encode(image_bytes).decode("ascii")
            )

    return images_b64
