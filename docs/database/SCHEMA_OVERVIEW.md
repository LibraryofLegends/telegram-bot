# 🗄️ SCHEMA_OVERVIEW.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Database Schema

---

# 1. Ziel

Dieses Dokument beschreibt die komplette Datenbankstruktur von Library Of Legends 2.0.

Es dient als Übersicht aller Tabellen und ihrer Beziehungen.

Neue Tabellen müssen zuerst hier ergänzt werden.

---

# 2. Datenbankübersicht

```text
Media

├── media_items
├── movies
├── series
├── seasons
├── episodes

Collections

├── collections
├── movie_collections
├── series_collections

Universes

├── universes
├── movie_universes
├── series_universes

Genres

├── genres
├── movie_genres
├── series_genres

People

├── people
├── movie_people
├── series_people

Studios

├── studios
├── movie_studios
├── series_studios

Languages

├── languages
├── media_languages

Countries

├── countries
├── media_countries

Ratings

├── ratings

Files

├── files
├── audio_tracks
├── subtitles

Users

├── users
├── favorites
├── playlists
├── playlist_items
├── history

Tags

├── tags
├── media_tags
```

---

# 3. Kernmodell

```text
MediaItem

│

├── Movie

├── Series

│      │

│      ├── Season

│      │      │

│      │      └── Episode

│

├── Music

├── Comic

├── Manga

├── Audiobook
```

---

# 4. Beziehungen

```text
Movie

├── Genres

├── Collections

├── Universes

├── Studios

├── People

├── Files

├── Ratings

├── Tags

├── Languages

└── Countries
```

---

# 5. Serien

```text
Series

├── Seasons

│

└── Episodes

Series

├── Genres

├── Collections

├── Universes

├── Studios

├── People

├── Ratings

└── Tags
```

---

# 6. Dateien

```text
File

├── Audio Tracks

├── Subtitles

├── Media Info

├── Resolution

├── Codec

├── HDR

└── Source
```

---

# 7. Benutzer

```text
User

├── Favorites

├── Playlists

├── History

├── Ratings

└── Watchlist
```

---

# 8. Collections

```text
Collection

│

├── Movies

└── Series
```

---

# 9. Universes

```text
Universe

│

├── Movies

├── Series

└── Collections
```

---

# 10. Personen

```text
Person

├── Actor

├── Director

├── Writer

├── Producer

├── Composer

└── Creator
```

---

# 11. Studios

```text
Studio

├── Movies

└── Series
```

---

# 12. Dateien

```text
Files

├── Movie

├── Episode

├── Audio

└── Subtitle
```

---

# 13. Erweiterbarkeit

Neue Module werden durch neue Tabellen ergänzt.

Beispiele:

- games
- podcasts
- magazines
- ebooks
- concerts

Die bestehende Struktur bleibt dabei unverändert.

---

# 14. Grundprinzipien

- Eine Tabelle = Eine Aufgabe
- Keine doppelten Daten
- Viele-zu-Viele-Beziehungen über Join-Tabellen
- Einheitliche Benennung
- Erweiterbarkeit
- Wartbarkeit

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: SCHEMA_OVERVIEW.md

Version: 2.0

Status: Official