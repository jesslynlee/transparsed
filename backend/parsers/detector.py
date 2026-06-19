import os
import json

from parsers.template_parser import TemplateParser


class UnknownBankError(Exception):
    pass


class BankDetector:
    def __init__(self, templates_dir: str):
        self.parsers = []
        if not os.path.isdir(templates_dir):
            return
        for filename in os.listdir(templates_dir):
            if not filename.endswith(".json"):
                continue
            path = os.path.join(templates_dir, filename)
            with open(path) as f:
                config = json.load(f)
            template_id = config.get("template_id", filename.replace(".json", ""))
            parser = TemplateParser(path)
            self.parsers.append((template_id, parser))

    def detect(self, pdf_path: str):
        for template_id, parser in self.parsers:
            if parser.can_parse(pdf_path):
                return template_id, parser
        raise UnknownBankError(
            f"Could not identify bank for: {os.path.basename(pdf_path)}. "
            f"Checked {len(self.parsers)} template(s)."
        )
