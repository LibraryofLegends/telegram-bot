# 📘 CONTROLLER_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Controller Standard

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Standard für alle Controller innerhalb von Library Of Legends 2.0.

Controller bilden die Schnittstelle zwischen Benutzern, APIs, Telegram und den internen Services.

Controller enthalten keine Geschäftslogik.

---

# 2. Aufgabe eines Controllers

Ein Controller ist verantwortlich für:

- Eingaben entgegennehmen
- Parameter prüfen
- Services aufrufen
- Antworten zurückgeben
- Fehler an den Benutzer weitergeben

Ein Controller ist nicht verantwortlich für:

- SQL
- Geschäftslogik
- Layout-Erstellung
- Datenbankzugriffe
- Berechnungen

---

# 3. Standardstruktur

Jeder Controller besitzt denselben Aufbau.

```text
IMPORTS

CONSTANTS

HELPERS

REQUEST HANDLER

ERROR HANDLER

EXPORTS
```

---

# 4. Dateibenennung

Format:

```text
<entity>.controller.js
```

Beispiele:

```text
movie.controller.js

series.controller.js

collection.controller.js

genre.controller.js

person.controller.js
```

---

# 5. Kommunikation

Ein Controller kommuniziert ausschließlich mit:

- Services
- Validatoren
- Layouts

Ein Controller kommuniziert niemals direkt mit:

- Repositorys
- PostgreSQL
- SQLite

---

# 6. Ablauf

Jeder Request folgt demselben Ablauf.

```text
Benutzer

↓

Controller

↓

Validator

↓

Service

↓

Layout

↓

Antwort
```

---

# 7. Aufgaben

Ein Controller darf:

- Parameter lesen
- Dateien entgegennehmen
- IDs auslesen
- Service aufrufen
- Ergebnis zurückgeben

---

# 8. Keine Geschäftslogik

Nicht erlaubt:

```javascript
if (movie.runtime > 180) {

    ...

}
```

Solche Regeln gehören in den Service.

---

# 9. Keine SQL

Nicht erlaubt:

```javascript
SELECT *

FROM movies
```

SQL gehört ausschließlich ins Repository.

---

# 10. Fehlerbehandlung

Controller fangen Fehler ab.

Der Benutzer erhält verständliche Meldungen.

Beispiele:

```text
Movie not found.

Invalid request.

Access denied.

Internal server error.
```

---

# 11. Layouts

Falls Daten formatiert werden müssen:

Controller

↓

Layout

↓

Antwort

Der Controller erstellt keine Texte selbst.

---

# 12. Rückgabewerte

Controller liefern:

- JSON
- Telegram Messages
- Dateien
- Statuscodes

Keine Datenbankobjekte.

---

# 13. Namensregeln

Beispiele:

```javascript
getMovie()

createMovie()

updateMovie()

deleteMovie()

searchMovies()
```

---

# 14. Wiederverwendbarkeit

Ein Controller soll möglichst klein bleiben.

Komplexe Abläufe gehören in den Service.

---

# 15. Verboten

Nicht erlaubt:

- SQL
- Datenbankverbindungen
- Business Rules
- TMDB-Aufrufe
- Telegram API direkt
- Repository-Aufrufe

---

# 16. Datenfluss

```text
Request

↓

Controller

↓

Validator

↓

Service

↓

Layout

↓

Response
```

---

# 17. Architektur

```text
Client

↓

Controller

↓

Service

↓

Repository

↓

Database
```

Controller bilden ausschließlich den Einstiegspunkt.

---

# 18. Dokumentation

Jeder Controller beginnt mit dem offiziellen Dateikopf.

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

# 19. Qualitätsregeln

Ein Controller soll:

- klein sein
- verständlich sein
- keine Geschäftslogik besitzen
- keine SQL enthalten
- nur koordinieren

---

# 20. Grundprinzipien

Controller folgen immer diesen Regeln:

- Controller koordinieren.
- Services entscheiden.
- Repositorys speichern.
- Layouts formatieren.
- Datenbank speichert Daten.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: CONTROLLER_STANDARD.md

Version: 2.0

Status: Official