# 🗄️ DATABASE_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Database Standard

---

# 1. Ziel

Dieses Dokument definiert die offiziellen Datenbankstandards von Library Of Legends 2.0.

Alle SQL-Dateien, Tabellen, Indizes, Constraints und Migrationen orientieren sich an diesem Standard.

Ziele:

- Einheitlicher Aufbau
- Hohe Lesbarkeit
- Einfache Wartung
- Klare Namenskonventionen
- Datenbankunabhängigkeit

---

# 2. Unterstützte Datenbanken

Library Of Legends unterstützt:

- PostgreSQL
- SQLite

Alle Datenbankzugriffe erfolgen ausschließlich über die Database-Abstraktion.

Direkte Datenbankzugriffe außerhalb der Repositorys sind nicht erlaubt.

---

# 3. Eine Tabelle = Eine Datei

Jede Tabelle besitzt eine eigene SQL-Datei.

Beispiele:

001_media_items.sql

002_movies.sql

003_series.sql

004_seasons.sql

005_episodes.sql

006_collections.sql

---

# 4. Dateibenennung

Dateien werden nummeriert.

Format:

001_name.sql

002_name.sql

003_name.sql

Beispiele:

001_media_items.sql

002_movies.sql

003_collections.sql

---

# 5. Dateikopf

Jede SQL-Datei beginnt mit folgendem Header.

```sql
-- =====================================================
-- Library Of Legends 2.0
-- File:
-- Module:
-- Table:
-- Description:
-- Author: Thomas Lorenz
-- Version: 2.0
-- =====================================================
```

---

# 6. Reihenfolge innerhalb einer SQL-Datei

Jede Datei besitzt dieselben Bereiche.

```text
HEADER

TABLE

INDEXES

FOREIGN KEYS

TRIGGERS

VIEWS

DEFAULT DATA
```

Nicht verwendete Bereiche bleiben erhalten.

Beispiel:

```sql
-- =====================================================
-- TRIGGERS
-- =====================================================

-- None
```

---

# 7. Tabellen

Tabellen werden ausschließlich in snake_case geschrieben.

Beispiele:

media_items

movies

series

episodes

movie_collections

movie_genres

movie_people

---

# 8. Spalten

Alle Spalten verwenden snake_case.

Beispiele:

library_id

media_type

original_title

release_date

created_at

updated_at

---

# 9. Primary Keys

Jede Tabelle besitzt genau einen Primary Key.

Format:

id

INTEGER PRIMARY KEY

oder

BIGSERIAL PRIMARY KEY

je nach Datenbanksystem.

---

# 10. Zeitstempel

Alle Tabellen besitzen folgende Felder:

created_at

updated_at

Optional:

deleted_at

---

# 11. Fremdschlüssel

Format:

fk_<quelle>_<ziel>

Beispiele:

fk_movies_media_items

fk_movie_genres_movies

fk_movie_genres_genres

---

# 12. Indizes

Format:

idx_<tabelle>_<spalte>

Beispiele:

idx_movies_tmdb_id

idx_movies_imdb_id

idx_media_items_title

idx_collections_slug

---

# 13. Unique Constraints

Format:

uq_<tabelle>_<spalte>

Beispiele:

uq_media_items_library_id

uq_collections_slug

---

# 14. Check Constraints

Format:

chk_<tabelle>_<regel>

Beispiele:

chk_movies_runtime

chk_media_items_media_type

---

# 15. Join-Tabellen

Viele-zu-Viele-Beziehungen erhalten eigene Tabellen.

Beispiele:

movie_genres

movie_people

movie_collections

movie_studios

series_genres

---

# 16. Trigger

Trigger werden nur verwendet, wenn sie echten Mehrwert bieten.

Beispiele:

updated_at automatisch aktualisieren

Historisierung

---

# 17. Views

Views dienen ausschließlich der Lesbarkeit oder Performance.

Business-Logik gehört nicht in Views.

---

# 18. Default Data

Standarddaten dürfen ausschließlich im Abschnitt

DEFAULT DATA

eingefügt werden.

Beispiele:

Medientypen

Sprachen

Länder

Standardrollen

---

# 19. Migrationen

Jede Änderung der Datenbank erfolgt über Migrationen.

Vorhandene Migrationen werden niemals verändert.

Neue Änderungen erhalten immer eine neue Datei.

---

# 20. Datenbankzugriffe

SQL befindet sich ausschließlich in Repositorys.

Services enthalten keine SQL-Abfragen.

Controller enthalten keine SQL-Abfragen.

Layouts enthalten keine SQL-Abfragen.

---

# 21. Datenbankabstraktion

Repositorys verwenden ausschließlich:

query()

get()

run()

exec()

Dadurch bleibt das Projekt unabhängig vom Datenbanksystem.

---

# 22. Dokumentation

Jede Tabelle besitzt:

- Beschreibung
- Primärschlüssel
- Fremdschlüssel
- Indizes
- Constraints

---

# 23. Grundprinzipien

Die Datenbank folgt folgenden Regeln:

- Lesbarkeit vor Kürze
- Einheitliche Benennung
- Eine Verantwortung pro Tabelle
- Keine doppelte Speicherung
- Erweiterbarkeit
- Wartbarkeit

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: DATABASE_STANDARD.md

Version: 2.0

Status: Official