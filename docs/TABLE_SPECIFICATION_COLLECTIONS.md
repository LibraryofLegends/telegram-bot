# TABLE_SPECIFICATION_COLLECTIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

collections

---

# Zweck

Die Tabelle `collections` speichert Sammlungen, Reihen und Franchises innerhalb von Library Of Legends.

Eine Collection fasst mehrere Medien zusammen, die inhaltlich oder offiziell miteinander verbunden sind.

Beispiele:

- Harry Potter
- Der Herr der Ringe
- Fast & Furious
- Jurassic Park
- Mission: Impossible
- Marvel Cinematic Universe
- James Bond
- Rocky
- Rambo

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| name | TEXT | Nein | - | Name der Collection |
| original_name | TEXT | Ja | NULL | Originalname |
| slug | TEXT | Nein | - | Technischer Name |
| description | TEXT | Ja | NULL | Beschreibung |
| overview | TEXT | Ja | NULL | Ausführliche Beschreibung |
| logo_path | TEXT | Ja | NULL | Logo |
| poster_path | TEXT | Ja | NULL | Poster |
| backdrop_path | TEXT | Ja | NULL | Hintergrundbild |
| tmdb_collection_id | INTEGER | Ja | NULL | TMDb Collection ID |
| imdb_collection_id | TEXT | Ja | NULL | Externe Kennung |
| release_start | DATE | Ja | NULL | Erste Veröffentlichung |
| release_end | DATE | Ja | NULL | Letzte Veröffentlichung |
| movie_count | INTEGER | Nein | 0 | Anzahl der Filme |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## name

Offizieller Name.

Beispiel:

```text
Harry Potter
```

---

## original_name

Originaltitel.

Beispiel:

```text
The Lord of the Rings
```

---

## slug

Technischer eindeutiger Name.

Beispiele:

```text
harry-potter

jurassic-park

fast-and-furious
```

---

## description

Kurze Beschreibung.

---

## overview

Ausführliche Beschreibung der Filmreihe.

---

## logo_path

Pfad oder URL zum Logo.

---

## poster_path

Pfad oder URL zum offiziellen Poster.

---

## backdrop_path

Pfad oder URL zum Hintergrundbild.

---

## tmdb_collection_id

Offizielle Collection-ID von TMDb.

---

## imdb_collection_id

Optionale externe Kennung.

---

## release_start

Erster veröffentlichter Film.

---

## release_end

Letzter veröffentlichter Film.

NULL bedeutet:

```text
Collection läuft noch.
```

---

## movie_count

Anzahl der zugeordneten Filme.

Kann automatisch aktualisiert werden.

---

## sort_order

Sortierung innerhalb der Benutzeroberfläche.

---

## is_active

Status.

```text
1 = Aktiv

0 = Archiviert
```

---

# Unique Constraints

name

slug

tmdb_collection_id

---

# Indizes

idx_collections_name

idx_collections_slug

idx_collections_tmdb

idx_collections_active

idx_collections_release_start

---

# Check Constraints

movie_count >= 0

sort_order >= 0

is_active IN (0,1)

---

# Beziehungen

collections

↓

movie_collections

↓

movies

---

Später zusätzlich:

collections

↓

series_collections

↓

series

---

books

↓

book_collections

↓

books

---

# Beispiel-Datensatz

```text
id

3

name

Harry Potter

original_name

Harry Potter

slug

harry-potter

description

Filmreihe über den berühmten Zauberlehrling.

tmdb_collection_id

1241

release_start

2001-11-16

release_end

2011-07-15

movie_count

8

sort_order

5

is_active

1
```

---

# Business Rules

- Eine Collection kann beliebig viele Filme enthalten.
- Ein Film kann mehreren Collections angehören.
- Collections werden grundsätzlich nicht gelöscht.
- Stattdessen werden sie deaktiviert.
- Externe IDs dürfen nach dem Import nicht verändert werden.

---

# Performance

Häufige Abfragen:

Alle Filme einer Collection

↓

```sql
SELECT movie_id
FROM movie_collections
WHERE collection_id = ?
```

Alle Collections eines Films

↓

```sql
SELECT collection_id
FROM movie_collections
WHERE movie_id = ?
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Banner
- Eigenes Cover
- Reihenfolge innerhalb der Collection
- Offizielle Reihenfolge
- Chronologische Reihenfolge
- Benutzerdefinierte Reihenfolge
- Mehrsprachige Beschreibungen
- Collection-Tags

---

# Hinweise

- Collections sind medienübergreifend nutzbar.
- Die eigentliche Zuordnung erfolgt ausschließlich über Verknüpfungstabellen.
- `movie_count` sollte idealerweise automatisch über Trigger oder durch den Service aktualisiert werden, um Inkonsistenzen zu vermeiden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_COLLECTIONS.md

Version: 2.0

Status: Official