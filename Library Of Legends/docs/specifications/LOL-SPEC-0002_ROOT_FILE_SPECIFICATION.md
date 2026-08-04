# LIBRARY OF LEGENDS
### Project Phoenix

| Property | Value |
|---|---|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Framework | LOAF (Library Of Legends Architecture Framework) |
| Document | Root File Specification |
| Document ID | LOL-SPEC-0002 |
| Category | Specification |
| Architecture | Enterprise Monorepo |
| Version | 1.0.0 |
| Status | Approved |
| Quality | ★★★★★ Enterprise Ready |
| Classification | Master Specification |
| Storage Path | `docs/specifications/LOL-SPEC-0002_ROOT_FILE_SPECIFICATION.md` |
| Created | 2026-08-04 |
| Last Modified | 2026-08-04 |

---

# LOL-SPEC-0002 — Root File Specification

## Key Decisions

- Every root file has exactly one responsibility.
- Root files are part of the platform architecture.
- No temporary or undocumented files are allowed in the repository root.
- Configuration files shall remain centralized.
- Every root file must be documented before implementation.

---

# 1. Executive Summary

This specification defines every file located in the repository root.

The purpose of this document is to guarantee consistency, maintainability and long-term scalability.

Only approved files may exist in the repository root.

---

# 2. Root Philosophy

The repository root represents the public entry point of the project.

It shall remain clean, predictable and easy to understand.

Every file placed in the root directory must have a project-wide responsibility.

---

# 3. Approved Root Files

| File | Required | Purpose |
|---|:---:|---|
| README.md | ✅ | Project overview |
| LICENSE | ✅ | License information |
| CHANGELOG.md | ✅ | Version history |
| CONTRIBUTING.md | ✅ | Contribution guidelines |
| CODE_OF_CONDUCT.md | ✅ | Community rules |
| SECURITY.md | ✅ | Security policy |
| package.json | ✅ | Workspace configuration |
| turbo.json | ✅ | Build pipeline |
| tsconfig.json | ✅ | TypeScript configuration |
| tsconfig.base.json | ✅ | Shared TypeScript settings |
| .gitignore | ✅ | Git ignore rules |
| .editorconfig | ✅ | Editor configuration |
| .prettierrc | ✅ | Code formatting |
| .prettierignore | ✅ | Ignore formatting |
| .eslintrc.cjs | ✅ | Lint configuration |
| .eslintignore | ✅ | Lint exclusions |
| .env.example | ✅ | Environment template |
| .nvmrc | Optional | Node.js version |
| pnpm-workspace.yaml | Optional | Workspace definition |

---

# 4. Documentation Files

## README.md

Purpose:

- Introduce the project
- Explain the platform
- Provide quick-start instructions
- Link to documentation

---

## CHANGELOG.md

Purpose:

- Track every official release
- Record major architectural changes
- Preserve project history

---

## CONTRIBUTING.md

Purpose:

- Define contribution workflow
- Explain coding expectations
- Reference project standards

---

## CODE_OF_CONDUCT.md

Purpose:

- Define expected community behaviour
- Ensure respectful collaboration

---

## SECURITY.md

Purpose:

- Explain responsible disclosure
- Describe security reporting process

---

# 5. Configuration Files

## package.json

Purpose:

- Define workspaces
- Define scripts
- Define dependencies
- Define package metadata

---

## turbo.json

Purpose:

- Configure build pipelines
- Configure caching
- Configure task dependencies

---

## tsconfig.json

Purpose:

- Project-specific TypeScript configuration

---

## tsconfig.base.json

Purpose:

- Shared compiler options
- Base configuration for all packages

---

# 6. Development Configuration

| File | Purpose |
|---|---|
| .editorconfig | Shared editor settings |
| .prettierrc | Formatting rules |
| .prettierignore | Formatting exclusions |
| .eslintrc.cjs | Linting rules |
| .eslintignore | Linting exclusions |

---

# 7. Environment Configuration

## .env.example

Contains example values only.

Must never contain:

- passwords
- API keys
- secrets
- production credentials

---

# 8. Repository Rules

The repository root shall never contain:

- ZIP archives
- Temporary exports
- Build artifacts
- Debug files
- Personal notes
- Local backups

---

# 9. File Lifecycle

Every root file follows the same lifecycle.

```text
Specification

↓

Implementation

↓

Review

↓

Approval

↓

Maintenance
```

---

# 10. Future Expansion

New root files may only be introduced if:

- their purpose is project-wide,
- they cannot logically belong to an existing directory,
- and they are documented before implementation.

---

# 11. Quality Gate

| Check | Status |
|---|---|
| Structure | ✅ PASS |
| Documentation | ✅ PASS |
| Maintainability | ✅ PASS |
| Consistency | ✅ PASS |
| Scalability | ✅ PASS |

Overall Status:

**APPROVED FOR IMPLEMENTATION**

---

# 12. Related Documents

| Document ID | Title |
|---|---|
| LOL-SPEC-0001 | Master Repository Tree |
| LOL-DOC-0003 | Repository Architecture |
| LOL-STD-0003 | Repository Standard |
| LOL-STD-0005 | Coding Standard |

---

# 13. Revision History

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-08-04 | Initial Root File Specification |

---

# 14. Approval

| Role | Status |
|---|---|
| Project Phoenix Team | Approved |
| Next Review | RP-002.2 |

---

# 15. End of Document

**Document ID:** LOL-SPEC-0002

**Version:** 1.0.0

**Status:** Approved