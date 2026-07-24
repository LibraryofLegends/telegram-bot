# TABLE_SPECIFICATION_STUDIOS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

studios

---

# Zweck

Die Tabelle `studios` speichert sämtliche Filmstudios, Produktionsfirmen, Vertriebsunternehmen und Streaming-Studios.

Ein Studio kann an beliebig vielen Medien beteiligt sein.

Beispiele:

- Warner Bros.
- Universal Pictures
- Paramount Pictures
- Walt Disney Pictures
- Marvel Studios
- Pixar Animation Studios
- DreamWorks Animation
- Netflix
- Amazon MGM Studios
- Apple Studios

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
| name | TEXT | Nein | - | Offizieller Name |
| original_name | TEXT | Ja | NULL | Originalname |
| slug | TEXT | Nein | - | Technischer Name |
| company_type | TEXT | Nein | Production | Unternehmensart |
| founded_year | INTEGER | Ja | NULL | Gründungsjahr |
| country | TEXT | Ja | NULL | Herkunftsland |
| headquarters | TEXT | Ja | NULL | Hauptsitz |
| website | TEXT | Ja | NULL | Offizielle Website |
| logo_path | TEXT | Ja | NULL | Logo |
| description | TEXT | Ja | NULL | Kurzbeschreibung |
| tmdb_company_id | INTEGER | Ja | NULL | TMDb Company ID |
| imdb_company_id | TEXT | Ja | NULL | IMDb Company ID |
| is_active | INTEGER | Nein | 1 | Aktiv |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## name

Offizieller Firmenname.

Beispiel:

```text
Warner Bros.
```

---

## original_name

Originalbezeichnung.

---

## slug

Technischer eindeutiger Name.

Beispiele:

```text
warner-bros

marvel-studios

pixar
```

---

## company_type

Art des Unternehmens.

Mögliche Werte:

```text
Production

Distribution

Animation

Streaming

Television

Independent
```

---

## founded_year

Gründungsjahr.

Beispiel:

```text
1923
```

---

## country

Herkunftsland.

Beispiel:

```text
USA
```

---

## headquarters

Hauptsitz.

Beispiel:

```text
Burbank, California
```

---

## website

Offizielle Webseite.

---

## logo_path

Pfad oder URL zum Firmenlogo.

---

## description

Kurzbeschreibung.

---

## tmdb_company_id

Offizielle Unternehmens-ID von TMDb.

---

## imdb_company_id

IMDb-Unternehmens-ID.

---

## is_active

Status.

```text
1 = Aktiv

0 = Archiviert
```

---

## sort_order

Sortierreihenfolge.

Standard:

```text
0
```

---

# Unique Constraints

slug

tmdb_company_id

imdb_company_id

---

# Indizes

idx_studios_name

idx_studios_slug

idx_studios_country

idx_studios_company_type

idx_studios_tmdb

idx_studios_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

founded_year >= 1800

---

# Beziehungen

studios

↓

movie_studios

↓

movies

---

Später zusätzlich:

studios

↓

series_studios

↓

series

---

studios

↓

game_studios

↓

games

---

# Beispiel-Datensatz

```text
id

5

name

Marvel Studios

slug

marvel-studios

company_type

Production

founded_year

1993

country

USA

headquarters

Burbank, California

tmdb_company_id

420

is_active

1
```

---

# Business Rules

- Ein Studio wird nur einmal gespeichert.
- Ein Film kann mehrere Studios besitzen.
- Ein Studio kann an beliebig vielen Filmen beteiligt sein.
- Studios werden grundsätzlich nicht gelöscht.
- Stattdessen werden sie archiviert.

---

# Performance

Studio anhand der TMDb-ID

```sql
SELECT *
FROM studios
WHERE tmdb_company_id = ?;
```

---

Alle Studios eines Landes

```sql
SELECT *
FROM studios
WHERE country = ?;
```

---

Suche nach Name

```sql
SELECT *
FROM studios
WHERE name LIKE ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Muttergesellschaft
- Tochterunternehmen
- Studio-Logos nach Sprache
- Historische Firmennamen
- Fusionen
- Übernahmen
- Offizielle Social-Media-Kanäle
- Unternehmensgeschichte

---

# Hinweise

- Diese Tabelle speichert ausschließlich Stammdaten.
- Die Zuordnung eines Studios zu einem Film erfolgt über die Tabelle `movie_studios`.
- Produktionsfirmen, Vertriebsfirmen und Streaming-Anbieter können gemeinsam verwaltet werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_STUDIOS.md

Version: 2.0

Status: Official