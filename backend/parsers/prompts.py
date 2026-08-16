"""Prompts and structured-output schemas used for local LLM statement parsing."""

import json

EXTRACTION_PROMPT = """You are extracting transaction rows from exactly one bank statement page.

Read the entire image from top to bottom. Return exactly one valid JSON object and nothing else.

The response must have this exact shape:
{"transactions": [...]}

Each transaction must have this shape:
{
  "date": "YYYY-MM-DD",
  "description": "merchant or transaction description",
  "amount": 12.34,
  "raw_text": "the complete visible transaction row"
}

Rules:
- Extract EVERY visible transaction row exactly once. Do not stop after the first row.
- Process one complete row at a time, top to bottom. Do not jump between rows.
- Do not extract statement balances, opening or closing balances, payment due amounts,
  credit limits, totals, fees summaries, headings, footers, page numbers, 
  advertisements, or notices.
- Do not extract "Balance from Previous Statement", "Previous Balance", "Balance Brought
  Forward", or any equivalent opening-balance carry-over line. These are not new
  transactions in the statement period.
- Do not extract "Payment for Previous Statement", "Payment Received" or any equivalent
  prior-period payment line.
- `date` must use ISO format YYYY-MM-DD. 
- If a transaction description spans multiple lines, merge it into one entry.
- Preserve merchant names and reference text; do not summarize or invent details.
- `amount` must be a JSON number, never a string. Remove currency symbols and
  thousands separators.
- The `date`, `description`, and `amount` you extract for each transaction MUST
  come directly from that transaction's own row. Cross-check: if the date or
  description you extracted does not appear in the raw_text for that same row,
  you have mixed up rows — go back and re-read that row in isolation.
- Positive amounts are debits and negative amounts are credits.
- `amount` sign is determined ONLY by how the amount is formatted on the page:
  1. Plain number with no suffix → POSITIVE (e.g. "88.70" → 88.70)
  2. Number followed by "CR"     → NEGATIVE (e.g. "140.57CR" → -140.57)
  3. Parenthesized number        → NEGATIVE (e.g. "(12.34)" → -12.34)
- Do not invent transactions that aren't visible on the page.
- If this page has no transactions, return {"transactions": []}.
"""

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "transactions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "pattern": r"^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$",
                    },
                    "description": {"type": "string", "minLength": 1},
                    "amount": {"type": "number"},
                    "raw_text": {"type": "string", "minLength": 1},
                },
                "required": ["date", "description", "amount", "raw_text"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["transactions"],
    "additionalProperties": False,
}


def build_metadata_prompt(account_candidates: list[dict]) -> str:
    """Build the document-level prompt using the application's account list."""
    allowed_accounts = [
        {
            "id": account["id"],
            "name": account["name"],
            "institution": account["institution"],
            "type": account["type"],
        }
        for account in account_candidates
    ]

    return f"""
    You are given the first page of a bank or credit card statement.

    Identify which configured account the statement belongs to and determine the statement period.
    
    Configured accounts:
    
    {json.dumps(allowed_accounts, indent=2, ensure_ascii=False)}
    
    Return ONLY a single valid JSON object.
    
    {{
      "account_id": null,
      "statement_period": null
    }}
    
    Rules:
    
    - `account_id` must be either:
      - one of the IDs from the configured account list, or
      - null if no confident match exists.
    - Match accounts only using information visible on the statement, such as:
      - financial institution
      - account name
      - card product name
    - Never infer the account from transaction merchants.
    - Do not guess. If multiple accounts could match or confidence is low, return null.
    - `statement_period` must be in YYYY-MM format.
    - Prefer the statement period end date.
    - If no statement period is shown, use the statement date.
    - Never use the payment due date.
    - If neither a statement period nor statement date is visible, return null.
    
    Return only the JSON object with no markdown or additional text.
    """
    """
    You are identifying which configured account this bank statement belongs to
    and extracting its statement period.
    Choose the single best matching account from this fixed list:
            {json.dumps(allowed_accounts, ensure_ascii=False)}
            
            Return exactly one valid JSON object and nothing else:
            {{"account_id": 1, "statement_period": "YYYY-MM"}}
            
            Rules:
            - `account_id` must be exactly one ID from the supplied list.
            - Match using the visible institution name, account or card name, product name, and
              masked account digits. Do not infer an account from transaction merchants.
            - If no account can be matched confidently, return null for `account_id`.
            - `statement_period` is the month containing the statement date or statement-period
              end date, in YYYY-MM format.
            - Do not use the payment due date as the statement period.
            - If no statement date or period end date is visible, return null for `statement_period`.
            """


def build_metadata_schema(account_candidates: list[dict]) -> dict:
    """Return a schema that permits only configured account IDs or null and statement period in YYYY-MM format."""
    account_ids = [account["id"] for account in account_candidates]

    schema = {
        "type": "object",
        "properties": {
            "account_id": {
                "type": ["integer", "null"],
                "enum": [*account_ids, None],
            },
            "statement_period": {
                "type": ["string", "null"],
                "pattern": r"^\d{4}-(0[1-9]|1[0-2])$",
            },
        },
        "required": ["account_id", "statement_period"],
        "additionalProperties": False,
    }

    return schema
