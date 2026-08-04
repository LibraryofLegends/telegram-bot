# LIBRARY OF LEGENDS
### Project Phoenix

| Property | Value |
|---|---|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Framework | LOAF (Library Of Legends Architecture Framework) |
| Document | Naming Convention |
| Document ID | LOL-STD-0002 |
| Category | Standards |
| Architecture | LOAF 2.0 |
| Version | 1.0.0 |
| Status | Approved |
| Quality | ★★★★★ Enterprise Ready |
| Classification | Project Standard |
| Storage Path | `docs/standards/LOL-STD-0002_NAMING_CONVENTION.md` |
| Created | 2026-08-04 |
| Last Modified | 2026-08-04 |

---

# LOL-STD-0002 — Naming Convention

## Key Decisions

- Every identifier shall be descriptive.
- Naming consistency has higher priority than brevity.
- Official naming rules apply to all project assets.
- File names, folders and source code follow separate conventions.
- Every new component must comply with this standard.

---

## 1. Executive Summary

This document defines the official naming convention for the entire Library Of Legends platform.

Its purpose is to ensure consistency across source code, documentation, configuration files, databases and repository structures.

Every project asset shall follow these conventions.

---

## 2. Naming Philosophy

Names should explain their purpose.

Good naming reduces bugs, simplifies maintenance and minimizes unnecessary documentation.

A developer should understand the purpose of an element without reading its implementation.

---

## 3. General Rules

| Rule | Description |
|---|---|
| Clarity | Prefer descriptive names |
| Consistency | Follow existing project terminology |
| Predictability | Similar elements use similar names |
| Simplicity | Avoid unnecessary abbreviations |
| Readability | Names should be easy to understand |

---

## 4. Folder Naming

All directory names shall use lowercase.

Examples:

```text
core
database
telegram
userbot
metadata
statistics
collections
movies
series
```

Do not use:

```text
Core
MovieFiles
MyFolder
Telegram_Module
```

---

## 5. File Naming

Project files shall use **kebab-case**.

Examples:

```text
library-engine.ts
telegram-client.ts
movie-importer.ts
metadata-service.ts
search-engine.ts
```

---

## 6. TypeScript Classes

Classes shall use **PascalCase**.

Examples:

```text
LibraryEngine
MovieImporter
TelegramClient
MetadataService
SearchService
```

---

## 7. Interfaces

Interfaces shall begin with the letter **I**.

Examples:

```text
ILibraryRepository
IMetadataProvider
ITelegramClient
IImportService
```

---

## 8. Types

Types shall use PascalCase.

Examples:

```text
MovieMetadata
ImportContext
SearchResult
TelegramMessage
```

---

## 9. Enums

Enums shall use PascalCase.

Examples:

```text
MediaType
ImportStatus
LibraryCategory
UserRole
```

---

## 10. Variables

Variables shall use camelCase.

Examples:

```text
movieTitle
telegramMessage
libraryId
posterUrl
metadataResult
```

---

## 11. Functions

Functions shall use camelCase and begin with a verb.

Examples:

```text
parseMovie()

createLibraryId()

publishMedia()

updateStatistics()

fetchMetadata()

validateImport()
```

---

## 12. Constants

Constants shall use UPPER_SNAKE_CASE.

Examples:

```text
DEFAULT_LANGUAGE

BOT_VERSION

MAX_UPLOAD_SIZE

DEFAULT_TIMEOUT
```

---

## 13. Environment Variables

Environment variables shall also use UPPER_SNAKE_CASE.

Examples:

```text
BOT_TOKEN

DATABASE_URL

SUPABASE_URL

SUPABASE_KEY

TMDB_API_KEY

NODE_ENV
```

---

## 14. Database Naming

Database tables shall use snake_case.

Examples:

```text
movies

series

collections

statistics

users
```

Database columns shall also use snake_case.

Examples:

```text
library_id

created_at

updated_at

poster_url

release_date
```

---

## 15. API Endpoints

Endpoints shall use lowercase.

Examples:

```text
/api/movies

/api/series

/api/search

/api/library

/api/statistics
```

---

## 16. Document Naming

Documentation shall follow the official project prefixes.

| Prefix | Purpose |
|---|---|
| LOL-DOC | Foundation Documents |
| LOL-STD | Project Standards |
| LOL-SPEC | Technical Specifications |
| LOL-ADR | Architecture Decisions |
| LOL-MOD | Module Documentation |
| LOL-API | API Documentation |
| LOL-TEST | Test Documentation |
| LOL-DEP | Deployment Documentation |
| LOL-SEC | Security Documentation |

---

## 17. Library IDs

Every media item shall receive a unique Library ID.

Examples:

```text
LOL-MOV-000001

LOL-SER-000001

LOL-ANI-000001

LOL-BOO-000001

LOL-COM-000001

LOL-MUS-000001
```

---

## 18. Module IDs

Core platform modules shall use standardized identifiers.

Examples:

```text
LOL-CORE

LOL-DATABASE

LOL-IMPORTER

LOL-TELEGRAM

LOL-TMDB

LOL-SEARCH

LOL-AUTH

LOL-STATISTICS
```

---

## 19. Naming Principles

The naming convention follows five core principles.

| Principle | Description |
|---|---|
| Clear | Every name explains itself |
| Consistent | Similar concepts use similar names |
| Stable | Naming should not frequently change |
| Scalable | Supports future growth |
| Maintainable | Easy to understand years later |

---

## 20. Related Documents

| Document ID | Title |
|---|---|
| LOL-DOC-0001 | Project Charter |
| LOL-DOC-0002 | Library Blueprint |
| LOL-DOC-0003 | Repository Architecture |
| LOL-DOC-0004 | Architecture Overview |
| LOL-STD-0001 | Documentation Standard |

---

## 21. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-04 | Initial Naming Convention |

---

## 22. Approval

| Role | Status |
|---|---|
| Project Phoenix Team | Approved |
| Next Review | TBD |

---

## 23. End of Document

**Document ID:** LOL-STD-0002

**Version:** 1.0.0

**Status:** Approved