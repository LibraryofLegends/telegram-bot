# 🎬 MOVIE_DATABASE_SPECIFICATION.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# 1. Ziel

Dieses Dokument beschreibt die vollständige Datenbankstruktur des Movie-Moduls.

Es definiert sämtliche Tabellen, Beziehungen, Datentypen, Indizes und Integritätsregeln.

---

# 2. Architektur

Das Movie-Modul basiert auf einer normalisierten relationalen Datenbank.

Grundprinzip:

MediaItem

↓

Movie

↓

Zusatzinformationen

↓

Dateien

↓

Verknüpfungen

---

# 3. Haupttabellen

## media_items

Speichert gemeinsame Informationen aller Medientypen.

Beispiele:

- id
- library_id
- media_type
- status
- created_at
- updated_at

---

## movies

Speichert filmspezifische Informationen.

Beispiele:

- media_item_id
- title
- original_title
- sort_title
- release_date
- runtime
- overview
- tagline
- certification
- budget
- revenue
- popularity
- tmdb_id
- imdb_id

---

## movie_files

Speichert alle Dateien eines Films.

Beispiele:

- id
- movie_id
- filename
- filesize
- resolution
- source
- container
- video_codec
- audio_codec
- audio_channels
- hdr
- bitrate
- duration
- checksum

---

## genres

Liste aller Genres.

Beispiele:

Action

Drama

Fantasy

Comedy

Science Fiction

---

## movie_genres

Verknüpfungstabelle zwischen Filmen und Genres.

Ein Film kann mehrere Genres besitzen.

Ein Genre kann mehreren Filmen zugeordnet werden.

---

## collections

Filmreihen.

Beispiele:

Marvel Cinematic Universe

Harry Potter

Jurassic Park

Fast & Furious

---

## movie_collections

Zuordnung Film → Collection.

---

## universes

Gemeinsame Universen.

Beispiele:

Marvel

DC

Star Wars

Disney

---

## movie_universes

Zuordnung Film → Universe.

---

## people

Personen.

Beispiele:

Schauspieler

Regisseure

Produzenten

Autoren

Komponisten

---

## movie_people

Verknüpfung Film ↔ Person.

Zusätzliche Informationen:

- Rolle
- Reihenfolge
- Charaktername

---

## studios

Filmstudios.

---

## movie_studios

Zuordnung Film ↔ Studio.

---

## languages

Sprachen.

---

## movie_languages

Audio- und Originalsprachen.

---

## subtitles

Untertitel.

---

## countries

Produktionsländer.

---

## movie_countries

Film ↔ Land.

---

## ratings

Bewertungen.

Beispiele:

TMDb

IMDb

Metacritic

Rotten Tomatoes

Benutzerbewertung

---

## tags

Benutzerdefinierte Tags.

---

## movie_tags

Film ↔ Tag.

---

# 4. Primärschlüssel

Alle Tabellen besitzen:

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# 5. Fremdschlüssel

Alle Beziehungen werden über Foreign Keys abgesichert.

Beispiele:

movie_id

media_item_id

genre_id

collection_id

person_id

studio_id

---

# 6. Indizes

Alle häufig verwendeten Suchfelder erhalten Indizes.

Beispiele:

title

original_title

release_date

tmdb_id

imdb_id

library_id

created_at

---

# 7. Unique Constraints

Eindeutig:

library_id

tmdb_id

(im Rahmen der jeweiligen Medientypen)

---

# 8. Check Constraints

Beispiele:

runtime > 0

release_year >= 1888

rating BETWEEN 0 AND 10

budget >= 0

revenue >= 0

---

# 9. Löschregeln

Grundsätzlich:

ON UPDATE CASCADE

ON DELETE RESTRICT

Ausnahmen werden dokumentiert.

---

# 10. Archivnummer

Jeder Film erhält eine eindeutige Library-ID.

Beispiel:

MOV-000001

MOV-000002

MOV-000003

Die Library-ID bleibt dauerhaft unverändert.

---

# 11. Zeitstempel

Jede Tabelle besitzt:

created_at

updated_at

Optional:

deleted_at

---

# 12. Erweiterbarkeit

Die Datenbank muss ohne Strukturänderungen erweitert werden können.

Beispiele:

3D-Versionen

4K-Versionen

Director's Cut

Mehrere Audiospuren

Mehrere Untertitel

Mehrere Dateien pro Film

---

# 13. Performance

Alle Standardabfragen sollen auch bei sehr großen Datenbeständen performant bleiben.

Grundlagen:

- sinnvolle Indizes
- keine redundanten Daten
- normalisierte Tabellen
- gezielte JOINs

---

# 14. Zukunft

Die Struktur muss zukünftige Module unterstützen.

Beispiele:

Serien

Musik

Comics

Bücher

Spiele

Hörbücher

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: MOVIE_DATABASE_SPECIFICATION.md

Version: 2.0

Status: Official