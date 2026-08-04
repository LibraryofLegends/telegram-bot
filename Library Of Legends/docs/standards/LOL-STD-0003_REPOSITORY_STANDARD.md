# LIBRARY OF LEGENDS
### Project Phoenix

| Property | Value |
|---|---|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Framework | LOAF (Library Of Legends Architecture Framework) |
| Document | Repository Standard |
| Document ID | LOL-STD-0003 |
| Category | Standards |
| Architecture | LOAF 2.0 |
| Version | 1.0.0 |
| Status | Approved |
| Quality | ★★★★★ Enterprise Ready |
| Classification | Project Standard |
| Storage Path | `docs/standards/LOL-STD-0003_REPOSITORY_STANDARD.md` |
| Created | 2026-08-04 |
| Last Modified | 2026-08-04 |

---

# LOL-STD-0003 — Repository Standard

## Key Decisions

- Repository structure is defined before implementation.
- Every directory has one clearly defined responsibility.
- Duplicate functionality is prohibited.
- Shared code belongs in shared packages.
- Documentation is stored alongside the project, never scattered.

---

# 1. Executive Summary

This document defines the official repository standard for the Library Of Legends platform.

Its purpose is to establish a predictable, maintainable and scalable repository layout for the entire project.

Every file created during development shall comply with this standard.

---

# 2. Repository Philosophy

The repository is designed around responsibilities rather than technologies.

Every directory exists for one purpose only.

Developers shall always know where a file belongs without hesitation.

---

# 3. Root Structure

```text
Library Of Legends/

├── apps/
├── packages/
├── docs/
├── tests/
├── scripts/
├── storage/
├── assets/
├── tools/
├── .github/
├── .vscode/
├── package.json
├── turbo.json
├── tsconfig.json
└── README.md
```

---

# 4. Root Directory Responsibilities

| Directory | Responsibility |
|---|---|
| apps | Executable applications |
| packages | Shared modules and libraries |
| docs | Documentation |
| tests | Automated tests |
| scripts | Build and maintenance scripts |
| storage | Temporary and persistent storage |
| assets | Images, icons and media |
| tools | Internal utilities |
| .github | GitHub configuration |
| .vscode | Shared editor configuration |

---

# 5. Applications

```text
apps/

telegram-bot/

dashboard/

admin/

api/

cli/
```

Applications contain executable software only.

Business logic belongs inside packages.

---

# 6. Packages

```text
packages/

core/

telegram/

database/

metadata/

search/

statistics/

authentication/

importer/

shared/

ai/
```

Packages provide reusable functionality.

Packages shall never depend on applications.

---

# 7. Documentation

```text
docs/

foundation/

standards/

architecture/

modules/

specifications/

deployment/

security/

testing/

decisions/

archive/
```

Every documentation category has one dedicated directory.

---

# 8. Tests

```text
tests/

unit/

integration/

performance/

end-to-end/

fixtures/
```

Every package shall have corresponding tests.

---

# 9. Assets

Assets shall contain only static project resources.

Examples:

- Logos
- Icons
- Banners
- Images
- Fonts

Generated files shall never be stored here.

---

# 10. Storage

Storage is reserved for runtime data.

Examples:

- Temporary imports
- Cache
- Generated files
- Processing data

Storage contents are not part of the source code.

---

# 11. Dependency Rules

| Rule | Status |
|---|---|
| Applications depend on packages | Required |
| Packages depend on shared modules | Allowed |
| Core depends on applications | Forbidden |
| Circular dependencies | Forbidden |
| Duplicate implementations | Forbidden |

---

# 12. Repository Rules

- One responsibility per directory.
- One purpose per file.
- No duplicate implementations.
- Documentation before implementation.
- Standards before specifications.
- Specifications before code.

---

# 13. Scalability

The repository shall support:

- Multiple applications
- Plugin architecture
- Multiple databases
- Cloud deployments
- AI services
- Future media types
- Future clients

without restructuring the existing layout.

---

# 14. Repository Lifecycle

Every new component follows the same lifecycle.

Planning

↓

Documentation

↓

Directory Creation

↓

Implementation

↓

Testing

↓

Review

↓

Approval

---

# 15. Future Growth

Future repository extensions shall integrate into the existing structure.

Existing directories shall not be repurposed.

New responsibilities require new directories.

---

# 16. Related Documents

| Document ID | Title |
|---|---|
| LOL-DOC-0001 | Project Charter |
| LOL-DOC-0002 | Library Blueprint |
| LOL-DOC-0003 | Repository Architecture |
| LOL-DOC-0004 | Architecture Overview |
| LOL-STD-0001 | Documentation Standard |
| LOL-STD-0002 | Naming Convention |

---

# 17. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-04 | Initial Repository Standard |

---

# 18. Approval

| Role | Status |
|---|---|
| Project Phoenix Team | Approved |
| Next Review | TBD |

---

# 19. End of Document

**Document ID:** LOL-STD-0003

**Version:** 1.0.0

**Status:** Approved