# 🏛️ ARCHITECTURE_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Architecture Standard

---

# 1. Ziel

Dieses Dokument definiert die offizielle Softwarearchitektur von Library Of Legends 2.0.

Alle Module, Datenbanken, Services und Integrationen orientieren sich an diesem Standard.

Die Architektur soll:

- wartbar sein
- modular sein
- skalierbar sein
- leicht testbar sein
- einfach erweiterbar sein
- klare Verantwortlichkeiten besitzen

---

# 2. Architekturprinzipien

Library Of Legends 2.0 basiert auf folgenden Grundprinzipien:

- Modulare Architektur
- Klare Schichten (Layer)
- Trennung von Verantwortlichkeiten
- Wiederverwendbare Komponenten
- Einheitliche Standards
- Lose Kopplung
- Hohe Lesbarkeit

---

# 3. Schichtenmodell

Das Projekt folgt einer festen Schichtenarchitektur.

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

Jede Schicht besitzt eine klar definierte Aufgabe.

---

# 4. Verantwortlichkeiten

## Controller

Verantwortlich für:

- Eingaben
- API-Aufrufe
- Telegram-Events
- Bot-Kommandos
- Antworten

Controller enthalten keine Geschäftslogik.

---

## Service

Verantwortlich für:

- Geschäftslogik
- Validierung
- Regeln
- Berechnungen
- Kombination mehrerer Repositorys

Services kennen Repositorys.

Services kennen keine SQL-Abfragen.

---

## Repository

Verantwortlich für:

- Datenbankzugriffe
- SQL
- CRUD-Operationen

Repositorys enthalten keine Geschäftslogik.

---

## Database

Verantwortlich für:

- Verbindung zur Datenbank
- PostgreSQL
- SQLite
- Datenbankabstraktion

Die Database-Schicht kennt keine Business-Logik.

---

# 5. Datenfluss

Jede Anfrage folgt demselben Ablauf.

```text
Benutzer

↓

Telegram

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

Telegram

↓

Benutzer
```

---

# 6. Module

Jeder Funktionsbereich wird als eigenständiges Modul entwickelt.

Beispiele:

- Movies
- Series
- Collections
- Universes
- Genres
- People
- Studios
- Music
- Comics
- Audiobooks
- Search
- Users
- Telegram
- TMDB

Module sind möglichst unabhängig voneinander.

---

# 7. MediaItem als Basismodell

Alle Medien basieren auf einer gemeinsamen Grundlage.

```text
MediaItem

├── Movie
├── Series
├── Music
├── Comic
├── Audiobook
├── Documentary
└── Short Film
```

Gemeinsame Eigenschaften werden im MediaItem gespeichert.

Spezielle Eigenschaften befinden sich in den jeweiligen Modulen.

---

# 8. Repository Pattern

Jede Entität besitzt ihr eigenes Repository.

Beispiele:

movie.repository.js

series.repository.js

collection.repository.js

genre.repository.js

person.repository.js

studio.repository.js

Repositories kommunizieren ausschließlich mit der Datenbank.

---

# 9. Service Pattern

Jede Entität besitzt ihren eigenen Service.

Beispiele:

movie.service.js

series.service.js

collection.service.js

Services koordinieren die Geschäftslogik.

---

# 10. Datenbankabstraktion

Repositorys greifen niemals direkt auf PostgreSQL oder SQLite zu.

Stattdessen wird ausschließlich die Database-Abstraktion verwendet.

Beispiel:

query()

get()

run()

exec()

Dadurch bleibt das Projekt unabhängig vom Datenbanksystem.

---

# 11. Erweiterbarkeit

Neue Funktionen werden grundsätzlich als neue Module entwickelt.

Bestehende Module werden möglichst wenig verändert.

---

# 12. Wiederverwendbarkeit

Gemeinsame Logik wird zentral implementiert.

Code-Duplikate sollen vermieden werden.

Hilfsfunktionen werden in gemeinsame Utilities ausgelagert.

---

# 13. Verantwortungsprinzip

Jede Datei besitzt genau eine Aufgabe.

Jede Funktion besitzt genau eine Aufgabe.

Jedes Modul besitzt genau einen Verantwortungsbereich.

---

# 14. Fehlerbehandlung

Fehler werden dort behandelt, wo sie sinnvoll verarbeitet werden können.

Technische Fehler werden protokolliert.

Benutzer erhalten verständliche Fehlermeldungen.

---

# 15. Skalierbarkeit

Die Architektur soll zukünftige Erweiterungen ohne größere Umbauten ermöglichen.

Beispiele:

- neue Medientypen
- neue Datenbanken
- neue APIs
- neue Bots
- Weboberfläche
- Mobile App

---

# 16. Qualitätsprinzipien

Library Of Legends 2.0 folgt folgenden Grundsätzen:

- Qualität vor Geschwindigkeit
- Lesbarkeit vor Komplexität
- Wartbarkeit vor kurzfristigen Lösungen
- Standards statt Sonderlösungen
- Dokumentation als Bestandteil der Entwicklung

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: ARCHITECTURE_STANDARD.md

Version: 2.0

Status: Official