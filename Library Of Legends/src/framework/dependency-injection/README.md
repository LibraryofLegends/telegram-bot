# Dependency Injection

> Official Dependency Injection module of Project Phoenix.

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

The Dependency Injection module provides a centralized service container
responsible for registering, resolving and managing dependencies across
the entire Project Phoenix Framework.

It enables loose coupling, modular architecture and deterministic
dependency resolution for Framework Core modules, Providers, Features
and Applications.

---

# Responsibilities

- Register services
- Resolve dependencies
- Manage service lifetimes
- Support singleton and transient services
- Enable constructor injection
- Provide extensible container architecture

---

# Architecture

```text
Application

↓

Bootstrap

↓

Configuration

↓

Logging

↓

Dependency Injection

↓

Service Container

↓

Framework Core

↓

Providers

↓

Features

↓

Applications
```

---

# Public API

| Component | Description |
|-----------|-------------|
| DependencyInjectionManager | Coordinates the DI module |
| ServiceContainer | Central service registry |
| ServiceDescriptor | Service metadata |
| ServiceLifetime | Service lifetime definition |
| DependencyResolver | Resolves dependencies |
| DependencyInjectionOptions | Runtime configuration |

---

# Dependencies

## Internal

- Bootstrap
- Configuration
- Logging

## External

- TypeScript
- Node.js

---

# Usage

Example

```typescript
const container = new DependencyInjectionManager();

await container.initialize(configuration);
```

---

# Directory Structure

```text
dependency-injection/

├── README.md
├── CHANGELOG.md
├── ROADMAP.md
│
├── src/
│   ├── dependency-injection-manager.ts
│   ├── service-container.ts
│   ├── dependency-resolver.ts
│   ├── service-descriptor.ts
│   ├── service-lifetime.ts
│   ├── dependency-injection-options.ts
│   ├── dependency-injection-result.ts
│   ├── dependency-injection-errors.ts
│   └── dependency-injection-state.ts
│
└── tests/
    ├── README.md
    └── dependency-injection-manager.test.ts
```

---

# Related Documents

- Bootstrap Module
- Configuration Module
- Logging Module
- Framework Architecture

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0.0 | 2026-08-06 | Initial Release |

---

© Library Of Legends