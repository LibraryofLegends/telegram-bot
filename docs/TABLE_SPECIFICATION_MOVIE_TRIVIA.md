# TABLE_SPECIFICATION_MOVIE_TRIVIA.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_trivia

---

# Zweck

Die Tabelle `movie_trivia` speichert sämtliche Hintergrundinformationen zu einem Film.

Dazu gehören unter anderem:

- Wissenswertes
- Fun Facts
- Produktionsfakten
- Drehfehler
- Easter Eggs
- Zitate
- Rekorde
- Kontinuitätsfehler
- Cameo-Auftritte
- Hintergrundinformationen

Ein Film kann unbegrenzt viele Trivia-Einträge besitzen.

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

language_id

REFERENCES languages(id)

ON UPDATE CASCADE

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| language_id | INTEGER | Ja | NULL | Sprache |
| trivia_type | TEXT | Nein | Fact | Art des Eintrags |
| title | TEXT | Ja | NULL | Überschrift |
| content | TEXT | Nein | - | Inhalt |
| source | TEXT | Ja | NULL | Herkunft |
| source_url | TEXT | Ja | NULL | Quellenlink |
| importance | INTEGER | Nein | 3 | Priorität (1–5) |
| spoiler_level | TEXT | Nein | None | Spoilerstufe |
| verified | INTEGER | Nein | 0 | Verifiziert |
| is_featured | INTEGER | Nein | 0 | Hervorgehoben |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Sprache des Eintrags.

NULL = sprachneutral.

---

## trivia_type

Zulässige Werte

```text
Fact

Trivia

Goof

Quote

Easter Egg

Behind The Scenes

Production

Casting

Filming

Location

Reference

Deleted Scene

Record

Award Fact
```

---

## title

Optionale Überschrift.

---

## content

Der eigentliche Trivia-Eintrag.

---

## source

Beispiele

```text
IMDb

TMDb

Wikipedia

Library Of Legends

Interview

Blu-ray Bonusmaterial
```

---

## source_url

Optionaler Link zur Quelle.

---

## importance

Bewertung der Relevanz.

```text
1 = Niedrig

2 = Gering

3 = Normal

4 = Hoch

5 = Sehr hoch
```

---

## spoiler_level

Zulässige Werte

```text
None

Minor

Major
```

---

## verified

```text
1 = Verifiziert

0 = Nicht geprüft
```

---

## is_featured

```text
1 = Hervorgehoben

0 = Standard
```

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
content
)
```

---

# Indizes

idx_movie_trivia_movie

idx_movie_trivia_type

idx_movie_trivia_language

idx_movie_trivia_featured

idx_movie_trivia_verified

idx_movie_trivia_importance

---

# Check Constraints

importance BETWEEN 1 AND 5

verified IN (0,1)

is_featured IN (0,1)

sort_order >= 0

---

# Beziehungen

movies

↓

movie_trivia

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

language_id

1

trivia_type

Production

title

Fast echter Unfall

content

Während einer Actionszene kam es beinahe zu einem echten Unfall, der später im fertigen Film zu sehen ist.

source

IMDb

importance

5

spoiler_level

None

verified

1

is_featured

1
```

---

# Beispiele

## Produktionsfakt

```text
Für den Film wurden über 300 originale Requisiten gebaut.
```

---

## Easter Egg

```text
Im Hintergrund ist das Fahrzeug aus einem früheren Film des Regisseurs zu sehen.
```

---

## Zitat

```text
I'll be back.
```

---

## Drehfehler

```text
In einer Szene wechselt die Position der Kaffeetasse zwischen zwei Einstellungen.
```

---

# Business Rules

- Ein Film kann unbegrenzt viele Trivia-Einträge besitzen.
- Spoiler können unterschiedlich gekennzeichnet werden.
- Hervorgehobene Einträge werden zuerst angezeigt.
- Verifizierte Informationen werden bevorzugt dargestellt.
- Trivia-Einträge werden nicht gelöscht, sondern archiviert.

---

# Performance

Alle Trivia-Einträge

```sql
SELECT *
FROM movie_trivia
WHERE movie_id = ?;
```

---

Alle Produktionsfakten

```sql
SELECT *
FROM movie_trivia
WHERE trivia_type = 'Production';
```

---

Alle hervorgehobenen Einträge

```sql
SELECT *
FROM movie_trivia
WHERE movie_id = ?
AND is_featured = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Bilder zu Trivia
- Videos zu Trivia
- Zeitstempel im Film
- Benutzerbewertungen
- Kommentare
- KI-generierte Trivia
- Quellenbewertung
- Mehrsprachige Inhalte
- Community-Vorschläge
- Historische Änderungen

---

# Hinweise

- Diese Tabelle speichert ausschließlich Hintergrundinformationen.
- Spoiler können gezielt ausgeblendet werden.
- Das Modell eignet sich unverändert auch für Serien, Bücher und Spiele.
- Trivia kann sowohl redaktionell als auch automatisch importiert werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_TRIVIA.md

Version: 2.0

Status: Official