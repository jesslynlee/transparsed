import json
import re

import pdfplumber

from parsers.base import BaseParser, ParsedTransaction, ParseResult


def _load_global_category_keywords():
    from models.category import get_all_keywords
    try:
        return get_all_keywords()
    except Exception:
        return {}


class TemplateParser(BaseParser):
    def __init__(self, template_path: str):
        with open(template_path) as f:
            self.config = json.load(f)
        self.category_keywords = _load_global_category_keywords()

    def can_parse(self, pdf_path: str) -> bool:
        keywords = self.config["detection"]["keywords"]
        min_matches = self.config["detection"].get("min_matches", 2)
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = pdf.pages[0].extract_text() or ""
                text_upper = text.upper()
                matches = sum(1 for kw in keywords if re.search(kw, text_upper, re.IGNORECASE))
                return matches >= min_matches
        except Exception:
            return False

    def parse(self, pdf_path: str) -> ParseResult:
        transactions = []
        warnings = []
        statement_period = None

        with pdfplumber.open(pdf_path) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""

                if page_idx == 0:
                    statement_period = self._extract_statement_period(text)

                words = page.extract_words(
                    keep_blank_chars=True, x_tolerance=3, y_tolerance=3
                )
                page_txns, page_warnings, hit_stop = self._extract_transactions(words, statement_period)
                transactions.extend(page_txns)
                warnings.extend(page_warnings)

                if hit_stop:
                    break

        return ParseResult(
            transactions=transactions,
            account_hint=self.config.get("template_id"),
            statement_period=statement_period,
            warnings=warnings,
        )

    def _extract_statement_period(self, text: str):
        import datetime

        sp_config = self.config.get("statement_period", {})
        pattern = sp_config.get("pattern")
        if not pattern:
            return None
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            return None
        group_idx = sp_config.get("date_group", 2)
        date_fmt = sp_config.get("date_format", "%d %b %Y")
        try:
            date_str = match.group(group_idx)
            end_date = datetime.datetime.strptime(date_str, date_fmt)
            return f"{end_date.year}-{end_date.month:02d}"
        except (IndexError, ValueError):
            return match.group(1)

    def _extract_transactions(self, words, statement_period):
        transactions = []
        warnings = []
        hit_stop = False

        col = self.config["columns"]
        has_post_date = "post_date" in col
        has_tran_date = "tran_date" in col
        has_date = "date" in col
        if has_post_date:
            post_date_range = (col["post_date"]["x_min"], col["post_date"]["x_max"])
        if has_tran_date:
            tran_date_range = (col["tran_date"]["x_min"], col["tran_date"]["x_max"])
        if has_date:
            date_range = (col["date"]["x_min"], col["date"]["x_max"])
        desc_range = (col["description"]["x_min"], col["description"]["x_max"])
        amount_range = (col["amount"]["x_min"], col["amount"]["x_max"])

        lines = self._group_into_lines(words)
        date_pattern = re.compile(self.config["extraction"]["date_pattern"])
        skip_patterns = [re.compile(p) for p in self.config["extraction"].get("skip_patterns", [])]
        stop_patterns = [re.compile(p) for p in self.config["extraction"].get("stop_patterns", [])]

        in_transaction_area = False
        start_after = self.config["extraction"].get("start_after", "POST DATE")

        for y in sorted(lines.keys()):
            line_words = lines[y]
            full_text = " ".join(w["text"] for w in sorted(line_words, key=lambda w: w["x0"]))

            if not in_transaction_area:
                if re.search(start_after, full_text, re.IGNORECASE):
                    in_transaction_area = True
                continue

            if any(p.search(full_text) for p in stop_patterns):
                hit_stop = True
                break

            if any(p.search(full_text) for p in skip_patterns):
                continue

            if has_date:
                date_words = self._words_in_range(line_words, *date_range)
                date_text = " ".join(w["text"] for w in date_words).strip()
                post_date_text = ""
                tran_date_text = date_text
            else:
                post_date_words = self._words_in_range(line_words, *post_date_range) if has_post_date else []
                tran_date_words = self._words_in_range(line_words, *tran_date_range) if has_tran_date else []
                post_date_text = " ".join(w["text"] for w in post_date_words).strip()
                tran_date_text = " ".join(w["text"] for w in tran_date_words).strip()

            desc_words = self._words_in_range(line_words, *desc_range)
            amount_words = self._words_in_range(line_words, *amount_range)

            desc_text = " ".join(w["text"] for w in desc_words).strip()
            amount_text = " ".join(w["text"] for w in amount_words).strip()

            if not date_pattern.match(tran_date_text) and not date_pattern.match(post_date_text):
                continue

            if not amount_text or not desc_text:
                continue

            amount, is_credit = self._parse_amount(amount_text)
            if amount is None:
                warnings.append(f"Could not parse amount: {amount_text}")
                continue

            date_str = tran_date_text or post_date_text
            date_iso = self._to_iso_date(date_str, statement_period)

            category = self._guess_category(desc_text)

            transactions.append(
                ParsedTransaction(
                    date=date_iso,
                    description=desc_text,
                    amount=-amount if is_credit else amount,
                    category=category,
                    raw_text=full_text,
                )
            )

        return transactions, warnings, hit_stop

    def _group_into_lines(self, words, y_tolerance=4):
        lines = {}
        for w in words:
            matched = False
            for y_key in lines:
                if abs(w["top"] - y_key) <= y_tolerance:
                    lines[y_key].append(w)
                    matched = True
                    break
            if not matched:
                lines[w["top"]] = [w]
        return lines

    def _words_in_range(self, words, x_min, x_max):
        return sorted(
            [w for w in words if w["x0"] >= x_min - 5 and w["x0"] <= x_max],
            key=lambda w: w["x0"],
        )

    def _parse_amount(self, text):
        text = text.strip()
        is_credit = False
        if text.upper().endswith("CR"):
            is_credit = True
            text = text[:-2].strip()

        text = text.replace("$", "").replace(",", "").strip()

        if text.startswith("(") and text.endswith(")"):
            is_credit = True
            text = text[1:-1]

        try:
            return float(text), is_credit
        except ValueError:
            return None, False

    def _to_iso_date(self, date_text, statement_period):
        date_format = self.config.get("date_format", "%d %b")
        import datetime

        if statement_period:
            year_match = re.search(r"(\d{4})", statement_period)
            year = int(year_match.group(1)) if year_match else datetime.date.today().year
        else:
            year = datetime.date.today().year

        normalized = re.sub(r"(\d{2})(\w{3})", r"\1 \2", date_text.strip())

        try:
            parsed = datetime.datetime.strptime(normalized, date_format)
            return f"{year}-{parsed.month:02d}-{parsed.day:02d}"
        except ValueError:
            return date_text

    def _guess_category(self, description):
        desc_compact = re.sub(r'\s+', '', description).upper()
        for category, keywords in self.category_keywords.items():
            for kw in keywords:
                kw_compact = re.sub(r'[\s*+?]', '', kw).upper()
                if kw_compact in desc_compact:
                    return category
        return None
