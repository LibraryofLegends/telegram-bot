# TypeScript Standard

> Official TypeScript coding standard for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document defines the coding style for all TypeScript source files
within the Library Of Legends project.

Consistency has higher priority than personal preference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# General Principles

- Prefer readability over cleverness.
- Write self-documenting code.
- Keep functions small and focused.
- One responsibility per class.
- Favor composition over inheritance.
- Prefer immutable objects.
- Avoid side effects whenever possible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Classes

- One public class per file.
- One responsibility per class.
- Constructor validation only.
- Business logic belongs inside the domain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Interfaces

Interfaces define behavior only.

Do not include implementation logic.

Avoid marker interfaces.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Functions

Functions should

- have one responsibility
- return early
- avoid deep nesting
- be easy to test

Maximum recommended length

40 lines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Methods

Order methods as follows

1. Constructor

2. Public properties

3. Public methods

4. Protected methods

5. Private methods

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Properties

Prefer readonly whenever possible.

Avoid mutable public fields.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Imports

External imports

↓

Internal imports

↓

Relative imports

Separate import groups with one empty line.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Comments

Explain WHY.

Do not explain WHAT.

Avoid obvious comments.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Formatting

Indentation

4 spaces

Maximum line length

120 characters

Use semicolons

Yes

Trailing commas

Yes

Single quotes

Prefer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Error Handling

Throw domain-specific errors.

Never swallow exceptions.

Use typed errors whenever possible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Async

Prefer async/await.

Avoid Promise chains.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Testing

Every public class should have

- Unit Tests

Critical business logic should additionally have

- Edge Case Tests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Code Review Checklist

□ Naming

□ Header

□ Documentation

□ Validation

□ Tests

□ Formatting

□ Readability

□ Architecture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard