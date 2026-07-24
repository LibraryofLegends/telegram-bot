# TABLE_SPECIFICATION_MOVIE_LANGUAGES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_languages

---

# Zweck

Die Tabelle `movie_languages` verknüpft Filme mit Sprachen.

Sie speichert sowohl Originalsprachen als auch verfügbare Audiospuren und weitere Sprachtypen.

Ein Film kann beliebig viele Sprachversionen besitzen.

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

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| language_id | INTEGER | Nein | - | Sprache |
| language_type | TEXT | Nein | Audio | Sprachtyp |
| is_original | INTEGER | Nein | 0 | Originalsprache |
| is_default | INTEGER | Nein | 0 | Standardsprache |
| audio_format | TEXT | Ja | NULL | Audioformat |
| channels | TEXT | Ja | NULL | Audiokanäle |
| codec | TEXT | Ja | NULL | Audio-Codec |
| bitrate | INTEGER | Ja | NULL | Bitrate |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Referenz auf die Sprache.

---

## language_type

Art der Sprachspur.

Zulässige Werte:

```text
Original

Audio

Dub

Commentary

Audio Description

AI Dub
```

---

## is_original

Kennzeichnet die Originalsprache.

```text
1 = Originalsprache

0 = Nicht Original
```

---

## is_default

Standardmäßig ausgewählte Sprache.

```text
1 = Standard

0 = Optional
```

---

## audio_format

Audioformat.

Beispiele:

```text
Stereo

5.1

7.1

Dolby Atmos

DTS-HD MA

AAC
```

---

## channels

Audiokanäle.

Beispiele:

```text
2.0

5.1

7.1
```

---

## codec

Audio-Codec.

Beispiele:

```text
AAC

AC3

EAC3

DTS

TrueHD
```

---

## bitrate

Bitrate in kbit/s.

Beispiele:

```text
192

640

1536
```

---

# Unique Constraints

```text
UNIQUE

(movie_id,
language_id,
language_type)
```

---

# Indizes

idx_movie_languages_movie_id

idx_movie_languages_language_id

idx_movie_languages_type

idx_movie_languages_original

idx_movie_languages_default

---

# Check Constraints

is_original IN (0,1)

is_default IN (0,1)

bitrate >= 0

---

# Beziehungen

movies

↓

movie_languages

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

language_type

Audio

is_original

0

is_default

1

audio_format

Dolby Atmos

channels

7.1

codec

TrueHD

bitrate

4096
```

---

# Beispiele

## Avatar

Deutsch

↓

Audio

↓

Dolby Atmos

↓

7.1

---

Englisch

↓

Original

↓

Dolby Atmos

↓

7.1

---

Kommentarspur

↓

Englisch

↓

Commentary

---

# Business Rules

- Ein Film kann beliebig viele Sprachspuren besitzen.
- Pro Film darf nur eine Standardsprache (`is_default = 1`) existieren.
- Ein Film kann mehrere Originalsprachen besitzen (z. B. mehrsprachige Produktionen).
- Dieselbe Kombination aus Film, Sprache und Sprachtyp darf nur einmal existieren.

---

# Performance

Alle Audiosprachen

```sql
SELECT *
FROM movie_languages
WHERE movie_id = ?
ORDER BY is_default DESC;
```

---

Alle Filme mit deutscher Tonspur

```sql
SELECT movie_id
FROM movie_languages
WHERE language_id = ?
AND language_type = 'Audio';
```

---

Originalsprache eines Films

```sql
SELECT *
FROM movie_languages
WHERE movie_id = ?
AND is_original = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Mehrere Synchronfassungen
- Regionale Sprachvarianten
- KI-generierte Synchronisation
- Sprachqualität
- Veröffentlichungsdatum der Tonspur
- Studio der Synchronisation
- Sprecherlisten
- Barrierefreie Audiodeskription

---

# Hinweise

- Diese Tabelle speichert ausschließlich Sprachbeziehungen.
- Sprachinformationen werden zentral in `languages` gepflegt.
- Technische Audiodetails können später alternativ auf Dateiebene (`movie_files`) gespeichert werden, wenn unterschiedliche Dateien unterschiedliche Tonspuren besitzen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_LANGUAGES.md

Version: 2.0

Status: Official