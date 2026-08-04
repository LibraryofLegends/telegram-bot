# Library Of Legends

# Naming Convention

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-STD-0002 |
| Version | 2.0.0 |
| Status | Approved |
| Classification | Standard |

---

# Table of Contents

1. Purpose
2. Scope
3. Naming Philosophy
4. Repository Naming
5. Directory Naming
6. File Naming
7. Class Naming
8. Interface Naming
9. Function Naming
10. Variable Naming
11. Constant Naming
12. Enum Naming
13. Document Naming
14. Practical Impact
15. Related Documents
16. Revision History
17. Approval Block

---

# 1. Purpose

This standard defines the official naming conventions used throughout the Library Of Legends platform.

Consistent naming improves readability, maintainability and developer productivity.

---

# 2. Scope

This standard applies to:

- Repository Structure
- Directories
- Files
- Classes
- Interfaces
- Functions
- Variables
- Constants
- Enumerations
- Documentation

---

# 3. Naming Philosophy

Names shall be:

- Clear
- Predictable
- Descriptive
- Consistent
- Technology Independent

Names shall describe purpose rather than implementation.

---

# 4. Repository Naming

Repository names use lowercase characters with hyphens.

Example

library-of-legends

---

# 5. Directory Naming

Directories use lowercase characters.

Words are separated using hyphens only when necessary.

Examples

features/

providers/

framework/

applications/

shared/

---

# 6. File Naming

TypeScript source files use kebab-case.

Examples

movie-service.ts

import-manager.ts

metadata-parser.ts

telegram-provider.ts

---

# 7. Class Naming

Classes use PascalCase.

Examples

MovieService

ImportManager

TelegramProvider

MetadataParser

LibraryEngine

---

# 8. Interface Naming

Interfaces use PascalCase.

The prefix "I" shall not be used.

Examples

MediaRepository

MovieImporter

SearchProvider

---

# 9. Function Naming

Functions use camelCase.

Examples

loadMovie()

createImportJob()

findCollection()

publishMessage()

---

# 10. Variable Naming

Variables use camelCase.

Examples

movieTitle

releaseYear

searchResults

telegramClient

---

# 11. Constant Naming

Constants use UPPER_SNAKE_CASE.

Examples

DEFAULT_LANGUAGE

MAX_IMPORT_SIZE

SUPPORTED_EXTENSIONS

---

# 12. Enum Naming

Enumerations use PascalCase.

Enum values use UPPER_SNAKE_CASE.

Example

MediaType

MOVIE

SERIES

BOOK

COMIC

---

# 13. Document Naming

Official documents follow the approved naming format.

Examples

LOL-DOC-0001_PROJECT_CHARTER.md

LOL-STD-0002_NAMING_CONVENTION.md

LOL-POL-0001_DEVELOPMENT_POLICY.md

LOL-WF-0001_DEVELOPMENT_WORKFLOW.md

---

# 14. Practical Impact

This naming convention applies to the entire repository.

Affected Areas

- framework/
- providers/
- features/
- applications/
- packages/
- tests/
- tools/
- docs/

Every future artifact shall follow these naming rules.

---

# 15. Related Documents

- LOL-DOC-0003 Repository Architecture
- LOL-STD-0001 Documentation Standard
- LOL-STD-0003 Repository Standard

---

# 16. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 2.0.0 | 2026-08-04 | Initial Naming Convention |

---

# 17. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Architecture Review | Approved |
| Final Approval | Approved |

---

End of Document

Document ID

LOL-STD-0002