/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                          PROJECT PHOENIX
===============================================================================

Project.............: Library Of Legends

Codename............: Project Phoenix

Framework...........: LOAF (Library Of Legends Architecture Framework)

Document............: Naming Convention

Document ID.........: LOL-STD-0001

Category............: Standards

Architecture........: LOAF 2.0

Version.............: 1.0.0

Status..............: APPROVED

Quality.............: ★★★★★ Enterprise Ready

Classification......: Core Documentation

Storage Path........:
docs/standards/LOL-STD-0001_NAMING_CONVENTION.md

Created.............: 2026-08-04

Last Modified.......: 2026-08-04

===============================================================================
DESCRIPTION
===============================================================================

This document defines the official naming convention for the entire
Library Of Legends platform.

Every folder, file, class, interface, database object, environment variable,
API endpoint and documentation file must follow these conventions.

Consistency is mandatory.

===============================================================================
*/

# LOL-STD-0001 — Naming Convention

---

# 1. Purpose

This standard guarantees that every element of the project follows one
consistent naming strategy.

Naming shall always prioritize clarity over brevity.

---

# 2. General Rules

Names must be

• Clear

• Descriptive

• Consistent

• Predictable

Avoid abbreviations unless officially defined.

---

# 3. Folder Names

Use

lowercase

Example

core

telegram

userbot

metadata

statistics

collections

database

movies

series

anime

Never

Core

MovieFiles

MyFolder

---

# 4. File Names

Use

kebab-case

Examples

library-engine.ts

metadata-service.ts

telegram-client.ts

search-engine.ts

movie-parser.ts

Never

LibraryEngine.ts

MovieParser.ts

Movie_Parser.ts

---

# 5. TypeScript Classes

Use

PascalCase

Examples

LibraryEngine

MovieImporter

TelegramClient

MetadataService

---

# 6. Interfaces

Use PascalCase with "I" prefix.

Examples

ILibraryService

ITelegramClient

IMovieRepository

---

# 7. Types

PascalCase

MovieMetadata

ImportContext

SearchResult

---

# 8. Enums

PascalCase

MediaType

ImportStatus

LibraryCategory

---

# 9. Constants

UPPER_SNAKE_CASE

Examples

DEFAULT_LANGUAGE

MAX_UPLOAD_SIZE

BOT_VERSION

---

# 10. Variables

camelCase

movieTitle

libraryId

importContext

telegramMessage

---

# 11. Functions

camelCase

parseMovie()

createLibraryId()

publishMedia()

updateStatistics()

---

# 12. Environment Variables

UPPER_SNAKE_CASE

Examples

BOT_TOKEN

SUPABASE_URL

SUPABASE_KEY

TMDB_API_KEY

DATABASE_URL

NODE_ENV

---

# 13. Database

Tables

snake_case

movies

series

collections

users

statistics

Columns

snake_case

library_id

created_at

updated_at

release_date

poster_url

---

# 14. API Endpoints

Use lowercase.

Examples

/api/movies

/api/series

/api/search

/api/library

---

# 15. Document IDs

Examples

LOL-DOC-0001

LOL-STD-0001

LOL-SPEC-0001

LOL-MOD-0001

LOL-ADR-0001

LOL-API-0001

LOL-TEST-0001

---

# 16. Library IDs

Every media item shall receive a unique identifier.

Examples

LOL-MOV-000001

LOL-SER-000001

LOL-ANI-000001

LOL-BOO-000001

LOL-MUS-000001

LOL-COM-000001

---

# 17. Module IDs

Examples

LOL-CORE

LOL-TELEGRAM

LOL-USERBOT

LOL-TMDB

LOL-SEARCH

LOL-DATABASE

LOL-IMPORTER

---

# 18. Naming Philosophy

Good names reduce documentation.

Good names reduce bugs.

Good names improve maintainability.

Every identifier should explain itself.

---

===============================================================================
RELATED DOCUMENTS
===============================================================================

LOL-DOC-0001 — Project Charter

LOL-DOC-0002 — Library Blueprint

LOL-DOC-0003 — Documentation Standard

===============================================================================
CHANGE LOG
===============================================================================

Version    Date         Description

1.0.0      2026-08-04   Initial Naming Convention

===============================================================================
DOCUMENT APPROVAL
===============================================================================

Status...............: APPROVED

Quality Rating.......: ★★★★★ Enterprise Ready

Approved By..........: Project Phoenix Team

Approval Date........: 2026-08-04

Next Review..........: TBD

===============================================================================
END OF DOCUMENT
===============================================================================