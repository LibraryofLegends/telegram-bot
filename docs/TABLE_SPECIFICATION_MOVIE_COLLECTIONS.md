# TABLE_SPECIFICATION_MOVIE_COLLECTIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_collections

---

# Zweck

Die Tabelle `movie_collections` verknüpft Filme mit Collections.

Da ein Film mehreren Collections zugeordnet werden kann und jede Collection aus mehreren Filmen besteht, handelt es sich um eine Many-to-Many-Beziehung.

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Fremdschlüssel

movie_id

REFERENCES movies(id)

ON UPDATE CASCADE

ON DELETE CASCADE

---

collection_id

REFERENCES collections(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| collection_id | INTEGER | Nein | - | Zugehörige Collection |
| collection_order | INTEGER | Ja | NULL | Offizielle Reihenfolge innerhalb der Collection |
| chronological_order | INTEGER | Ja | NULL | Chronologische Reihenfolge |
| is_primary | INTEGER | Nein | 1 | Haupt-Collection |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf einen Film.

---

## collection_id

Referenz auf eine Collection.

---

## collection_order

Offizielle Reihenfolge innerhalb der Filmreihe.

Beispiele:

```text
1

2

3

4
```

---

## chronological_order

Chronologische Reihenfolge der Handlung.

Beispiel MCU:

```text
Captain America: The First Avenger = 1

Captain Marvel = 2

Iron Man = 3
```

---

## is_primary

Kennzeichnet die Haupt-Collection.

Werte:

```text
1 = Haupt-Collection

0 = Zusätzliche Collection
```

---

## created_at

Zeitpunkt der Erstellung.

---

# Unique Constraints

Ein Film darf einer Collection nur einmal zugeordnet werden.

```text
UNIQUE

(movie_id, collection_id)
```

---

# Indizes

idx_movie_collections_movie_id

idx_movie_collections_collection_id

idx_movie_collections_collection_order

idx_movie_collections_chronological_order

idx_movie_collections_primary

---

# Check Constraints

collection_order > 0

chronological_order > 0

is_primary IN (0,1)

---

# Beziehungen

movies

↓

movie_collections

↓

collections

---

# Beispiel-Datensatz

```text
id

1

movie_id

35

collection_id

4

collection_order

5

chronological_order

17

is_primary

1

created_at

2026-07-24 20:00:00
```

---

# Beispiel

Film:

```text
Avengers: Endgame
```

Collection:

```text
Marvel Cinematic Universe
```

Datensatz:

| movie_id | collection_id | collection_order | chronological_order |
|----------|---------------|-----------------:|--------------------:|
| 35 | 4 | 22 | 23 |

---

# Business Rules

- Ein Film darf mehreren Collections angehören.
- Eine Collection darf beliebig viele Filme enthalten.
- Dieselbe Zuordnung darf nur einmal existieren.
- Pro Film sollte höchstens eine Haupt-Collection definiert werden.
- Die Reihenfolge innerhalb einer Collection sollte eindeutig sein.

---

# Performance

Standardabfragen:

Alle Filme einer Collection

```sql
SELECT movie_id
FROM movie_collections
WHERE collection_id = ?
ORDER BY collection_order;
```

---

Alle Collections eines Films

```sql
SELECT collection_id
FROM movie_collections
WHERE movie_id = ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Alternative Reihenfolgen
- Benutzerdefinierte Reihenfolgen
- Story-Arcs
- Phasen (z. B. MCU Phase 1–6)
- Kapitel
- Collection-Rollen
- KI-generierte Gruppierungen

---

# Hinweise

- Die Tabelle enthält ausschließlich Beziehungen.
- Namen oder Beschreibungen werden niemals doppelt gespeichert.
- Die eigentlichen Collection-Daten befinden sich ausschließlich in der Tabelle `collections`.
- Reihenfolgen können sowohl nach Veröffentlichung (`collection_order`) als auch nach Handlung (`chronological_order`) gespeichert werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_COLLECTIONS.md

Version: 2.0

Status: Official