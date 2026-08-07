# Testing Standard

> Official testing standard for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Purpose

This document defines the testing strategy for the entire project.

Every production feature should be verified through automated tests.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Testing Philosophy

Library Of Legends follows four testing levels.

1. Unit Tests

2. Integration Tests

3. Component Tests

4. End-to-End Tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Unit Tests

Every Value Object

✓ required

Every Entity

✓ required

Every Domain Service

✓ required

Every Utility

✓ required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Integration Tests

Required for

- Repository implementations
- Database adapters
- Provider SDK
- Telegram Platform
- REST API
- Search Engine

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# End-to-End Tests

Required for

- Media Import

- Search

- Library Index

- Telegram Workflow

- User Authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test Naming

movie.test.ts

movie.integration.test.ts

movie.e2e.test.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test Structure

Arrange

Act

Assert

Every test should clearly separate these three phases.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Coverage Goals

Value Objects

100%

Entities

95%

Domain Services

95%

Infrastructure

85%

Overall Project

90%+

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Assertions

Each test should verify one behavior.

Avoid testing multiple unrelated concerns.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Mocking

Mock only external dependencies.

Never mock Value Objects.

Never mock domain rules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Test Data

Prefer factories.

Avoid duplicated test setup.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Continuous Integration

Every Pull Request must execute

- Lint

- Type Check

- Unit Tests

- Integration Tests

Build must fail if any mandatory test fails.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard