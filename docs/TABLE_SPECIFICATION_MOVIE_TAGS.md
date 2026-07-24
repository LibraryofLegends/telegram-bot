# TABLE_SPECIFICATION_MOVIE_TAGS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_tags

---

# Zweck

Die Tabelle `movie_tags` verbindet Filme mit Tags.

Dadurch kann ein Film beliebig viele Schlagwörter besitzen und ein Tag beliebig vielen Filmen zugeordnet werden.

Beispiele

- Zeitreise
- Cyberpunk
- Weihnachten
- Zombie
- Kaiju
- Roboter
- Kultfilm

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

tag_id

REFERENCES tags(id)

ON UPDATE CASCADE

ON DELETE CASCADE

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Film |
| tag_id | INTEGER | Nein | - | Tag |
| source | TEXT | Nein | Manual | Herkunft |
| weight | DECIMAL(4,2) | Nein | 1.00 | Relevanz |
| confidence | DECIMAL(5,2) | Ja | NULL | KI-Sicherheit |
| is_primary | INTEGER | Nein | 0 | Haupt-Tag |
| is_spoiler | INTEGER | Nein | 0 | Spoiler-Tag |
| notes | TEXT | Ja | NULL | Hinweise |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## tag_id

Referenz auf den Tag.

---

## source

Herkunft des Tags.

Zulässige Werte

```text
Manual

TMDb

IMDb

AI

Import

Community
```

---

## weight

Relevanz des Tags.

Beispiele

```text
1.00

0.95

0.75

0.40
```

---

## confidence

Vertrauenswert einer KI.

Beispiele

```text
99.80

94.25

88.10
```

---

## is_primary

```text
1 = Haupt-Tag

0 = Normal
```

---

## is_spoiler

```text
1 = Spoiler

0 = Kein Spoiler
```

---

## notes

Optionale Hinweise.

---

# Unique Constraints

```text
UNIQUE

(
movie_id,
tag_id
)
```

---

# Indizes

idx_movie_tags_movie

idx_movie_tags_tag

idx_movie_tags_source

idx_movie_tags_primary

idx_movie_tags_spoiler

idx_movie_tags_weight

---

# Check Constraints

weight >= 0

weight <= 1

confidence >= 0

confidence <= 100

is_primary IN (0,1)

is_spoiler IN (0,1)

---

# Beziehungen

movies

↓

movie_tags

↓

tags

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

tag_id

18

source

AI

weight

0.98

confidence

99.10

is_primary

1

is_spoiler

0

notes

Automatisch erkannt
```

---

# Beispiele

## Interstellar

↓

Weltraum

Zeitreise

Schwarzes Loch

NASA

Science Fiction

---

## Jurassic Park

↓

Dinosaurier

Insel

Abenteuer

Genetik

Katastrophe

---

## Avengers Endgame

↓

Superheld

Zeitreise

Marvel

Finale

Infinity Saga

Spoiler

---

# Business Rules

- Ein Film kann unbegrenzt viele Tags besitzen.
- Ein Tag kann unbegrenzt vielen Filmen zugeordnet werden.
- Dieselbe Kombination aus Film und Tag darf nur einmal existieren.
- KI-Tags können mit manuellen Tags kombiniert werden.
- Spoiler-Tags können im Frontend ausgeblendet werden.
- Relevante Tags können als Haupt-Tags markiert werden.

---

# Performance

Alle Tags eines Films

```sql
SELECT *
FROM movie_tags
WHERE movie_id = ?;
```

---

Alle Filme mit einem Tag

```sql
SELECT *
FROM movie_tags
WHERE tag_id = ?;
```

---

Alle Haupt-Tags

```sql
SELECT *
FROM movie_tags
WHERE movie_id = ?
AND is_primary = 1;
```

---

Alle KI-Tags

```sql
SELECT *
FROM movie_tags
WHERE source = 'AI';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Benutzer-Tags
- Community-Abstimmungen
- KI-Nachtraining
- Automatische Tag-Empfehlungen
- Tag-Historie
- Zeitlich begrenzte Tags
- Trending-Tags
- Tag-Gruppen
- Tag-Abhängigkeiten
- Negative Tags

---

# Hinweise

- Diese Tabelle speichert ausschließlich die Beziehung zwischen Filmen und Tags.
- Die eigentlichen Tags befinden sich in der Tabelle `tags`.
- Das Modell ist vollständig normalisiert.
- Es kann unverändert für Serien, Bücher, Spiele und Musik übernommen werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_TAGS.md

Version: 2.0

Status: Official