# TABLE_SPECIFICATION_TAGS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

tags

---

# Zweck

Die Tabelle `tags` speichert sämtliche frei definierbaren Schlagwörter.

Tags ergänzen Genres und ermöglichen eine deutlich detailliertere Beschreibung von Medien.

Beispiele:

- Zeitreise
- Cyberpunk
- Zombie
- Vampir
- Weihnachten
- Kultfilm
- Based on True Story
- Postapokalypse
- Weltraum
- Roboter
- Superheld
- Piraten
- Dinosaurier
- Kaiju

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| name | TEXT | Nein | - | Name des Tags |
| slug | TEXT | Nein | - | Technischer Name |
| description | TEXT | Ja | NULL | Beschreibung |
| category | TEXT | Ja | NULL | Tag-Kategorie |
| color | TEXT | Ja | NULL | Farbe |
| icon | TEXT | Ja | NULL | Icon |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## name

Anzeigename.

Beispiele

```text
Zeitreise

Cyberpunk

Superheld

Kaiju
```

---

## slug

Technischer Name.

Beispiele

```text
zeitreise

cyberpunk

superheld

kaiju
```

---

## description

Optionale Beschreibung.

---

## category

Gruppierung des Tags.

Beispiele

```text
Thema

Handlung

Figuren

Ort

Stimmung

Epoche

Technologie

Fantasy

Science Fiction

Horror
```

---

## color

Hex-Farbcode.

Beispiele

```text
#2196F3

#FF9800

#E91E63
```

---

## icon

Optionales Symbol.

Beispiele

```text
rocket

ghost

dragon

clock

film
```

---

## sort_order

Sortierreihenfolge.

---

## is_active

```text
1 = Aktiv

0 = Archiviert
```

---

# Unique Constraints

```text
UNIQUE

(name)

UNIQUE

(slug)
```

---

# Indizes

idx_tags_name

idx_tags_slug

idx_tags_category

idx_tags_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

---

# Beziehungen

tags

↓

movie_tags

↓

movies

---

Später zusätzlich

tags

↓

series_tags

↓

series

---

tags

↓

book_tags

↓

books

---

tags

↓

game_tags

↓

games

---

# Beispiel-Datensatz

```text
id

1

name

Zeitreise

slug

zeitreise

description

Filme mit Zeitreisen

category

Handlung

color

#2196F3

icon

clock

sort_order

10

is_active

1
```

---

# Beispiele

```text
Zombie

Vampir

Monster

Dinosaurier

Alien

Kaiju

Steampunk

Cyberpunk

Weltraum

Zeitreise

Paralleluniversum

Hexen

Magie

Roboter

KI

Superheld

Antiheld

Familie

Rache

Heist

Gefängnis

Apokalypse

Postapokalypse
```

---

# Business Rules

- Jeder Tag wird nur einmal angelegt.
- Tags dürfen beliebig vielen Filmen zugeordnet werden.
- Tags ergänzen Genres und ersetzen sie nicht.
- Tags können jederzeit erweitert werden.
- Archivierte Tags bleiben erhalten.

---

# Performance

Alle Tags

```sql
SELECT *
FROM tags
ORDER BY name;
```

---

Alle Horror-Tags

```sql
SELECT *
FROM tags
WHERE category = 'Horror';
```

---

Aktive Tags

```sql
SELECT *
FROM tags
WHERE is_active = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrsprachige Tags
- Synonyme
- Automatische KI-Verschlagwortung
- Tag-Gruppen
- Tag-Hierarchien
- Popularitätswert
- Trending-Tags
- Verwandte Tags
- Tag-Bilder
- Tag-Logos

---

# Hinweise

- Tags sind unabhängig vom Genresystem.
- Ein Medium kann unbegrenzt viele Tags besitzen.
- Das Modell ist universell für alle Medientypen nutzbar.
- Die eigentliche Zuordnung erfolgt über `movie_tags`.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_TAGS.md

Version: 2.0

Status: Official