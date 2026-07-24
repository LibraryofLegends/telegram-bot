# TABLE_SPECIFICATION_MOVIE_UNIVERSES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_universes

---

# Zweck

Die Tabelle `movie_universes` verknüpft Filme mit einem oder mehreren Universen.

Ein Film kann mehreren Universen angehören und ein Universum kann beliebig viele Filme enthalten.

Beispiele:

Iron Man

↓

Marvel Cinematic Universe

---

Batman Begins

↓

DC Universe

---

Alien vs. Predator

↓

Alien Universe

↓

Predator Universe

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

universe_id

REFERENCES universes(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| universe_id | INTEGER | Nein | - | Zugehöriges Universum |
| timeline_order | INTEGER | Ja | NULL | Reihenfolge innerhalb der Timeline |
| universe_phase | TEXT | Ja | NULL | Phase oder Abschnitt |
| is_canon | INTEGER | Nein | 1 | Kanonstatus |
| is_primary | INTEGER | Nein | 1 | Hauptuniversum |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf einen Film.

---

## universe_id

Referenz auf ein Universum.

---

## timeline_order

Chronologische Reihenfolge innerhalb des Universums.

Beispiel:

```text
1

2

3

...
```

---

## universe_phase

Optionale Phase oder Story-Abschnitt.

Beispiele:

```text
Phase 1

Phase 2

Infinity Saga

Multiverse Saga

Chapter One

Season One
```

---

## is_canon

Kennzeichnet den offiziellen Kanon.

```text
1 = Kanon

0 = Nicht Kanon
```

---

## is_primary

Kennzeichnet das Hauptuniversum.

```text
1 = Hauptuniversum

0 = Zusätzliches Universum
```

---

## created_at

Zeitpunkt der Erstellung.

---

# Unique Constraints

Ein Film darf einem Universum nur einmal zugeordnet werden.

```text
UNIQUE

(movie_id, universe_id)
```

---

# Indizes

idx_movie_universes_movie_id

idx_movie_universes_universe_id

idx_movie_universes_primary

idx_movie_universes_canon

idx_movie_universes_timeline

---

# Check Constraints

timeline_order > 0

is_primary IN (0,1)

is_canon IN (0,1)

---

# Beziehungen

movies

↓

movie_universes

↓

universes

---

# Beispiel-Datensatz

```text
id

1

movie_id

25

universe_id

2

timeline_order

17

universe_phase

Infinity Saga

is_canon

1

is_primary

1

created_at

2026-07-24 20:30:00
```

---

# Beispiele

## Avengers: Endgame

Universum:

Marvel Cinematic Universe

Timeline:

23

Phase:

Infinity Saga

---

## Alien vs. Predator

Universen:

Alien Universe

Predator Universe

---

## Spider-Man: No Way Home

Universum:

Marvel Cinematic Universe

Phase:

Multiverse Saga

---

# Business Rules

- Ein Film kann mehreren Universen angehören.
- Ein Universum kann beliebig viele Filme enthalten.
- Dieselbe Kombination aus Film und Universum darf nur einmal existieren.
- Pro Film sollte höchstens ein Hauptuniversum definiert werden.
- Kanon und Nicht-Kanon können parallel gepflegt werden.

---

# Performance

Standardabfragen:

Alle Filme eines Universums

```sql
SELECT movie_id
FROM movie_universes
WHERE universe_id = ?
ORDER BY timeline_order;
```

---

Alle Universen eines Films

```sql
SELECT universe_id
FROM movie_universes
WHERE movie_id = ?;
```

---

Alle Kanon-Filme

```sql
SELECT movie_id
FROM movie_universes
WHERE universe_id = ?
AND is_canon = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Alternative Timelines
- Multiversen
- Story-Arcs
- Kapitel
- Ereignisse
- Reboots
- Elseworlds
- Variant-Versionen
- Universumsübergreifende Ereignisse

---

# Hinweise

- Die Tabelle speichert ausschließlich Beziehungen.
- Namen oder Beschreibungen werden niemals redundant gespeichert.
- Timeline und Phase sind optionale Zusatzinformationen.
- Durch die Trennung von `collections` und `universes` können auch komplexe Franchise-Strukturen sauber modelliert werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_UNIVERSES.md

Version: 2.0

Status: Official