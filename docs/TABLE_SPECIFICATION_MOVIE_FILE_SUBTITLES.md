# TABLE_SPECIFICATION_MOVIE_FILE_SUBTITLES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_file_subtitles

---

# Zweck

Die Tabelle `movie_file_subtitles` speichert sämtliche Untertitelspuren einer Videodatei.

Eine Videodatei kann beliebig viele Untertitel besitzen.

Beispiele:

- Deutsch
- Englisch
- Forced
- SDH
- Commentary
- Signs & Songs

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Fremdschlüssel

movie_file_id

REFERENCES movie_files(id)

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
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_file_id | INTEGER | Nein | - | Zugehörige Videodatei |
| language_id | INTEGER | Nein | - | Sprache |
| track_number | INTEGER | Nein | 1 | Untertitelspur |
| title | TEXT | Ja | NULL | Titel |
| subtitle_format | TEXT | Nein | - | Untertitelformat |
| language_role | TEXT | Nein | Subtitle | Art des Untertitels |
| is_default | INTEGER | Nein | 0 | Standard |
| is_forced | INTEGER | Nein | 0 | Forced Subtitle |
| is_sdh | INTEGER | Nein | 0 | SDH |
| is_commentary | INTEGER | Nein | 0 | Kommentar |
| is_signs_only | INTEGER | Nein | 0 | Nur Schilder |
| delay_ms | INTEGER | Nein | 0 | Zeitversatz |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |

---

# Beschreibung der Spalten

## movie_file_id

Referenz auf die Videodatei.

---

## language_id

Referenz auf die Sprache.

---

## track_number

Nummer der Untertitelspur.

---

## title

Beispiele

```text
Deutsch

English

Deutsch Forced

English SDH

Signs & Songs
```

---

## subtitle_format

Zulässige Werte

```text
SRT

ASS

SSA

PGS

VobSub

WebVTT

TTML

SUP
```

---

## language_role

Zulässige Werte

```text
Subtitle

Forced

SDH

Signs

Commentary

Lyrics
```

---

## is_default

```text
1 = Standard

0 = Optional
```

---

## is_forced

```text
1 = Forced

0 = Normal
```

---

## is_sdh

```text
1 = SDH

0 = Normal
```

---

## is_commentary

```text
1 = Kommentar

0 = Normal
```

---

## is_signs_only

```text
1 = Nur Schilder

0 = Vollständige Untertitel
```

---

## delay_ms

Zeitversatz in Millisekunden.

---

# Unique Constraints

```text
UNIQUE

(movie_file_id,
track_number)
```

---

# Indizes

idx_subtitles_movie_file

idx_subtitles_language

idx_subtitles_format

idx_subtitles_default

idx_subtitles_forced

idx_subtitles_sdh

---

# Check Constraints

track_number > 0

delay_ms >= 0

is_default IN (0,1)

is_forced IN (0,1)

is_sdh IN (0,1)

is_commentary IN (0,1)

is_signs_only IN (0,1)

---

# Beziehungen

movie_files

↓

movie_file_subtitles

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_file_id

18

language_id

1

track_number

3

title

Deutsch Forced

subtitle_format

PGS

language_role

Forced

is_default

0

is_forced

1

is_sdh

0

is_commentary

0

is_signs_only

0

delay_ms

0
```

---

# Beispiele

## Avatar

Deutsch

↓

PGS

↓

Forced

---

Englisch

↓

SRT

↓

SDH

---

Japanisch

↓

ASS

↓

Standard

---

# Business Rules

- Eine Videodatei kann beliebig viele Untertitel besitzen.
- Jede Spur besitzt eine eindeutige Tracknummer.
- Pro Datei darf maximal ein Standarduntertitel existieren.
- Forced- und SDH-Untertitel werden separat gekennzeichnet.
- Untertitel gehören immer zu einer konkreten Datei.

---

# Performance

Alle Untertitel einer Datei

```sql
SELECT *
FROM movie_file_subtitles
WHERE movie_file_id = ?
ORDER BY track_number;
```

---

Alle deutschen Untertitel

```sql
SELECT *
FROM movie_file_subtitles
WHERE language_id = ?;
```

---

Alle Forced-Untertitel

```sql
SELECT *
FROM movie_file_subtitles
WHERE is_forced = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- OCR-Qualität
- Automatisch erzeugte Untertitel
- KI-Übersetzungen
- Mehrere SDH-Versionen
- Kapitelbezogene Untertitel
- Stilinformationen
- Schriftarten
- Positionierung
- Farbdefinitionen
- Animierte Untertitel

---

# Hinweise

- Diese Tabelle speichert ausschließlich Untertitel.
- Audiospuren werden separat in `movie_file_audio_tracks` gespeichert.
- Die Tabelle ist direkt an eine Videodatei gebunden und nicht an den Film.
- Unterstützt sowohl textbasierte als auch bildbasierte Untertitel.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_FILE_SUBTITLES.md

Version: 2.0

Status: Official