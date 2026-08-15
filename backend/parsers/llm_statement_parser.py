import re

import pymupdf
from flask import current_app

from parsers.base import BaseParser, ParsedTransaction, ParseResult
from parsers.llm_client import LlmClient
from parsers.pdf_renderer import pdf_to_images


def _load_global_category_keywords():
    from models.category import get_all_keywords
    try:
        return get_all_keywords()
    except Exception:
        return {}


class LlmStatementParser(BaseParser):
    def __init__(self, account_candidates: list[dict]):
        self.client = LlmClient()
        self.category_keywords = _load_global_category_keywords()
        self.account_candidates = account_candidates

    def can_parse(self, pdf_path: str) -> bool:
        """
        Returns whether a PDF can be opened and rendered as an image for LLM parsing.

        Rejects password-protected PDFs and empty documents. To verify the document is
        usable, it renders the first page at low resolution and confirms the resulting
        image has non-zero dimensions. It does not determine whether the LLM can
        successfully extract transactions; that is handled later by `parse()`.
        """
        try:
            with pymupdf.open(pdf_path) as document:
                if document.needs_pass or document.page_count == 0:
                    return False

                # Verify at least the first page can render as an image.
                first_page = document[0]
                pixmap = first_page.get_pixmap(
                    matrix=pymupdf.Matrix(1, 1),
                    alpha=False,
                )

                return pixmap.width > 0 and pixmap.height > 0

        except (pymupdf.FileDataError, RuntimeError, OSError):
            return False

    def parse(self, pdf_path: str) -> ParseResult:
        transactions = []
        warnings = []

        current_app.logger.info("Rendering PDF pages for LLM parsing: %s", pdf_path)
        images_b64 = pdf_to_images(
            pdf_path,
            zoom=current_app.config["PDF_RENDER_DPI"] / 72,
        )
        if not images_b64:
            raise ValueError("The PDF has no renderable pages.")
        current_app.logger.info("Rendered %s PDF pages", len(images_b64))

        current_app.logger.info("Extracting account and statement period from page 1")
        metadata = self.client.extract_account_statement_period(
            image_b64=images_b64[0],
            account_candidates=self.account_candidates,
        )
        current_app.logger.info(
            "Extracted statement metadata: account_id=%s statement_period=%s",
            metadata.get("account_id"),
            metadata.get("statement_period"),
        )

        for page_number, image_b64 in enumerate(images_b64, start=1):
            current_app.logger.info(
                "Extracting transactions from page %s/%s",
                page_number,
                len(images_b64),
            )
            try:
                result = self.client.extract_transactions(image_b64)
            except Exception as error:
                warnings.append(f"Could not parse page {page_number}: {error}")
                current_app.logger.warning(
                    "Could not parse page %s/%s: %s",
                    page_number,
                    len(images_b64),
                    error,
                )
                continue

            page_transactions = result.get("transactions", [])
            current_app.logger.info(
                "Extracted %s transactions from page %s/%s",
                len(page_transactions),
                page_number,
                len(images_b64),
            )
            for txn in page_transactions:
                transactions.append(
                    ParsedTransaction(
                        date=txn["date"],
                        description=txn["description"],
                        amount=float(txn["amount"]),
                        category=self._guess_category(txn["description"]),
                        raw_text=txn.get("raw_text"),
                    )
                )

        return ParseResult(
            transactions=transactions,
            account_id=metadata.get("account_id"),
            statement_period=metadata.get("statement_period"),
            warnings=warnings,
        )

    def _guess_category(self, description):
        desc_compact = re.sub(r'\s+', '', description).upper()
        for category, keywords in self.category_keywords.items():
            for kw in keywords:
                kw_compact = re.sub(r'[\s*+?]', '', kw).upper()
                if kw_compact in desc_compact:
                    return category
        return None
