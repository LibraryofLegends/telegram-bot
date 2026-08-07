# Documentation Standard

> Official documentation standard for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Purpose

Documentation should explain the intent, architecture and usage of the
system. Good documentation reduces onboarding time and improves long-term
maintainability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Documentation Levels

The project is documented on six levels.

1. Repository

2. Module

3. Package

4. Source File

5. Public API

6. Architecture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Repository Documentation

Required files

README.md

CHANGELOG.md

ROADMAP.md

LICENSE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Module Documentation

Each major module should provide

README.md

Purpose

Responsibilities

Dependencies

Public API

Examples

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Source Files

Every source file must contain

- Official Project Phoenix header
- Short description
- Public API documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Public API

Every exported class, interface, enum and function must include

- Description
- Parameters
- Return value
- Exceptions (when applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Comments

Prefer explaining

WHY

instead of

WHAT

Code should remain self-explanatory whenever possible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Examples

Complex components should include practical examples.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Diagrams

Architecture diagrams should be stored under

docs/architecture/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Images

Store images under

docs/assets/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Change History

Significant architectural decisions should be recorded inside

CHANGELOG.md

or

Architecture Decision Records (ADR).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Documentation Review

Every Pull Request should verify

□ Documentation updated

□ Public API documented

□ Examples updated

□ README updated if required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard