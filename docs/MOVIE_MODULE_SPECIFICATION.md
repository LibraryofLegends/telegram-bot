# 🎬 MOVIE_MODULE_SPECIFICATION.md

# Library Of Legends 2.0

**Version:** 2.0
**Status:** Official Module Specification

---

# 1. Ziel

Dieses Dokument beschreibt die vollständige technische Spezifikation des Movie-Moduls.

Es dient als Grundlage für:

- Datenbank
- Repository
- Service
- Controller
- Layout
- API
- Tests

---

# 2. Modulübersicht

Das Movie-Modul verwaltet sämtliche Spielfilme innerhalb von Library Of Legends.

Es bildet das Referenzmodul für alle weiteren Medientypen.

---

# 3. Verantwortlichkeiten

Das Movie-Modul ist verantwortlich für:

- Filme
- Film-Metadaten
- Sammlungen
- Genres
- Personen
- Studios
- Bewertungen
- Dateien
- Suchfunktionen

Nicht verantwortlich für:

- Serien
- Musik
- Comics
- Benutzerverwaltung

---

# 4. Ordnerstruktur

```text
domains/

movies/

├── movie.constants.js
├── movie.controller.js
├── movie.routes.js
├── movie.service.js
├── movie.repository.js
├── movie.validator.js
├── movie.layout.js
├── movie.mapper.js
├── movie.types.js
├── movie.search.js
├── movie.statistics.js
├── index.js
```

---

# 5. Datenbanktabellen

Das Movie-Modul verwendet folgende Tabellen.

```text
media_items

movies

movie_genres

movie_people

movie_studios

movie_collections

movie_universes

movie_languages

movie_countries

movie_files

movie_tags

ratings
```

---

# 6. Beziehungen

```text
Movie

├── Media Item

├── Genres

├── Collections

├── Universes

├── People

├── Studios

├── Files

├── Ratings

├── Languages

├── Countries

└── Tags
```

---

# 7. Repository

Repository-Aufgaben:

- Filme lesen
- Filme speichern
- Filme aktualisieren
- Filme löschen
- Suchabfragen
- Filter
- Statistiken

---

# 8. Service

Service-Aufgaben:

- Filme importieren
- Library-ID erzeugen
- Dubletten erkennen
- Metadaten aktualisieren
- Genres zuweisen
- Personen verknüpfen
- Collections verknüpfen
- Universes verknüpfen

---

# 9. Controller

Controller-Aufgaben:

- API Requests
- Telegram Requests
- Suchanfragen
- Import starten
- Antworten zurückgeben

---

# 10. Validator

Prüft:

- Titel
- Erscheinungsjahr
- TMDB-ID
- IMDb-ID
- Laufzeit
- Pflichtfelder

---

# 11. Layout

Erzeugt:

- Telegram Posts
- Detailansicht
- Listenansicht
- Suchergebnisse
- Sammlungsansicht
- Statistiken

---

# 12. API-Endpunkte

```text
GET

/api/v1/movies

GET

/api/v1/movies/:id

POST

/api/v1/movies

PUT

/api/v1/movies/:id

DELETE

/api/v1/movies/:id

GET

/api/v1/movies/search

GET

/api/v1/movies/latest

GET

/api/v1/movies/trending

GET

/api/v1/movies/random
```

---

# 13. Suchfunktionen

Unterstützte Suchparameter:

- Titel
- Originaltitel
- Library-ID
- TMDB-ID
- IMDb-ID
- Genre
- Jahr
- Studio
- Person
- Sprache
- Collection
- Universe

---

# 14. Filter

Unterstützte Filter:

- Jahr
- Genre
- Studio
- Sprache
- Land
- Bewertung
- Laufzeit
- Qualität
- HDR
- Auflösung

---

# 15. Sortierung

Sortierung nach:

- Titel
- Jahr
- Bewertung
- Laufzeit
- Hinzugefügt am
- Aktualisiert am

---

# 16. Statistiken

Das Modul stellt Statistiken bereit.

Beispiele:

- Anzahl Filme
- Durchschnittsbewertung
- Genres
- Länder
- Studios
- Sammlungen
- Universen

---

# 17. Import

Unterstützte Quellen:

- TMDb
- OMDb
- Manuelle Eingabe
- Telegram Import
- JSON Import

---

# 18. Export

Unterstützte Formate:

- JSON
- CSV
- Excel
- PDF

---

# 19. Tests

Das Modul besitzt:

- Unit Tests
- Integration Tests
- API Tests

---

# 20. Zukunftssicherheit

Geplante Erweiterungen:

- Mehrsprachige Inhalte
- KI-gestützte Tags
- Automatische Dublettenerkennung
- Erweiterte Empfehlungen
- Persönliche Bewertungen

---

# 21. Grundprinzipien

Das Movie-Modul folgt allen offiziellen Standards von Library Of Legends 2.0:

- ARCHITECTURE_STANDARD.md
- PROJECT_STRUCTURE.md
- JAVASCRIPT_STANDARD.md
- DATABASE_STANDARD.md
- REPOSITORY_STANDARD.md
- SERVICE_STANDARD.md
- CONTROLLER_STANDARD.md
- LAYOUT_STANDARD.md
- API_STANDARD.md

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: MOVIE_MODULE_SPECIFICATION.md

Version: 2.0

Status: Official