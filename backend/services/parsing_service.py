import os

from flask import current_app

from models import account as account_model
from models import transaction as transaction_model
from parsers.detector import BankDetector, UnknownBankError


def process_upload(file_storage):
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    templates_dir = current_app.config["TEMPLATES_DIR"]
    filename = file_storage.filename

    save_path = os.path.join(upload_folder, filename)
    file_storage.save(save_path)

    file_hash = transaction_model.compute_file_hash(save_path)
    if transaction_model.check_duplicate_file(file_hash):
        os.remove(save_path)
        raise DuplicateFileError(f"This statement has already been uploaded: {filename}")

    detector = BankDetector(templates_dir)
    try:
        template_id, parser = detector.detect(save_path)
    except UnknownBankError:
        os.remove(save_path)
        raise UnknownBankForUpload(
            f"Could not identify the bank for: {filename}. "
            "Check that a matching template exists."
        )

    result = parser.parse(save_path)

    acct = _ensure_account(template_id, parser.config)

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

    return {
        "transaction_count": inserted,
        "account_name": acct["name"],
        "statement_period": result.statement_period,
        "warnings": result.warnings,
    }


def _ensure_account(template_id, config):
    accounts = account_model.get_all()
    for acct in accounts:
        if acct["template_id"] == template_id:
            return acct
    return account_model.create(
        name=config.get("account_name", template_id),
        account_type=config.get("account_type", "credit_card"),
        institution=config.get("institution", "Unknown"),
        template_id=template_id,
    )


class DuplicateFileError(Exception):
    pass


class UnknownBankForUpload(Exception):
    pass
