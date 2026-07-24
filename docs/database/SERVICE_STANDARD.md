# 📘 SERVICE_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Service Standard

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Standard für alle Services innerhalb von Library Of Legends 2.0.

Services enthalten ausschließlich Geschäftslogik und koordinieren den Ablauf zwischen Controller, Repositorys und anderen Services.

---

# 2. Aufgabe eines Services

Ein Service ist verantwortlich für:

- Geschäftslogik
- Validierungen
- Berechnungen
- Kombination mehrerer Repositorys
- Entscheidungen
- Workflows
- Transaktionen koordinieren

Ein Service ist nicht verantwortlich für:

- SQL
- HTTP
- Telegram-Ausgaben
- Layouts
- Datenbankverbindungen

---

# 3. Standardstruktur

Jeder Service besitzt denselben Aufbau.

```text
IMPORTS

CONSTANTS

HELPERS

READ

CREATE

UPDATE

DELETE

BUSINESS LOGIC

EXPORTS
```

---

# 4. Dateibenennung

Format:

```text
<entity>.service.js
```

Beispiele:

```text
movie.service.js

series.service.js

collection.service.js

genre.service.js

person.service.js
```

---

# 5. Kommunikation

Der Service kommuniziert ausschließlich mit:

- Repositorys
- anderen Services
- Validatoren
- Utilities

Der Service kommuniziert niemals direkt mit:

- PostgreSQL
- SQLite
- Telegram API
- Layouts

---

# 6. Geschäftslogik

Alle Regeln gehören in den Service.

Beispiele:

- Film existiert bereits?
- Genre vorhanden?
- Collection anlegen?
- Library-ID erzeugen?
- Dubletten verhindern?

---

# 7. Repository-Nutzung

Repositorys liefern Daten.

Der Service entscheidet, was mit den Daten geschieht.

Beispiel:

```text
Movie Repository

↓

Movie Service

↓

Controller
```

---

# 8. READ

Beispiele:

```javascript
getMovie()

findMovie()

searchMovies()

getCollectionMovies()
```

---

# 9. CREATE

Beispiele:

```javascript
createMovie()

importMovie()

createCollection()
```

---

# 10. UPDATE

Beispiele:

```javascript
updateMovie()

refreshMetadata()

updateRuntime()

assignGenres()
```

---

# 11. DELETE

Beispiele:

```javascript
deleteMovie()

removeCollection()

removeGenre()
```

---

# 12. Business Logic

Komplexe Abläufe gehören ausschließlich hierhin.

Beispiel:

Film importieren

↓

TMDB laden

↓

Genres speichern

↓

Personen speichern

↓

Collection zuweisen

↓

Library-ID erzeugen

↓

Film speichern

↓

Ergebnis zurückgeben

---

# 13. Mehrere Repositorys

Ein Service darf mehrere Repositorys kombinieren.

Beispiel:

Movie Repository

Genre Repository

Collection Repository

Person Repository

Studio Repository

---

# 14. Fehlerbehandlung

Technische Fehler werden weitergegeben.

Geschäftsfehler werden verständlich formuliert.

Beispiele:

Movie already exists.

Collection not found.

Invalid media type.

---

# 15. Wiederverwendbarkeit

Services sollen von mehreren Controllern genutzt werden können.

Keine Logik für einzelne Controller schreiben.

---

# 16. Verboten

Nicht erlaubt:

- SQL
- SELECT
- INSERT
- UPDATE
- DELETE
- Telegram API
- Layout-Erzeugung
- Direkte Datenbankzugriffe

---

# 17. Datenfluss

```text
Controller

↓

Validator

↓

Service

↓

Repository

↓

Database
```

Antwort:

```text
Database

↓

Repository

↓

Service

↓

Controller
```

---

# 18. Namensregeln

Lesen

```javascript
getMovie()

findMovie()

searchMovies()
```

Erstellen

```javascript
createMovie()

importMovie()
```

Aktualisieren

```javascript
updateMovie()

refreshMovieMetadata()
```

Löschen

```javascript
deleteMovie()
```

---

# 19. Dokumentation

Jeder Service beginnt mit dem offiziellen Dateikopf.

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

# 20. Architektur

```text
Controller

↓

Service

↓

Repository

↓

Database
```

Der Service bildet die zentrale Schicht der Geschäftslogik.

---

# 21. Qualitätsregeln

Ein Service soll:

- leicht verständlich sein
- wiederverwendbar sein
- testbar sein
- unabhängig von der Datenbank sein
- unabhängig von Telegram sein

---

# 22. Grundprinzipien

Services folgen immer diesen Regeln:

- Geschäftslogik gehört ausschließlich in den Service.
- SQL gehört ausschließlich ins Repository.
- Layouts gehören ausschließlich ins Layout.
- Validierungen gehören in Validatoren oder den Service.
- Controller koordinieren nur den Ablauf.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: SERVICE_STANDARD.md

Version: 2.0

Status: Official