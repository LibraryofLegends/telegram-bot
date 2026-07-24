# 📂 PROJECT_STRUCTURE.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Project Structure

---

# 1. Ziel

Dieses Dokument definiert die offizielle Ordnerstruktur von Library Of Legends 2.0.

Jede Datei besitzt einen festen Platz innerhalb des Projekts.

Neue Module orientieren sich an diesem Aufbau.

---

# 2. Projektübersicht

```text
Library Of Legends/

├── app/
├── config/
├── database/
├── docs/
├── domains/
├── integrations/
├── layouts/
├── logger/
├── scripts/
├── services/
├── shared/
├── tests/
├── utils/

├── package.json
├── package-lock.json
├── server.js
├── .env
└── README.md
```

---

# 3. Ordnerbeschreibung

## app/

Enthält den Einstiegspunkt der Anwendung.

Beispiele:

- app.js
- router.js
- bootstrap.js

---

## config/

Konfigurationen.

Beispiele:

- database.config.js
- telegram.config.js
- tmdb.config.js

---

## database/

Alles rund um die Datenbank.

Unterordner:

```text
database/

├── connection.js
├── database.js
├── migrations/
├── repositories/
├── schema/
└── seeds/
```

---

## docs/

Komplette Projektdokumentation.

Unterordner:

```text
docs/

architecture/

database/

development/
```

---

## domains/

Enthält alle Geschäftsobjekte.

Beispiele:

```text
movies/

series/

collections/

people/

genres/

studios/

music/
```

Jede Domain ist eigenständig.

---

## integrations/

Schnittstellen zu externen Diensten.

Beispiele:

Telegram

TMDB

OMDb

Cloudinary

Discord

---

## layouts/

Alle Layouts.

Beispiele:

Telegram Posts

Movie Layouts

Series Layouts

Embeds

HTML

---

## logger/

Logging.

Beispiele:

Error Logger

Import Logger

Telegram Logger

---

## scripts/

Hilfsskripte.

Beispiele:

Migration Runner

Import Scripts

Repair Scripts

Maintenance

---

## services/

Projektübergreifende Services.

Beispiele:

Search

Caching

Notifications

Metadata

---

## shared/

Gemeinsam genutzte Komponenten.

Beispiele:

Constants

Enums

Errors

Types

Interfaces

---

## tests/

Alle Tests.

Unterteilung:

```text
unit/

integration/

system/
```

---

## utils/

Hilfsfunktionen.

Beispiele:

Date Formatter

String Formatter

Validators

Slug Generator

---

# 4. Modulstruktur

Jedes Modul besitzt denselben Aufbau.

Beispiel:

```text
movies/

movie.controller.js

movie.service.js

movie.repository.js

movie.validator.js

movie.layout.js

movie.constants.js

movie.routes.js
```

Alle Module folgen diesem Standard.

---

# 5. Datenbankstruktur

```text
database/

connection.js

database.js

repositories/

schema/

migrations/

seeds/
```

Repositories kommunizieren ausschließlich über database.js.

---

# 6. Dokumentation

Alle Standards befinden sich ausschließlich im docs-Ordner.

Beispiele:

- JAVASCRIPT_STANDARD.md
- DATABASE_STANDARD.md
- ARCHITECTURE_STANDARD.md
- PROJECT_STRUCTURE.md

---

# 7. Erweiterbarkeit

Neue Module werden nicht in bestehende Module integriert.

Sie erhalten immer einen eigenen Domain-Ordner.

Beispiel:

```text
domains/

movies/

series/

music/

games/

anime/
```

---

# 8. Grundprinzipien

Die Projektstruktur folgt folgenden Regeln:

- Eine Datei = Eine Aufgabe
- Ein Ordner = Ein Verantwortungsbereich
- Module sind unabhängig
- Wiederverwendbarkeit steht im Vordergrund
- Dokumentation gehört zum Projekt

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: PROJECT_STRUCTURE.md

Version: 2.0

Status: Official