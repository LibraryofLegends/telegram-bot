# Dependency Injection Tests

> Unit tests for the Dependency Injection module of Project Phoenix.

---

# Module Information

| Property | Value |
|----------|-------|
| Module | Dependency Injection |
| Module ID | LOL-MOD-DI-0004 |
| Architecture Layer | Framework Core |
| Version | 1.0.0 |
| Status | Draft |
| Lifecycle | Development |

---

# Overview

This directory contains all automated tests related to the Dependency
Injection module.

The purpose of these tests is to verify that service registration,
dependency resolution and lifecycle management remain deterministic,
reliable and fully compatible with the Framework Core contracts.

---

# Test Strategy

The Dependency Injection module follows the official Project Phoenix
testing strategy.

Priority:

1. Unit Tests
2. Integration Tests
3. Performance Tests
4. Regression Tests

Every public component shall have corresponding automated tests.

---

# Test Responsibilities

- Verify DependencyInjectionManager initialization
- Verify service registration
- Verify dependency resolution
- Verify service lifetimes
- Verify container validation
- Prevent regressions

---

# Naming Convention

Every test file shall follow the naming convention:

```text
<component>.test.ts
```

Examples:

```text
dependency-injection-manager.test.ts

service-container.test.ts

dependency-resolver.test.ts

service-descriptor.test.ts

service-lifetime.test.ts
```

---

# Test Categories

## Unit Tests

Verify isolated component behavior.

---

## Integration Tests

Verify interaction between the Dependency Injection module and the
Framework Core.

---

## Performance Tests

Measure dependency resolution performance and container scalability.

---

## Regression Tests

Prevent previously fixed defects from reappearing.

---

# Coverage Goals

| Area | Target |
|-------|-------:|
| Statements | 100% |
| Branches | 95% |
| Functions | 100% |
| Lines | 100% |

Coverage targets may only be changed through documented architectural
approval.

---

# Running Tests

Run all tests

```bash
npm test
```

Run only Dependency Injection tests

```bash
npm test dependency-injection
```

Run coverage

```bash
npm run coverage
```

---

# Directory Structure

```text
tests/

├── README.md
├── dependency-injection-manager.test.ts
├── service-container.test.ts
├── dependency-resolver.test.ts
├── service-descriptor.test.ts
├── service-lifetime.test.ts
├── dependency-injection-options.test.ts
├── dependency-injection-result.test.ts
├── dependency-injection-state.test.ts
└── dependency-injection-errors.test.ts
```

---

# Related Documents

- Dependency Injection Module README
- Framework Testing Standard
- Framework Architecture
- Testing Guidelines

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-06 | Initial Release |

---

© Library Of Legends