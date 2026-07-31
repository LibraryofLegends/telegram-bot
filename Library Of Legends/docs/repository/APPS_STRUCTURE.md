# Library Of Legends

# APPS STRUCTURE

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-ROOT-0002 |
| Version | 1.0.0 |
| Status | Stable |
| Classification | Repository Structure – Applications |

---

# Table of Contents

1. Purpose
2. Scope
3. Directory Structure
4. Application Responsibilities
5. Shared Rules
6. Dependency Rules
7. Naming Conventions
8. Growth Strategy
9. Definition of Ready
10. Definition of Done
11. References
12. Related Documents
13. Revision History
14. Approval Block

---

# 1. Purpose

This document defines the official structure of the `apps/` directory.

Every executable application in the Library Of Legends repository shall reside within this directory.

---

# 2. Scope

The `apps/` directory contains all user-facing and executable applications.

Shared libraries and reusable components are explicitly excluded and belong in the `packages/` directory.

---

# 3. Directory Structure

```text
apps/
│
├── telegram-bot/
├── rest-api/
├── admin-panel/
├── web-client/
├── mobile-app/
├── desktop-client/
└── launcher/
```

Future applications shall be added only after architectural review.

---

# 4. Application Responsibilities

## telegram-bot

Primary Telegram interface responsible for:

- media publishing
- indexing
- search
- user interaction
- administration

---

## rest-api

Provides internal and external HTTP APIs.

Responsibilities include:

- authentication
- media queries
- metadata
- administration endpoints

---

## admin-panel

Administrative interface.

Functions include:

- library management
- monitoring
- configuration
- moderation

---

## web-client

Public web application.

Provides browser access to supported project features.

---

## mobile-app

Native mobile client.

Optimized for Android and iOS.

---

## desktop-client

Optional desktop interface for advanced administration.

---

## launcher

Entry point for local development and production startup.

---

# 5. Shared Rules

Every application shall:

- be independently executable
- contain its own configuration
- contain documentation
- contain tests
- expose version information

---

# 6. Dependency Rules

Applications:

- may depend on packages
- shall not directly depend on other applications
- communicate through defined interfaces

Circular dependencies are prohibited.

---

# 7. Naming Conventions

Application directories:

- lowercase
- kebab-case
- descriptive
- singular

Examples:

telegram-bot

admin-panel

mobile-app

---

# 8. Growth Strategy

New applications require:

- documented purpose
- architectural review
- dependency review
- repository documentation update

---

# 9. Definition of Ready

☑ Application purpose defined

☑ Dependencies identified

☑ Architecture approved

☑ Documentation prepared

---

# 10. Definition of Done

☑ Directory created

☑ Documentation completed

☑ Tests initialized

☑ Registry updated

☑ PROJECT_INDEX updated

---

# 11. References

Internal

- ROOT_STRUCTURE.md
- PROJECT_STRUCTURE.md
- REPOSITORY_MANIFEST.md

---

# 12. Related Documents

- PACKAGES_STRUCTURE.md
- API_ARCHITECTURE.md
- TELEGRAM_ARCHITECTURE.md

---

# 13. Revision History

| Version | Date | Description |
|----------|------------|----------------|
| 1.0.0 | 2026-07-31 | Initial Release |

---

# 14. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Technical Review | Pending |
| Architecture Review | Pending |

---

End of Document

Document ID

LOL-ROOT-0002