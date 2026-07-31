# Library Of Legends

# VSCODE STRUCTURE

---

# Document Metadata

| Property | Value |
|-----------|-------|
| Project | Library Of Legends |
| Codename | Project Phoenix |
| Document ID | LOL-ROOT-0011 |
| Version | 1.0.0 |
| Status | Stable |
| Classification | Repository Structure – Development Environment |

---

# Table of Contents

1. Purpose
2. Development Environment Philosophy
3. Directory Structure
4. Workspace Configuration
5. Recommended Extensions
6. Tasks
7. Launch Configurations
8. Settings
9. Debugging
10. Collaboration Guidelines
11. Definition of Ready
12. Definition of Done
13. References
14. Related Documents
15. Revision History
16. Approval Block

---

# 1. Purpose

This document defines the official structure of the `.vscode/` directory.

Its purpose is to provide a consistent development environment for all contributors while minimizing local configuration differences.

---

# 2. Development Environment Philosophy

The development environment shall be:

- consistent
- reproducible
- documented
- maintainable
- optional where appropriate

Project-specific configuration shall be stored in the repository.

Personal preferences shall remain outside the repository.

---

# 3. Directory Structure

```text
.vscode/
│
├── settings.json
├── extensions.json
├── launch.json
├── tasks.json
├── snippets/
└── README.md
```

---

# 4. Workspace Configuration

The workspace configuration shall define:

- formatting rules
- editor behavior
- language settings
- workspace recommendations

Project settings shall never overwrite user-specific preferences unnecessarily.

---

# 5. Recommended Extensions

Recommended extensions may include:

- ESLint
- Prettier
- EditorConfig
- Markdown Lint
- Docker
- GitHub Actions
- YAML
- JSON Tools
- SQLite Viewer
- REST Client

Recommendations shall improve consistency without being mandatory.

---

# 6. Tasks

Standard tasks may include:

- Build
- Test
- Lint
- Validate Documentation
- Generate Templates
- Start Development Server
- Database Migration

Tasks shall be documented and reusable.

---

# 7. Launch Configurations

Launch configurations may support:

- API debugging
- Telegram Bot debugging
- Worker debugging
- Test execution
- Script execution

Every configuration shall include a descriptive name.

---

# 8. Settings

Project settings should define:

- indentation
- line endings
- file encoding
- formatting
- whitespace handling

These settings shall align with LLCS.

---

# 9. Debugging

Debug configurations shall:

- support local development
- avoid hardcoded secrets
- load environment variables securely
- document prerequisites

---

# 10. Collaboration Guidelines

The repository shall:

- recommend extensions
- avoid mandatory proprietary tooling
- document environment setup
- maintain cross-platform compatibility

---

# 11. Definition of Ready

☑ Workspace requirements documented

☑ Recommended extensions identified

☑ Tasks planned

☑ Debug requirements defined

---

# 12. Definition of Done

☑ Configuration created

☑ Documentation completed

☑ Validation successful

☑ Repository updated

☑ Approved

---

# 13. References

Internal

- ROOT_STRUCTURE.md
- TOOLS_STRUCTURE.md
- LLDS_SPECIFICATION.md

---

# 14. Related Documents

- CONTRIBUTING.md
- CODING_STANDARD.md
- CONFIGURATION_STANDARD.md

---

# 15. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-07-31 | Initial Release |

---

# 16. Approval Block

| Role | Status |
|------|--------|
| Author | Approved |
| Technical Review | Pending |
| Architecture Review | Pending |
| Final Approval | Pending |

---

End of Document

Document ID

LOL-ROOT-0011