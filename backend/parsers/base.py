from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ParsedTransaction:
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    raw_text: Optional[str] = None


@dataclass
class ParseResult:
    transactions: list[ParsedTransaction] = field(default_factory=list)
    account_hint: Optional[str] = None
    statement_period: Optional[str] = None
    warnings: list[str] = field(default_factory=list)


class BaseParser(ABC):
    @abstractmethod
    def parse(self, pdf_path: str) -> ParseResult:
        ...

    @abstractmethod
    def can_parse(self, pdf_path: str) -> bool:
        ...
