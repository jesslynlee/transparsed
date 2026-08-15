import os

from flask import current_app

from models import account as account_model
from models import transaction as transaction_model
from parsers.llm_statement_parser import LlmStatementParser


def process_upload(file_storage):
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    filename = file_storage.filename

    current_app.logger.info("Parsing upload started: %s", filename)
    save_path = os.path.join(upload_folder, filename)
    file_storage.save(save_path)

    file_hash = transaction_model.compute_file_hash(save_path)
    if transaction_model.check_duplicate_file(file_hash):
        os.remove(save_path)
        raise DuplicateFileError(f"This statement has already been uploaded: {filename}")

    account_candidates = account_model.get_all()
    if not account_candidates:
        os.remove(save_path)
        raise AccountMatchError("No accounts are configured for LLM statement matching.")

    parser = LlmStatementParser(account_candidates)
    if not parser.can_parse(save_path):
        os.remove(save_path)
        raise ValueError("The PDF could not be rendered into images for LLM parsing.")
    result = parser.parse(save_path)

    account_ids = {account["id"] for account in account_candidates}
    if result.account_id not in account_ids:
        raise AccountMatchError("Could not match this statement to a configured account.")

    acct = account_model.get_by_id(result.account_id)
    current_app.logger.info(
        "Statement matched: filename=%s account_id=%s account_name=%s statement_period=%s",
        filename,
        acct["id"],
        acct["name"],
        result.statement_period,
    )

    inserted = transaction_model.insert_pending_batch(
        result.transactions,
        account_id=acct["id"],
        statement_period=result.statement_period,
        source_file=filename,
    )

    transaction_model.record_upload(
        filename=filename,
        account_id=acct["id"],
        statement_period=result.statement_period,
        file_hash=file_hash,
    )
    current_app.logger.info(
        "Parsing upload completed: filename=%s transactions=%s warnings=%s",
        filename,
        inserted,
        len(result.warnings),
    )

    return {
        "transaction_count": inserted,
        "account_name": acct["name"],
        "statement_period": result.statement_period,
        "warnings": result.warnings,
    }


class DuplicateFileError(Exception):
    pass


class AccountMatchError(Exception):
    pass
