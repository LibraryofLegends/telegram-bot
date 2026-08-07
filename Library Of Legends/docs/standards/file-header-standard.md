# File Header Standard

> Official source file header specification for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

Every source file inside Library Of Legends must begin with the official
Project Phoenix file header.

The header provides consistent metadata across the entire repository and
allows every file to be uniquely identified.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Standard Header

```text
/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........:

Architecture Layer..:

Module..............:

Module ID...........:

LOL-ID..............:

File................:

Location............

Version.............:

Status..............:

Lifecycle...........:

Description.........

===============================================================================
*/
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Field Description

| Field | Description |
|-------|-------------|
| Component | Component or class name |
| Architecture Layer | Framework / Shared / Domain / Infrastructure / Platform |
| Module | Module name |
| Module ID | Internal module identifier |
| LOL-ID | Unique Library Of Legends identifier |
| File | File name |
| Location | Repository location |
| Version | Current file version |
| Status | Development, Stable, Beta, Deprecated |
| Lifecycle | Current lifecycle phase |
| Description | Short description of the file |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Rules

- Every source file must contain exactly one header.
- The order of the fields must never change.
- Empty fields are not allowed.
- The header must be updated whenever a file changes significantly.
- All new files must follow this standard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Example

```text
/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Runtime

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0003

File................: runtime.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an immutable runtime measured in minutes.

===============================================================================
*/
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard