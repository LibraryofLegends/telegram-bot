# LIBRARY OF LEGENDS
### Project Phoenix

| Property | Value |
|---|---|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Framework | LOAF (Library Of Legends Architecture Framework) |
| Document | File Header Standard |
| Document ID | LOL-STD-0004 |
| Category | Standards |
| Architecture | LOAF 2.0 |
| Version | 1.0.0 |
| Status | Approved |
| Quality | ★★★★★ Enterprise Ready |
| Classification | Project Standard |
| Storage Path | `docs/standards/LOL-STD-0004_FILE_HEADER_STANDARD.md` |
| Created | 2026-08-04 |
| Last Modified | 2026-08-04 |

---

# LOL-STD-0004 — File Header Standard

## Key Decisions

- Every source file shall begin with an official Library Of Legends header.
- Every header follows the same structure.
- Headers describe purpose, ownership and responsibility.
- Business logic shall never be documented only inside the implementation.
- Source files remain self-describing.

---

# 1. Executive Summary

This document defines the mandatory header format for every source file within the Library Of Legends project.

The purpose of the header is to provide immediate context without reading the implementation.

Every developer should understand the responsibility of a file within a few seconds.

---

# 2. Header Philosophy

A source file is more than code.

Every important file shall describe:

- why it exists
- what it does
- where it belongs
- which modules depend on it

---

# 3. Standard Header

Every implementation file shall begin with the following structure.

```ts
/*
===============================================================================

LIBRARY OF LEGENDS
Project Phoenix

-------------------------------------------------------------------------------

Module..............:

Component...........:

File................:

Package.............:

Location............:

Author..............:

Version.............:

Status..............:

===============================================================================
DESCRIPTION
===============================================================================

Short description.

===============================================================================
*/
```

---

# 4. Required Header Fields

| Field | Required |
|---|---|
| Module | ✅ |
| Component | ✅ |
| File | ✅ |
| Package | ✅ |
| Location | ✅ |
| Version | ✅ |
| Status | ✅ |
| Description | ✅ |

---

# 5. Optional Fields

The following information may be added where appropriate.

| Field |
|---|
| Dependencies |
| Related Modules |
| TODO |
| Notes |
| Review Date |
| Library ID |

---

# 6. Header Rules

- Keep descriptions concise.
- Avoid implementation details.
- Keep formatting consistent.
- Do not duplicate code comments.

---

# 7. Documentation Boundary

The header explains **purpose**.

The implementation explains **behavior**.

The documentation explains **architecture**.

These responsibilities shall never overlap.

---

# 8. Header Example

```ts
/*
===============================================================================

LIBRARY OF LEGENDS
Project Phoenix

-------------------------------------------------------------------------------

Module..............: Telegram

Component...........: Telegram Client

File................: telegram-client.ts

Package.............: packages/telegram

Location............: packages/telegram/src

Version.............: 1.0.0

Status..............: Development

===============================================================================
DESCRIPTION
===============================================================================

Provides communication with the Telegram Bot API.

===============================================================================
*/
```

---

# 9. Benefits

Using a standardized header provides:

| Benefit | Description |
|---|---|
| Faster onboarding | Developers understand files immediately |
| Better maintenance | Responsibilities remain clear |
| Improved consistency | Every file follows the same structure |
| Easier reviews | Reviewers have immediate context |
| Better documentation | Less ambiguity across the project |

---

# 10. Related Documents

| Document ID | Title |
|---|---|
| LOL-DOC-0001 | Project Charter |
| LOL-DOC-0002 | Library Blueprint |
| LOL-STD-0001 | Documentation Standard |
| LOL-STD-0002 | Naming Convention |
| LOL-STD-0003 | Repository Standard |

---

# 11. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-04 | Initial File Header Standard |

---

# 12. Approval

| Role | Status |
|---|---|
| Project Phoenix Team | Approved |
| Next Review | TBD |

---

# 13. End of Document

**Document ID:** LOL-STD-0004

**Version:** 1.0.0

**Status:** Approved