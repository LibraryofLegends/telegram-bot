# Naming Standard

> Official naming convention for Library Of Legends.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

Consistent naming improves readability, maintainability and discoverability
across the entire project.

Every source file shall follow these conventions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Classes

Use PascalCase.

Examples:

Movie

Series

ProviderManager

ServiceContainer

ConfigurationLoader

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Interfaces

Use PascalCase.

Do NOT prefix with "I".

Examples:

Initializable

Configurable

Disposable

HealthCheckable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Enums

Use PascalCase.

Enum members use PascalCase.

Example:

enum MediaType {

    Movie,

    Series,

    Music

}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Functions

Use camelCase.

Examples:

initialize()

configure()

checkHealth()

loadConfiguration()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Variables

Use camelCase.

Examples:

movieTitle

providerManager

configurationLoader

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Constants

Use UPPER_SNAKE_CASE only for true constants.

Example:

MAX_TITLE_LENGTH

DEFAULT_TIMEOUT

MAX_FILE_SIZE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files

Use kebab-case.

Examples:

movie.ts

provider-manager.ts

health-checkable.ts

configuration-loader.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Folders

Use kebab-case.

Examples:

value-objects/

provider-sdk/

dependency-injection/

health-monitoring/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Test Files

Use the same filename with ".test.ts"

Examples:

movie.ts

movie.test.ts

provider-manager.ts

provider-manager.test.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Barrel Files

Every package should expose a single index.ts.

Example:

index.ts

export * from "./movie";

export * from "./movie-builder";

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## General Rules

- Avoid abbreviations.
- Prefer descriptive names.
- One concept = one name.
- Use singular names for Value Objects and Entities.
- Use plural names only for collections.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Standard