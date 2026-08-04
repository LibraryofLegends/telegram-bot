# Library Of Legends

# Repository Architecture

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-DOC-0003 |
| Version | 2.0.0 |
| Status | Approved |
| Classification | Foundation Document |

---

# Table of Contents

1. Purpose
2. Repository Philosophy
3. Repository Structure
4. Directory Responsibilities
5. Architectural Layers
6. Dependency Rules
7. Development Rules
8. Repository Lifecycle
9. Related Documents
10. Revision History
11. Approval Block

---

# 1. Purpose

This document defines the official repository architecture of the Library Of Legends platform.

It establishes the mandatory structure, responsibilities and dependency rules for every directory contained within the repository.

No component shall be created outside this architecture.

---

# 2. Repository Philosophy

The repository is designed around one fundamental principle:

> Every directory has one clearly defined responsibility.

The structure must remain understandable, scalable and maintainable throughout the lifetime of the project.

Architecture decisions shall always prioritize clarity over complexity.

---

# 3. Repository Structure

```text
Library Of Legends/

docs/
framework/
providers/
features/
applications/
tests/
tools/
packages/
```

Each top-level directory represents one major architectural layer.

No additional root directories shall be introduced without an approved architecture review.

---

# 4. Directory Responsibilities

## docs/

Contains all project documentation.

Including:

- Foundation
- Standards
- Policies
- Workflows
- Architecture
- Specifications
- References

---

## framework/

Contains reusable platform infrastructure.

Responsibilities:

- Core
- Infrastructure
- Shared Components

Business logic is not permitted inside the framework.

---

## providers/

Contains integrations with external services.

Examples:

- Telegram
- TMDB
- OMDb
- PostgreSQL
- OpenAI

Providers communicate with external systems only.

---

## features/

Contains all business functionality.

Examples:

- Import
- Movies
- Series
- Collections
- Metadata
- Library
- Search
- AI

Every feature is independently developed and tested.

---

## applications/

Contains executable applications.

Examples:

- Project Phoenix
- Dashboard
- REST API
- CLI

Applications combine framework, providers and features.

---

## tests/

Contains all automated tests.

Including:

- Unit Tests
- Integration Tests
- Performance Tests
- End-to-End Tests

---

## tools/

Contains internal development utilities.

Examples:

- Code Generators
- Maintenance Scripts
- Migration Tools
- Validation Utilities

---

## packages/

Contains reusable packages shared across the platform.

Packages shall remain independent and modular.

---

# 5. Architectural Layers

The platform is divided into five logical layers.

```text
Applications

↓

Features

↓

Providers

↓

Framework

↓

Infrastructure
```

Dependencies shall always point downward.

Circular dependencies are prohibited.

---

# 6. Dependency Rules

The following dependency rules are mandatory.

Framework

- depends on nothing

Providers

- may depend on Framework

Features

- may depend on Framework
- may depend on Providers

Applications

- may depend on Features
- may depend on Providers
- may depend on Framework

No reverse dependencies are allowed.

---

# 7. Development Rules

Development shall follow these principles.

- Documentation Before Development
- One Feature At A Time
- One Responsibility Per Module
- Continuous Refactoring
- Continuous Testing
- Continuous Documentation

Every completed feature shall be reviewed before the next feature begins.

---

# 8. Repository Lifecycle

The repository evolves through the following lifecycle.

```text
Planning

↓

Documentation

↓

Implementation

↓

Testing

↓

Review

↓

Approval

↓

Release

↓

Maintenance
```

Every phase must be completed before progressing to the next.

---

# 9. Related Documents

- LOL-DOC-0001 Project Charter
- LOL-DOC-0002 Library Blueprint
- LOL-STD-0001 Documentation Standard
- LOL-STD-0002 Naming Convention
- LOL-STD-0003 Repository Standard

---

# 10. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 2.0.0 | 2026-08-04 | Complete Repository Architecture Redesign |

---

# 11. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Architecture Review | Approved |
| Final Approval | Approved |

---

End of Document

Document ID

LOL-DOC-0003