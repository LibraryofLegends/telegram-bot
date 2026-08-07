# Contributing Guide

> Official contribution guidelines for the Provider SDK.

---

# Purpose

This guide defines the standards for contributing to the Provider SDK.

Every provider implementation must follow the architectural principles
and coding standards defined by the Library Of Legends platform.

---

# Design Principles

All contributions shall follow:

- Domain-Driven Design (DDD)
- SOLID Principles
- Clean Architecture
- Dependency Injection
- Type Safety
- Immutability where appropriate
- Consistent naming conventions

---

# Provider Requirements

Every provider must:

- Implement the `Provider` interface
- Provide complete metadata
- Define supported capabilities
- Support health monitoring
- Return `ProviderResult<T>`
- Use standardized error codes
- Respect the provider lifecycle

---

# Code Standards

- Strict TypeScript
- No `any`
- Public APIs fully documented
- Small, focused classes
- Single Responsibility Principle
- Prefer composition over inheritance

---

# Testing Requirements

Every new provider must include:

- Unit tests
- Integration tests
- Error handling tests
- Lifecycle tests
- Health check tests

New functionality must not reduce overall test coverage.

---

# Documentation Requirements

Every provider must include:

- README
- Usage examples
- Configuration reference
- Supported capabilities
- Known limitations
- Changelog entries

---

# Pull Request Checklist

Before submitting changes:

- Code compiles successfully
- Tests pass
- Documentation updated
- Architecture remains consistent
- No breaking changes without ADR

---

# Related Documents

- README.md
- ARCHITECTURE.md
- TESTING.md
- SECURITY.md
- Framework Coding Standards

---

© Library Of Legends