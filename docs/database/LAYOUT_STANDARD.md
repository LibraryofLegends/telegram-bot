# 📘 LAYOUT_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0
**Status:** Official Layout Standard

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Standard für alle Layouts innerhalb von Library Of Legends 2.0.

Layouts sind ausschließlich für die Darstellung von Daten verantwortlich.

Sie enthalten keine Geschäftslogik.

---

# 2. Aufgabe eines Layouts

Ein Layout ist verantwortlich für:

- Darstellung von Daten
- Formatierung
- Telegram-Nachrichten
- Markdown
- HTML
- Textausgabe

Ein Layout ist nicht verantwortlich für:

- SQL
- Datenbankzugriffe
- Geschäftslogik
- API-Aufrufe
- Validierungen

---

# 3. Standardstruktur

Jedes Layout besitzt denselben Aufbau.

```text
IMPORTS

CONSTANTS

HELPERS

HEADER

CONTENT

FOOTER

EXPORTS
```

---

# 4. Dateibenennung

Format:

```text
<entity>.layout.js
```

Beispiele:

```text
movie.layout.js

series.layout.js

collection.layout.js

person.layout.js

genre.layout.js
```

---

# 5. Kommunikation

Layouts kommunizieren ausschließlich mit:

- Controller
- Service

Layouts kommunizieren niemals mit:

- Repository
- Database
- PostgreSQL
- SQLite

---

# 6. Aufgabe

Layouts formatieren ausschließlich Daten.

Beispiel:

Movie Objekt

↓

Movie Layout

↓

Telegram Nachricht

---

# 7. Eingaben

Layouts erhalten fertige Daten.

Nicht:

IDs

SQL

Repositorys

Sonderabfragen

---

# 8. Ausgaben

Layouts erzeugen:

- Telegram Posts
- Markdown
- HTML
- JSON-Strukturen
- Embed-Nachrichten

---

# 9. Telegram Layout

Ein Telegram Layout besitzt grundsätzlich:

Titel

Cover

Informationen

Beschreibung

Metadaten

Hashtags

Archivnummer

Footer

---

# 10. Wiederverwendbarkeit

Ein Layout soll mehrfach genutzt werden können.

Beispiele:

Movie Layout

↓

Telegram

↓

API

↓

Export

---

# 11. Keine Geschäftslogik

Nicht erlaubt:

```javascript
if (movieExists()) {

}
```

Nicht erlaubt:

```javascript
calculateRuntime()
```

Nicht erlaubt:

```javascript
generateLibraryId()
```

Diese Aufgaben gehören in den Service.

---

# 12. Keine SQL

Layouts enthalten niemals:

SELECT

INSERT

UPDATE

DELETE

---

# 13. Helper

Layouts dürfen kleine Hilfsfunktionen besitzen.

Beispiele:

formatDate()

formatRuntime()

formatRating()

formatResolution()

---

# 14. Namensregeln

Beispiele:

```javascript
buildMovieLayout()

buildSeriesLayout()

buildCollectionLayout()

buildGenreLayout()

buildTelegramPost()
```

---

# 15. Datenfluss

```text
Database

↓

Repository

↓

Service

↓

Layout

↓

Controller

↓

Telegram
```

---

# 16. Verboten

Nicht erlaubt:

- SQL
- Datenbankzugriffe
- Repositorys
- Business Rules
- HTTP Requests
- API-Aufrufe

---

# 17. Dokumentation

Jedes Layout beginnt mit dem offiziellen Dateikopf.

```javascript
// ======================================================
// Library Of Legends 2.0
// File:
// Module:
// Description:
// Author: Thomas Lorenz
// Version: 2.0
// ======================================================
```

---

# 18. Qualitätsregeln

Ein Layout soll:

- klein sein
- übersichtlich sein
- wiederverwendbar sein
- leicht verständlich sein
- ausschließlich formatieren

---

# 19. Grundprinzipien

Layouts folgen immer diesen Regeln:

- Daten kommen vom Service.
- Layouts formatieren Daten.
- Layouts verändern keine Daten.
- Layouts speichern keine Daten.
- Layouts kennen keine Datenbank.

---

# 20. Layout-Arten

Library Of Legends unterstützt verschiedene Layout-Typen.

Beispiele:

Telegram Layout

Movie Layout

Series Layout

Collection Layout

Music Layout

Comic Layout

Audiobook Layout

Search Layout

Statistics Layout

Export Layout

---

# 21. Zukunftssicherheit

Neue Layouts müssen diesem Standard folgen.

Beispiele:

Discord Layout

Web Layout

Mobile Layout

PDF Layout

Excel Export

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: LAYOUT_STANDARD.md

Version: 2.0

Status: Official