# Shared Kernel

> Official Shared Kernel of the Library Of Legends platform.

---

# Module Information

| Property | Value |
|----------|-------|
| Module | Shared Kernel |
| Module ID | LOL-MOD-SHK-0010 |
| Architecture Layer | Platform Foundation |
| Version | 1.0.0 |
| Status | Draft |
| Lifecycle | Development |

---

# Overview

The Shared Kernel contains all common building blocks used across the
Library Of Legends platform.

It provides reusable domain models, identifiers, value objects, base
classes, utilities and shared contracts to ensure consistency across all
application modules.

---

# Responsibilities

- Shared identifiers
- Value Objects
- Base Entities
- Aggregate Roots
- Domain Events
- Common Enums
- Shared Exceptions
- Utility Types

---

# Architecture

```text
Application Modules

↓

Shared Kernel

↓

Identifiers

Value Objects

Entities

Utilities

↓

Framework Core
```

---

# Planned Structure

```text
shared/

├── README.md
├── CHANGELOG.md
├── ROADMAP.md
│
├── ids/
│   ├── media-id.ts
│   ├── user-id.ts
│   ├── collection-id.ts
│   ├── library-id.ts
│   └── provider-id.ts
│
├── value-objects/
│   ├── title.ts
│   ├── rating.ts
│   ├── runtime.ts
│   ├── language.ts
│   └── resolution.ts
│
├── entities/
│   ├── entity.ts
│   ├── aggregate-root.ts
│   └── auditable-entity.ts
│
├── enums/
│
├── errors/
│
├── events/
│
├── types/
│
└── utils/
```

---

# Related Modules

- Framework Core
- Media Core
- Movie Module
- Series Module
- Music Module
- Books Module
- Games Module
- Telegram Platform

---

© Library Of Legends