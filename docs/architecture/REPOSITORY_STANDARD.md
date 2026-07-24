# 📘 REPOSITORY_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Repository Standard

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Standard für alle Repositorys innerhalb von Library Of Legends 2.0.

Repositorys sind ausschließlich für den Zugriff auf die Datenbank verantwortlich.

Sie enthalten keine Geschäftslogik.

---

# 2. Aufgabe eines Repositorys

Ein Repository ist die einzige Schicht, die SQL-Abfragen ausführt.

Verantwortlich für:

- Lesen
- Schreiben
- Aktualisieren
- Löschen
- Datenbankabfragen
- Transaktionen

Nicht verantwortlich für:

- Geschäftslogik
- Validierungen
- Telegram
- Layouts
- Berechnungen

---

# 3. Standardstruktur

Jedes Repository besitzt denselben Aufbau.

```text
IMPORTS

CONSTANTS

HELPERS

READ

CREATE

UPDATE

DELETE

EXPORTS
```

---

# 4. Dateibenennung

Format:

```text
<entity>.repository.js
```

Beispiele:

```text
movie.repository.js

series.repository.js

collection.repository.js

genre.repository.js

person.repository.js

studio.repository.js
```

---

# 5. Datenbankzugriffe

Repositorys verwenden ausschließlich:

```javascript
query()

get()

run()

exec()
```

Direkte Datenbankverbindungen sind nicht erlaubt.

---

# 6. SQL

SQL bleibt ausschließlich im Repository.

Beispiel:

✔

```javascript
SELECT * FROM movies;
```

im Repository.

Nicht:

SQL im Service.

SQL im Controller.

SQL im Layout.

---

# 7. CRUD

Jedes Repository verwendet dieselbe Reihenfolge.

```text
READ

CREATE

UPDATE

DELETE
```

---

# 8. READ

Beispiele:

```javascript
getMovie()

findMovie()

findByTmdbId()

findAll()

search()
```

---

# 9. CREATE

Beispiele:

```javascript
createMovie()

createCollection()

createGenre()
```

---

# 10. UPDATE

Beispiele:

```javascript
updateMovie()

updateRuntime()

updatePoster()

updateMetadata()
```

---

# 11. DELETE

Beispiele:

```javascript
deleteMovie()

deleteCollection()

deleteGenre()
```

---

# 12. Rückgabewerte

Repositorys liefern ausschließlich Daten zurück.

Keine formatierten Texte.

Keine Telegram-Ausgaben.

Keine Layouts.

---

# 13. Fehlerbehandlung

Repositorys werfen technische Fehler weiter.

Geschäftslogik wird nicht behandelt.

---

# 14. Transaktionen

Falls mehrere Änderungen gemeinsam erfolgen müssen, werden Transaktionen verwendet.

Beispiele:

- Film erstellen
- Genres zuweisen
- Collection zuweisen

Alle Schritte müssen erfolgreich sein.

---

# 15. Wiederverwendbarkeit

Repositorys sollen allgemein nutzbar sein.

Keine Speziallogik für einzelne Controller.

---

# 16. Verboten

Nicht erlaubt:

- Telegram API
- HTTP Requests
- TMDB API
- Layouts
- Business Rules
- Validierungen

---

# 17. Beispiel

```text
Movie Service

↓

Movie Repository

↓

Database

↓

PostgreSQL / SQLite
```

---

# 18. Architektur

```text
Controller

↓

Service

↓

Repository

↓

Database
```

Repositorys kommunizieren ausschließlich mit der Database-Schicht.

---

# 19. Namensregeln

Lesen

```javascript
getMovie()

findMovie()

findAllMovies()
```

Erstellen

```javascript
createMovie()
```

Aktualisieren

```javascript
updateMovie()
```

Löschen

```javascript
deleteMovie()
```

---

# 20. Dokumentation

Jedes Repository beginnt mit dem offiziellen Dateikopf.

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

# 21. Grundprinzipien

Repositorys folgen immer diesen Regeln:

- SQL gehört ausschließlich ins Repository
- Keine Geschäftslogik
- Kleine Funktionen
- Hohe Lesbarkeit
- Wiederverwendbarkeit
- Einheitliche Struktur
- Datenbankunabhängigkeit

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: REPOSITORY_STANDARD.md

Version: 2.0

Status: Official