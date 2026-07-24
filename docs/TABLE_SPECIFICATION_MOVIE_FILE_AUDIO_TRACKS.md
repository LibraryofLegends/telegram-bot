# TABLE_SPECIFICATION_MOVIE_FILE_AUDIO_TRACKS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_file_audio_tracks

---

# Zweck

Die Tabelle `movie_file_audio_tracks` speichert sämtliche Audiospuren einer Videodatei.

Eine Videodatei kann beliebig viele Audiospuren besitzen.

Beispiele:

- Deutsch
- Englisch
- Japanisch
- Director Commentary
- Audio Description

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
| track_number | INTEGER | Nein | 1 | Audiospur |
| title | TEXT | Ja | NULL | Titel der Spur |
| codec | TEXT | Ja | NULL | Audio-Codec |
| channels | TEXT | Ja | NULL | Kanäle |
| sample_rate | INTEGER | Ja | NULL | Abtastrate |
| bit_depth | INTEGER | Ja | NULL | Bittiefe |
| bitrate | INTEGER | Ja | NULL | Bitrate |
| compression | TEXT | Ja | NULL | Komprimierung |
| language_role | TEXT | Nein | Audio | Art der Spur |
| is_default | INTEGER | Nein | 0 | Standardspur |
| is_forced | INTEGER | Nein | 0 | Erzwingbar |
| is_commentary | INTEGER | Nein | 0 | Kommentarspur |
| is_audio_description | INTEGER | Nein | 0 | Audiodeskription |
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

Interne Nummer der Tonspur.

---

## title

Titel der Audiospur.

Beispiele

```text
Deutsch

English

Dolby Atmos

Director Commentary
```

---

## codec

Beispiele

```text
AAC

AC3

EAC3

DTS

DTS-HD MA

TrueHD

FLAC
```

---

## channels

Beispiele

```text
1.0

2.0

5.1

7.1
```

---

## sample_rate

Beispiele

```text
44100

48000

96000
```

---

## bit_depth

Beispiele

```text
16

24
```

---

## bitrate

Bitrate in kbit/s.

---

## compression

Beispiele

```text
Lossy

Lossless
```

---

## language_role

Zulässige Werte

```text
Original

Dub

Audio

Commentary

Audio Description

AI Dub
```

---

## is_default

```text
1 = Standardspur

0 = Optional
```

---

## is_forced

```text
1 = Erzwingen

0 = Nein
```

---

## is_commentary

```text
1 = Kommentarspur

0 = Normal
```

---

## is_audio_description

```text
1 = Audiodeskription

0 = Normal
```

---

## delay_ms

Audio-Offset in Millisekunden.

---

# Unique Constraints

```text
UNIQUE

(movie_file_id,
track_number)
```

---

# Indizes

idx_audio_movie_file

idx_audio_language

idx_audio_codec

idx_audio_default

idx_audio_role

idx_audio_commentary

---

# Check Constraints

track_number > 0

bitrate >= 0

sample_rate >= 0

bit_depth >= 0

delay_ms >= 0

is_default IN (0,1)

is_forced IN (0,1)

is_commentary IN (0,1)

is_audio_description IN (0,1)

---

# Beziehungen

movie_files

↓

movie_file_audio_tracks

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

1

title

Deutsch Dolby Atmos

codec

TrueHD

channels

7.1

sample_rate

48000

bit_depth

24

bitrate

4096

compression

Lossless

language_role

Dub

is_default

1

is_forced

0

is_commentary

0

is_audio_description

0
```

---

# Business Rules

- Eine Videodatei kann beliebig viele Audiospuren besitzen.
- Pro Datei darf nur eine Standardspur vorhanden sein.
- Jede Spur besitzt eine eindeutige Tracknummer.
- Kommentarspuren werden separat gekennzeichnet.
- Audiodeskriptionen werden separat gekennzeichnet.

---

# Performance

Alle Audiospuren einer Datei

```sql
SELECT *
FROM movie_file_audio_tracks
WHERE movie_file_id = ?
ORDER BY track_number;
```

---

Alle deutschen Tonspuren

```sql
SELECT *
FROM movie_file_audio_tracks
WHERE language_id = ?;
```

---

Alle Dolby-Atmos-Spuren

```sql
SELECT *
FROM movie_file_audio_tracks
WHERE codec = 'TrueHD'
AND channels = '7.1';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Atmos-Metadaten
- DTS:X
- Mehrere Kommentarspuren
- KI-generierte Synchronisation
- Sprecherinformationen
- Lautstärkeanalyse
- Dynamikbereich
- Kanalbelegung
- Sprachqualität

---

# Hinweise

- Die Tabelle speichert ausschließlich Audiospuren.
- Untertitel werden in einer separaten Tabelle verwaltet.
- Die Tabelle ist direkt an eine konkrete Videodatei gebunden und nicht an den Film selbst.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_FILE_AUDIO_TRACKS.md

Version: 2.0

Status: Official