# Library Of Legends

# Root Configuration

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-ARC-0003 |
| Version | 1.0.0 |
| Status | Approved |
| Classification | Architecture |

---

# Table of Contents

1. Purpose
2. Configuration Philosophy
3. Root Configuration Files
4. Configuration Responsibilities
5. Configuration Rules
6. Configuration Lifecycle
7. Practical Impact
8. Related Documents
9. Revision History
10. Approval Block

---

# 1. Purpose

This document defines the official root configuration of the Library Of Legends repository.

It specifies which configuration files exist in the repository root, their responsibilities and the rules governing their maintenance.

---

# 2. Configuration Philosophy

Configuration shall be centralized.

Every configuration file has one clearly defined responsibility.

Configuration must remain understandable, version-controlled and documented.

Duplicate configuration is prohibited.

---

# 3. Root Configuration Files

The following files are part of the official repository root.

```text
README.md

LICENSE

CHANGELOG.md

package.json

pnpm-workspace.yaml

turbo.json

tsconfig.json

tsconfig.base.json

.editorconfig

.gitignore

.prettierignore

.prettierrc

eslint.config.mjs

.env.example
```

Each file shall exist only once within the repository root unless explicitly documented otherwise.

---

# 4. Configuration Responsibilities

Each configuration file shall have a single responsibility.

Examples include:

- Project metadata
- Dependency management
- Formatting
- Linting
- TypeScript configuration
- Build configuration
- Environment templates

Configuration files shall not contain business logic.

---

# 5. Configuration Rules

The following rules apply.

- Every configuration file shall be documented.
- Configuration changes shall be reviewed before approval.
- Obsolete configuration shall be removed.
- Experimental configuration shall not be committed.

Configuration shall always reflect the current project state.

---

# 6. Configuration Lifecycle

Every configuration file follows the same lifecycle.

```text
Planning

↓

Documentation

↓

Implementation

↓

Validation

↓

Approval

↓

Maintenance
```

Configuration shall evolve together with the project.

---

# 7. Practical Impact

This document governs all repository root configuration files.

Affected Areas

- Repository Root
- Build Configuration
- Development Configuration
- Formatting Configuration
- Linting Configuration
- Environment Configuration

---

# 8. Related Documents

- LOL-ARC-0001 Repository Construction Plan
- LOL-ARC-0002 Repository Root
- LOL-STD-0003 Repository Standard
- LOL-STD-0005 Coding Standard

---

# 9. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-04 | Initial Root Configuration Definition |

---

# 10. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Architecture Review | Approved |
| Final Approval | Approved |

---

End of Document

Document ID

LOL-ARC-0003