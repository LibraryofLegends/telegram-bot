# 📦 MODULE_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Module Standard

---

# 1. Ziel

Dieses Dokument definiert den Standardaufbau aller Module innerhalb von Library Of Legends 2.0.

Jedes Modul folgt derselben Struktur, unabhängig davon, ob es sich um Filme, Serien, Musik oder andere Medien handelt.

---

# 2. Grundprinzip

Ein Modul besitzt genau einen Verantwortungsbereich.

Beispiele:

- Movies
- Series
- Collections
- Genres
- People
- Studios
- Music
- Comics

Module dürfen nicht mehrere Fachbereiche gleichzeitig behandeln.

---

# 3. Standardstruktur

Jedes Modul besitzt denselben Aufbau.

```text
movie/

movie.constants.js

movie.controller.js

movie.routes.js

movie.service.js

movie.repository.js

movie.validator.js

movie.layout.js

movie.mapper.js

movie.types.js

index.js
```

---

# 4. Verantwortlichkeiten

## constants

Enthält:

- Konstanten
- Defaults
- Konfigurationen

---

## controller

Verantwortlich für:

- Requests
- Telegram Events
- API Endpunkte

Keine Business-Logik.

---

## routes

Definiert sämtliche Routen.

---

## service

Geschäftslogik.

Koordiniert mehrere Repositorys.

---

## repository

SQL

CRUD

Datenbankzugriffe

---

## validator

Prüft Eingaben.

---

## layout

Erzeugt Telegram-Layouts.

Beispiele:

Movie Post

Series Post

Collection Layout

---

## mapper

Konvertiert Daten.

Beispiele:

TMDB

OMDb

Telegram

Datenbank

---

## types

Typdefinitionen.

Enums.

Interfaces.

---

## index

Exportiert das gesamte Modul.

---

# 5. Datenfluss

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

Layout

↓

Controller
```

---

# 6. Erweiterbarkeit

Neue Dateien dürfen ergänzt werden.

Beispiele:

movie.search.js

movie.statistics.js

movie.importer.js

movie.exporter.js

movie.scheduler.js

Der bestehende Standard bleibt erhalten.

---

# 7. Namenskonventionen

Alle Dateien beginnen mit dem Modulnamen.

Beispiele:

movie.service.js

movie.repository.js

series.service.js

genre.repository.js

person.validator.js

---

# 8. Abhängigkeiten

Controller kennt:

Validator

Service

---

Service kennt:

Repository

Andere Services

---

Repository kennt:

Database

---

Layout kennt:

Keine Datenbank

Keine SQL

---

# 9. Verboten

Nicht erlaubt:

Repository → Controller

Repository → Telegram

Layout → SQL

Service → HTTP

Controller → SQL

---

# 10. Grundprinzipien

- Eine Datei = Eine Aufgabe
- Ein Modul = Ein Fachbereich
- Lose Kopplung
- Hohe Wiederverwendbarkeit
- Klare Verantwortlichkeiten

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: MODULE_STANDARD.md

Version: 2.0

Status: Official