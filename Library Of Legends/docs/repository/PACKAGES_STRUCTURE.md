# Library Of Legends

# PACKAGES STRUCTURE

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-ROOT-0003 |
| Version | 1.0.0 |
| Status | Stable |
| Classification | Repository Structure – Shared Packages |

---

# Table of Contents

1. Purpose
2. Package Philosophy
3. Directory Structure
4. Core Packages
5. Dependency Rules
6. Package Standards
7. Naming Conventions
8. Versioning
9. Growth Strategy
10. Definition of Ready
11. Definition of Done
12. References
13. Related Documents
14. Revision History
15. Approval Block

---

# 1. Purpose

This document defines the official structure of the `packages/` directory.

Packages contain reusable modules that can be shared by multiple applications.

No application-specific logic shall reside in this directory.

---

# 2. Package Philosophy

Every package shall have:

- one clearly defined responsibility
- a documented public interface
- independent versioning
- automated testing
- comprehensive documentation

Packages shall maximize reuse while minimizing coupling.

---

# 3. Directory Structure

```text
packages/
│
├── core/
├── config/
├── logger/
├── database/
├── media/
├── telegram/
├── api/
├── authentication/
├── security/
├── storage/
├── metadata/
├── search/
├── indexing/
├── shared/
├── types/
├── utils/
└── validation/
```

---

# 4. Core Packages

## core/

Business logic and shared domain services.

---

## config/

Configuration loading and validation.

---

## logger/

Centralized logging.

---

## database/

Database connections, repositories and migrations.

---

## media/

Media scanning and metadata processing.

---

## telegram/

Telegram-specific services and integrations.

---

## api/

Shared API components and communication utilities.

---

## authentication/

Authentication and authorization.

---

## security/

Security helpers, encryption and permission handling.

---

## storage/

File storage abstraction.

---

## metadata/

Metadata normalization and enrichment.

---

## search/

Search engine and indexing queries.

---

## indexing/

Library indexing and synchronization.

---

## shared/

Reusable shared components.

---

## types/

Shared TypeScript type definitions.

---

## utils/

General utility functions.

---

## validation/

Validation schemas and input validation.

---

# 5. Dependency Rules

Packages:

- may depend on lower-level packages
- shall not depend on applications
- shall expose stable public APIs
- shall avoid circular dependencies

Every dependency shall be documented.

---

# 6. Package Standards

Every package shall include:

- README.md
- CHANGELOG.md
- Tests
- Public API
- Version information
- License compatibility

---

# 7. Naming Conventions

Package names shall:

- use lowercase
- use kebab-case where appropriate
- remain descriptive
- remain unique

---

# 8. Versioning

Each package maintains its own version.

Breaking changes require a major version increment.

Package versions shall be tracked independently from the repository version.

---

# 9. Growth Strategy

New packages require:

- documented purpose
- architectural review
- dependency review
- update of PROJECT_INDEX
- update of PACKAGE registry

---

# 10. Definition of Ready

☑ Purpose documented

☑ Dependencies identified

☑ Public interface defined

☑ Documentation planned

---

# 11. Definition of Done

☑ Package created

☑ Documentation complete

☑ Tests available

☑ Registry updated

☑ Approved

---

# 12. References

Internal

- ROOT_STRUCTURE.md
- APPS_STRUCTURE.md
- REPOSITORY_MANIFEST.md

---

# 13. Related Documents

- MODULE_ARCHITECTURE.md
- DATABASE_ARCHITECTURE.md
- API_ARCHITECTURE.md

---

# 14. Revision History

| Version | Date | Description |
|----------|------------|----------------|
| 1.0.0 | 2026-07-31 | Initial Release |

---

# 15. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Technical Review | Pending |
| Architecture Review | Pending |

---

End of Document

Document ID

LOL-ROOT-0003