# TABLE_SPECIFICATION_UNIVERSES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

universes

---

# Zweck

Die Tabelle `universes` speichert alle fiktiven Universen, Franchises und Marken innerhalb von Library Of Legends.

Ein Universe dient als übergeordnete Gruppierung mehrerer Medien oder Collections.

Beispiele:

- Marvel Cinematic Universe
- DC Universe
- Star Wars
- Wizarding World
- Middle-earth
- Alien Universe
- Predator Universe
- MonsterVerse
- The Conjuring Universe

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
| name | TEXT | Nein | - | Name des Universums |
| original_name | TEXT | Ja | NULL | Originalname |
| slug | TEXT | Nein | - | Technischer Name |
| description | TEXT | Ja | NULL | Kurzbeschreibung |
| overview | TEXT | Ja | NULL | Ausführliche Beschreibung |
| logo_path | TEXT | Ja | NULL | Logo |
| poster_path | TEXT | Ja | NULL | Poster |
| backdrop_path | TEXT | Ja | NULL | Hintergrundbild |
| website | TEXT | Ja | NULL | Offizielle Website |
| founded_year | INTEGER | Ja | NULL | Gründungsjahr |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert am |

---

# Beschreibung der Spalten

## name

Offizieller Name.

Beispiele:

Marvel Cinematic Universe

Wizarding World

Star Wars

---

## original_name

Originalbezeichnung.

Beispiel:

Marvel Cinematic Universe

---

## slug

Technischer Name.

Beispiele:

marvel-cinematic-universe

wizarding-world

star-wars

---

## description

Kurze Beschreibung.

---

## overview

Ausführliche Beschreibung des Universums.

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

## website

Optionale offizielle Webseite.

---

## founded_year

Jahr der Einführung.

Beispiel:

```text
2008
```

---

## sort_order

Sortierreihenfolge.

Standard:

```text
0
```

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

---

# Indizes

idx_universes_name

idx_universes_slug

idx_universes_active

idx_universes_sort_order

idx_universes_founded_year

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

founded_year >= 1800

---

# Beziehungen

universes

↓

movie_universes

↓

movies

---

Später zusätzlich:

universes

↓

series_universes

↓

series

---

universes

↓

book_universes

↓

books

---

universes

↓

comic_universes

↓

comics

---

universes

↓

game_universes

↓

games

---

# Beispiel-Datensatz

```text
id

1

name

Marvel Cinematic Universe

original_name

Marvel Cinematic Universe

slug

marvel-cinematic-universe

description

Gemeinsames Film- und Serienuniversum der Marvel Studios.

founded_year

2008

sort_order

1

is_active

1
```

---

# Business Rules

- Ein Universe kann beliebig viele Medien enthalten.
- Ein Medium kann mehreren Universes angehören.
- Universes werden grundsätzlich nicht gelöscht.
- Stattdessen werden sie deaktiviert.
- Der Slug darf nach der Erstellung nicht geändert werden.

---

# Beispiele

## Marvel

Universe

↓

Marvel Cinematic Universe

Collections

↓

Iron Man

↓

Avengers

↓

Guardians of the Galaxy

↓

Captain America

---

## Wizarding World

Universe

↓

Wizarding World

Collections

↓

Harry Potter

↓

Fantastic Beasts

---

## MonsterVerse

Universe

↓

MonsterVerse

Collections

↓

Godzilla

↓

Kong

---

# Performance

Häufige Abfragen:

Alle Filme eines Universums

```sql
SELECT movie_id
FROM movie_universes
WHERE universe_id = ?
```

Alle Universen eines Films

```sql
SELECT universe_id
FROM movie_universes
WHERE movie_id = ?
```

Diese Abfragen werden durch Indizes optimiert.

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Offizieller Zeitstrahl
- Kanon-Status
- Alternative Universen
- Multiversen
- Timeline-Versionen
- Logos je Sprache
- Mehrsprachige Beschreibungen

---

# Hinweise

- Universes und Collections sind unterschiedliche Konzepte.
- Eine Collection beschreibt eine konkrete Filmreihe.
- Ein Universe beschreibt ein übergeordnetes Franchise oder eine gemeinsame Welt.
- Ein Universe kann mehrere Collections enthalten.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_UNIVERSES.md

Version: 2.0

Status: Official