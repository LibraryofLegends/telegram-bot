# TABLE_SPECIFICATION_MOVIE_RELEASE_DATES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_release_dates

---

# Zweck

Die Tabelle `movie_release_dates` speichert sämtliche Veröffentlichungen eines Films.

Ein Film kann beliebig viele Veröffentlichungstermine besitzen.

Beispiele:

- Kinostart
- Premiere
- Blu-ray
- DVD
- UHD Blu-ray
- Streaming
- TV-Ausstrahlung
- Digital Release

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

country_id

REFERENCES countries(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| country_id | INTEGER | Nein | - | Land |
| release_type | TEXT | Nein | Theatrical | Veröffentlichungsart |
| release_date | DATE | Nein | - | Veröffentlichungsdatum |
| certification_id | INTEGER | Ja | NULL | Altersfreigabe |
| distributor | TEXT | Ja | NULL | Vertrieb |
| edition | TEXT | Ja | NULL | Edition |
| notes | TEXT | Ja | NULL | Hinweise |
| is_premiere | INTEGER | Nein | 0 | Weltpremiere |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## country_id

Referenz auf das Veröffentlichungsland.

---

## release_type

Zulässige Werte

```text
Premiere

Theatrical

Streaming

Digital

Blu-ray

UHD Blu-ray

DVD

TV

Festival

Limited

Re-Release
```

---

## release_date

Offizielles Veröffentlichungsdatum.

---

## certification_id

Optionale Referenz auf die Altersfreigabe.

---

## distributor

Beispiele

```text
Warner Bros.

Universal Pictures

Disney

Netflix

Amazon MGM Studios
```

---

## edition

Beispiele

```text
Standard

Collector's Edition

Steelbook

Extended Cut

Director's Cut
```

---

## notes

Freitext für zusätzliche Informationen.

---

## is_premiere

```text
1 = Weltpremiere

0 = Normale Veröffentlichung
```

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

(movie_id,
country_id,
release_type,
release_date,
edition)
```

---

# Indizes

idx_movie_release_movie

idx_movie_release_country

idx_movie_release_type

idx_movie_release_date

idx_movie_release_premiere

idx_movie_release_active

---

# Check Constraints

is_premiere IN (0,1)

is_active IN (0,1)

---

# Beziehungen

movies

↓

movie_release_dates

↓

countries

↓

certifications

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

country_id

1

release_type

Theatrical

release_date

2025-07-17

certification_id

4

distributor

Warner Bros.

edition

Standard

notes

Deutschlandstart

is_premiere

0

is_active

1
```

---

# Beispiele

## Superman

USA

↓

Premiere

↓

08.07.2025

---

Deutschland

↓

Kinostart

↓

17.07.2025

---

Blu-ray

↓

20.11.2025

---

Streaming

↓

15.12.2025

---

# Business Rules

- Ein Film kann beliebig viele Veröffentlichungen besitzen.
- Veröffentlichungen sind länderabhängig.
- Mehrere Veröffentlichungsarten pro Land sind erlaubt.
- Weltpremieren werden separat gekennzeichnet.
- Alte Einträge werden archiviert statt gelöscht.

---

# Performance

Alle Veröffentlichungen eines Films

```sql
SELECT *
FROM movie_release_dates
WHERE movie_id = ?
ORDER BY release_date;
```

---

Alle Kinostarts

```sql
SELECT *
FROM movie_release_dates
WHERE release_type = 'Theatrical';
```

---

Alle Veröffentlichungen eines Landes

```sql
SELECT *
FROM movie_release_dates
WHERE country_id = ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- IMAX-Veröffentlichungen
- 3D-Versionen
- Dolby Cinema
- Event-Kinovorstellungen
- Region-Codes
- Vertriebsrechte
- Vorbestellungsdatum
- Veröffentlichungsstatus
- Verschobene Starttermine
- Internationale Festivalpremieren

---

# Hinweise

- Diese Tabelle speichert ausschließlich Veröffentlichungsinformationen.
- Der ursprüngliche Produktionszeitpunkt bleibt in `movies`.
- Veröffentlichungen können beliebig nach Land, Medium und Edition erweitert werden.
- Das Modell eignet sich gleichermaßen für Filme, Serien und andere Medientypen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_RELEASE_DATES.md

Version: 2.0

Status: Official