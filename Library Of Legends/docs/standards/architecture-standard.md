# Architecture Standard

> Official architecture standard for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Purpose

This document defines the architectural principles of the Library Of
Legends project.

All modules, packages and source files must comply with these rules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Architectural Style

Library Of Legends follows a layered architecture inspired by:

- Domain-Driven Design (DDD)
- Clean Architecture
- SOLID Principles
- Composition over Inheritance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Architecture Layers

1. Shared Kernel

Common building blocks shared by all modules.

Examples

- Value Objects
- Shared Types
- Contracts
- Errors
- Results

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. Domain

Business rules.

Examples

- Entities
- Aggregate Roots
- Domain Services
- Specifications
- Domain Events

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Application

Application use cases.

Examples

- Commands
- Queries
- Handlers
- Services

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. Infrastructure

Technical implementations.

Examples

- Database
- Provider SDK
- Search Engine
- Telegram
- REST API

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. Platform

Hosting and runtime.

Examples

- Bootstrap
- Dependency Injection
- Scheduler
- Logging
- Configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Dependency Rule

Dependencies always point inward.

Platform
↓

Infrastructure
↓

Application
↓

Domain
↓

Shared Kernel

Never the other way around.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Domain Rules

The Domain layer

- must not depend on Infrastructure
- must not know Telegram
- must not know databases
- must not know TMDb
- must not know OMDb

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Infrastructure Rules

Infrastructure implements interfaces defined by the Domain or Application.

Never embed business rules into Infrastructure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Shared Kernel Rules

Shared Kernel contains only reusable concepts.

Do not place business logic inside the Shared Kernel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Design Principles

- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Review Checklist

□ Layer respected

□ Dependency direction respected

□ Naming respected

□ Tests available

□ Documentation updated

□ Header complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard