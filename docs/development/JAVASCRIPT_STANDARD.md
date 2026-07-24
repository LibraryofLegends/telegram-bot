# 📘 JAVASCRIPT_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Coding Standard

---

# 1. Ziel

Dieser Standard definiert die offiziellen Richtlinien für den JavaScript-Code von Library Of Legends 2.0.

Alle Dateien im Projekt folgen derselben Struktur, denselben Namenskonventionen und denselben Architekturregeln.

Ziele:

- Einheitlicher Quellcode
- Hohe Lesbarkeit
- Einfache Wartung
- Klare Verantwortlichkeiten
- Langfristige Erweiterbarkeit

---

# 2. Dateikopf

Jede JavaScript-Datei beginnt mit folgendem Header.

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

Beispiel:

```javascript
// ======================================================
// Library Of Legends 2.0
// File: movie.repository.js
// Module: Movies
// Description: Movie Repository
// Author: Thomas Lorenz
// Version: 2.0
// ======================================================
```

---

# 3. Standard-Aufbau einer Datei

Jede Datei folgt möglichst dieser Reihenfolge:

```text
IMPORTS

CONSTANTS

CONFIG

ENUMS

HELPERS

READ

CREATE

UPDATE

DELETE

VALIDATION

UTILITIES

EXPORTS
```

Nicht benötigte Bereiche können entfallen.

Die Reihenfolge bleibt jedoch immer gleich.

---

# 4. Abschnittsüberschriften

Jeder Bereich erhält einen Kommentarblock.

Beispiel:

```javascript
// ======================================================
// IMPORTS
// ======================================================
```

Weitere Beispiele:

```javascript
// ======================================================
// HELPERS
// ======================================================
```

```javascript
// ======================================================
// READ
// ======================================================
```

```javascript
// ======================================================
// EXPORTS
// ======================================================
```

---

# 5. Funktionen

Jede öffentliche Funktion erhält einen eigenen Kommentarblock.

Beispiel:

```javascript
// ======================================================
// GET MOVIE
// ======================================================

async function getMovie(id) {

}
```

Nicht:

```javascript
async function getMovie(id) {

}
```

---

# 6. Eine Funktion = Eine Aufgabe

Jede Funktion besitzt genau eine Verantwortung.

✔ Gut

```javascript
getMovie()

saveMovie()

deleteMovie()

findMovie()
```

❌ Schlecht

```javascript
getMovieAndCreateTopicAndUpdateStatistics()
```

---

# 7. Lesbarkeit

Code soll leicht lesbar sein.

Regeln:

- Leerzeilen zwischen Funktionen
- Leerzeilen zwischen logischen Blöcken
- Keine unnötigen Verschachtelungen
- Frühzeitige Rückgaben (Early Return) bevorzugen
- Aussagekräftige Variablennamen verwenden

---

# 8. Benennung

## Dateien

Alle Dateinamen werden klein geschrieben.

Beispiele:

```text
movie.repository.js

movie.service.js

movie.validator.js

movie.layout.js

movie.constants.js

movie.types.js
```

---

## Funktionen

camelCase

Beispiele:

```javascript
getMovie()

saveMovie()

deleteMovie()

findMovie()

assignMovieToCollection()
```

---

## Variablen

camelCase

Beispiele:

```javascript
movie

movieId

collection

collectionId

runtime
```

---

## Konstanten

UPPER_CASE

Beispiele:

```javascript
DEFAULT_LANGUAGE

MAX_RESULTS

SUPPORTED_FORMATS

MOVIE_TYPES
```

---

# 9. Kommentare

Kommentare erklären immer:

Warum etwas geschieht.

Nicht:

Was geschieht.

✔ Gut

```javascript
// Ignore hidden movies
```

❌ Schlecht

```javascript
// Increment i
```

---

# 10. Fehlerbehandlung

Fehler werden nur dort behandelt, wo sie sinnvoll verarbeitet oder weitergegeben werden können.

Beispiel:

```javascript
try {

}
catch (error) {

}
```

Keine unnötigen try/catch-Blöcke.

---

# 11. Exporte

Alle Exporte stehen am Ende der Datei.

```javascript
// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    getMovie,
    saveMovie,
    deleteMovie

};
```

---

# 12. Dateigröße

Empfohlene Maximalgrößen

Utility

100–200 Zeilen

Repository

200–400 Zeilen

Service

300–500 Zeilen

Größere Dateien sollten aufgeteilt werden.

---

# 13. Architekturregeln

Die Architektur folgt immer diesem Aufbau:

```text
Controller

↓

Service

↓

Repository

↓

Database
```

Regeln:

- Controller kennt Service
- Service kennt Repository
- Repository kennt Database
- Database kennt keine Geschäftslogik

---

# 14. Verboten

Nicht erlaubt sind:

- Funktionen mit mehreren Verantwortlichkeiten
- SQL außerhalb der Repositorys
- Telegram-Code innerhalb der Repositorys
- Datenbankzugriffe innerhalb der Layouts
- Doppelte Logik
- Mehrfach verschachtelte if-Ketten ohne Notwendigkeit

---

# 15. Formatierung

Regeln:

- Vier Leerzeichen Einrückung
- Semikolons verwenden
- Geschweifte Klammern immer setzen
- Aussagekräftige Variablennamen verwenden
- Keine Magic Numbers
- Keine toten Codebereiche

---

# 16. Zukunftssicherheit

Jedes neue Modul muss diesen Standard einhalten.

Beispiele:

- Movies
- Series
- Collections
- Universes
- Music
- Comics
- Audiobooks
- Telegram
- TMDB
- Search
- Users

---

# 17. Grundprinzip

Library Of Legends 2.0 folgt den folgenden Prinzipien:

- Qualität vor Geschwindigkeit
- Lesbarkeit vor Kürze
- Wiederverwendbarkeit vor Kopieren
- Eine Datei = Eine Verantwortung
- Eine Funktion = Eine Aufgabe
- Einheitliche Standards im gesamten Projekt

---

# Dokumenteninformationen

Projekt: Library Of Legends 2.0

Dokument: JAVASCRIPT_STANDARD.md

Version: 2.0

Status: Official