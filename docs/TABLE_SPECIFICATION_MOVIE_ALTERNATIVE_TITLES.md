# TABLE_SPECIFICATION_MOVIE_ALTERNATIVE_TITLES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_alternative_titles

---

# Zweck

Die Tabelle `movie_alternative_titles` speichert sämtliche alternativen Titel eines Films.

Dazu gehören unter anderem:

- Originaltitel
- Deutscher Titel
- Englischer Titel
- Internationaler Titel
- Festivaltitel
- Arbeitstitel (Working Title)
- TV-Titel
- Vermarktungstitel

Ein Film kann beliebig viele alternative Titel besitzen.

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

country_id

REFERENCES countries(id)

ON UPDATE CASCADE

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Film |
| language_id | INTEGER | Ja | NULL | Sprache |
| country_id | INTEGER | Ja | NULL | Land |
| title | TEXT | Nein | - | Alternativer Titel |
| title_type | TEXT | Nein | Alternative | Titelart |
| is_official | INTEGER | Nein | 1 | Offizieller Titel |
| is_primary | INTEGER | Nein | 0 | Haupttitel |
| release_year | INTEGER | Ja | NULL | Veröffentlichungsjahr |
| notes | TEXT | Ja | NULL | Hinweise |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Sprache des Titels.

NULL bedeutet sprachneutral.

---

## country_id

Land, in dem dieser Titel verwendet wird.

---

## title

Alternativer Filmtitel.

---

## title_type

Zulässige Werte

```text
Original

Official

Alternative

International

Localized

Festival

Working Title

TV Title

Home Video

Marketing
```

---

## is_official

```text
1 = Offiziell

0 = Inoffiziell
```

---

## is_primary

```text
1 = Bevorzugter Titel

0 = Alternativer Titel
```

---

## release_year

Optionales Erscheinungsjahr dieses Titels.

---

## notes

Freitext für zusätzliche Informationen.

---

# Unique Constraints

```text
UNIQUE

(
movie_id,
language_id,
country_id,
title
)
```

---

# Indizes

idx_movie_alt_titles_movie

idx_movie_alt_titles_language

idx_movie_alt_titles_country

idx_movie_alt_titles_title

idx_movie_alt_titles_primary

---

# Check Constraints

is_official IN (0,1)

is_primary IN (0,1)

release_year >= 1888

---

# Beziehungen

movies

↓

movie_alternative_titles

↓

languages

↓

countries

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

language_id

1

country_id

1

title

Stirb Langsam

title_type

Localized

is_official

1

is_primary

1

release_year

1988
```

---

# Beispiele

## Die Hard

Original

↓

Die Hard

USA

---

Deutschland

↓

Stirb Langsam

---

Frankreich

↓

Piège de cristal

---

Arbeitstitel

↓

Simon Says

---

# Business Rules

- Ein Film kann unbegrenzt viele alternative Titel besitzen.
- Titel können sprach- und länderabhängig sein.
- Pro Sprache und Land sollte nur ein Haupttitel existieren.
- Originaltitel bleiben dauerhaft erhalten.
- Arbeitstitel dürfen zusätzlich gespeichert werden.

---

# Performance

Alle Titel eines Films

```sql
SELECT *
FROM movie_alternative_titles
WHERE movie_id = ?;
```

---

Deutscher Titel

```sql
SELECT *
FROM movie_alternative_titles
WHERE movie_id = ?
AND language_id = ?;
```

---

Originaltitel

```sql
SELECT *
FROM movie_alternative_titles
WHERE movie_id = ?
AND title_type = 'Original';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrsprachige Sortiertitel
- Aliasnamen
- Suchbegriffe
- Aussprachehilfen
- Phonetische Schreibweisen
- Unicode-Varianten
- Historische Titel
- Regionale Vermarktungstitel
- Automatische Übersetzungen
- KI-generierte Lokalisierungen

---

# Hinweise

- Diese Tabelle speichert ausschließlich alternative Filmtitel.
- Der Haupttitel des Films kann zusätzlich in `movies` gespeichert bleiben.
- Alle internationalen und historischen Titel werden hier zentral verwaltet.
- Das Modell kann unverändert auch für Serien, Bücher, Spiele und Musik verwendet werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_ALTERNATIVE_TITLES.md

Version: 2.0

Status: Official