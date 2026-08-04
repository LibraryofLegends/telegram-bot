# LIBRARY OF LEGENDS
### Project Phoenix

| Property | Value |
|---|---|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Framework | LOAF (Library Of Legends Architecture Framework) |
| Document | Architecture Overview |
| Document ID | LOL-DOC-0004 |
| Category | Foundation |
| Architecture | LOAF 2.0 |
| Version | 1.0.0 |
| Status | Approved |
| Quality | ★★★★★ Enterprise Ready |
| Classification | Core Documentation |
| Storage Path | `docs/foundation/LOL-DOC-0004_ARCHITECTURE_OVERVIEW.md` |
| Created | 2026-08-04 |
| Last Modified | 2026-08-04 |

---

# LOL-DOC-0004 — Architecture Overview

## 1. Executive Summary

The Architecture Overview provides a high-level view of the complete Library Of Legends platform.

It defines the relationship between all major components, their responsibilities, communication paths and architectural boundaries.

This document is the central architectural reference for every future implementation.

---

## 2. Architectural Vision

Library Of Legends is designed as a modular, scalable and service-oriented platform.

Every component has one clearly defined responsibility.

Applications consume services.

Services communicate through the Core.

The Core coordinates the entire platform.

---

## 3. Platform Overview

```text
                          +----------------------+
                          |      Dashboard       |
                          +----------+-----------+
                                     |
                                     |
+-------------+            +----------v-----------+             +-------------+
| Telegram    |----------->|      Core Engine     |<------------| REST API    |
| Bot         |            +----------+-----------+             +-------------+
                                     |
                                     |
        +----------------------------+----------------------------+
        |            |            |            |                  |
        |            |            |            |                  |
+-------v--+  +------v-----+ +-----v------+ +---v-------+ +--------v--------+
| Importer |  | Metadata   | | Search     | | Statistics| | Authentication |
+-------+--+  +------+-----+ +------+-----+ +-----+-----+ +--------+--------+
        |              |              |             |                |
        +--------------+--------------+-------------+----------------+
                                     |
                           +---------v---------+
                           |    PostgreSQL     |
                           +---------+---------+
                                     |
                +--------------------+--------------------+
                |                    |                    |
        +-------v------+    +--------v-------+    +-------v-------+
        | Supabase     |    | Cloudinary     |    | TMDB / OMDb   |
        +--------------+    +----------------+    +---------------+
```

---

## 4. Platform Layers

| Layer | Purpose |
|---|---|
| Client Layer | User-facing applications |
| Service Layer | Platform services |
| Core Layer | Business orchestration |
| Infrastructure Layer | Database and external services |
| Storage Layer | Persistent media and metadata |

---

## 5. Core Components

| Component | Responsibility |
|---|---|
| Core Engine | Coordinates the platform |
| Event System | Internal communication |
| Configuration | Central configuration |
| Logging | Unified logging |
| Scheduler | Background jobs |
| Security | Access control |
| Module Registry | Service registration |

---

## 6. Client Applications

The platform is designed to support multiple clients.

| Client | Status |
|---|---|
| Telegram Bot | Planned |
| Telegram Userbot | Planned |
| REST API | Planned |
| Dashboard | Planned |
| CLI | Planned |
| Future Mobile App | Planned |
| Future Web Client | Planned |

Every client communicates only through official platform interfaces.

---

## 7. Platform Services

| Service | Purpose |
|---|---|
| Import Service | Media import |
| Metadata Service | Metadata extraction |
| TMDB Service | Movie metadata |
| Search Service | Search index |
| Statistics Service | Analytics |
| Collection Service | Collections |
| Authentication Service | User management |
| Storage Service | File management |

---

## 8. External Integrations

| Integration | Purpose |
|---|---|
| Telegram API | Bot communication |
| Telegram User API | Userbot |
| TMDB API | Movie metadata |
| OMDb API | Additional metadata |
| Supabase | Backend platform |
| PostgreSQL | Database |
| Cloudinary | Image hosting |

All external services shall remain isolated behind dedicated service modules.

---

## 9. Architectural Principles

The platform follows these principles:

- Separation of Concerns
- Single Responsibility Principle
- Dependency Inversion
- Modular Design
- Documentation First
- Security by Design
- Event-driven communication
- Interface-based architecture

---

## 10. Dependency Flow

Dependencies shall always move inward.

```text
Clients
      ↓

Applications
      ↓

Platform Services
      ↓

Core Engine
      ↓

Infrastructure
```

No lower layer may depend on a higher layer.

---

## 11. Long-Term Expansion

The architecture is prepared for:

| Future Capability | Planned |
|---|---|
| AI Metadata | ✅ |
| OCR | ✅ |
| Plugin System | ✅ |
| Recommendation Engine | ✅ |
| Cloud Synchronization | ✅ |
| Distributed Workers | ✅ |
| Multi-Language Support | ✅ |
| Public API | ✅ |

Future expansion shall never require redesigning the Core architecture.

---

## 12. Related Documents

| Document ID | Title |
|---|---|
| LOL-DOC-0001 | Project Charter |
| LOL-DOC-0002 | Library Blueprint |
| LOL-DOC-0003 | Repository Architecture |

---

## 13. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-04 | Initial Architecture Overview |

---

## 14. Approval

| Role | Status |
|---|---|
| Project Phoenix Team | Approved |
| Next Review | TBD |

---

## 15. End of Document

**Document ID:** LOL-DOC-0004

**Version:** 1.0.0

**Status:** Approved