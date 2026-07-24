# TABLE_SPECIFICATION_MOVIE_FILES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_files

---

# Zweck

Die Tabelle `movie_files` speichert alle technischen Informationen zu den Videodateien eines Films.

Ein Film kann beliebig viele Dateien besitzen.

Beispiele:

- Blu-ray
- UHD Blu-ray
- WEB-DL
- WEBRip
- REMUX
- DVD
- Director's Cut
- Extended Edition

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

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| filename | TEXT | Nein | - | Originaler Dateiname |
| file_size | INTEGER | Nein | 0 | Dateigröße in Byte |
| duration | INTEGER | Ja | NULL | Laufzeit in Sekunden |
| container | TEXT | Nein | MKV | Dateicontainer |
| source | TEXT | Nein | - | Quelle |
| resolution | TEXT | Nein | - | Videoauflösung |
| video_codec | TEXT | Ja | NULL | Video-Codec |
| audio_codec | TEXT | Ja | NULL | Audio-Codec |
| hdr_format | TEXT | Ja | NULL | HDR-Format |
| frame_rate | REAL | Ja | NULL | Bildrate |
| bitrate | INTEGER | Ja | NULL | Gesamtbitrate |
| telegram_file_id | TEXT | Ja | NULL | Telegram File-ID |
| telegram_unique_id | TEXT | Ja | NULL | Telegram Unique File-ID |
| telegram_message_id | INTEGER | Ja | NULL | Telegram Nachrichten-ID |
| telegram_chat_id | INTEGER | Ja | NULL | Telegram Chat-ID |
| file_hash | TEXT | Ja | NULL | SHA-256 Prüfsumme |
| is_default | INTEGER | Nein | 0 | Standarddatei |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## filename

Originaler Dateiname.

---

## file_size

Dateigröße in Byte.

---

## duration

Videolaufzeit in Sekunden.

---

## container

Dateicontainer.

Beispiele

```text
MKV
MP4
AVI
MOV
```

---

## source

Quelle der Datei.

```text
BluRay

UHD BluRay

WEB-DL

WEBRip

DVD

HDTV

REMUX
```

---

## resolution

Videoauflösung.

```text
480p

720p

1080p

1440p

2160p

4320p
```

---

## video_codec

Beispiele

```text
H.264

H.265

HEVC

AV1

VP9
```

---

## audio_codec

Beispiele

```text
AAC

AC3

EAC3

DTS

TrueHD
```

---

## hdr_format

Beispiele

```text
HDR10

HDR10+

Dolby Vision

HLG

SDR
```

---

## frame_rate

Beispiele

```text
23.976

24

25

29.97

60
```

---

## bitrate

Gesamtbitrate in kbit/s.

---

## telegram_file_id

Telegram File-ID.

---

## telegram_unique_id

Telegram Unique File-ID.

---

## telegram_message_id

Nachrichten-ID.

---

## telegram_chat_id

Chat-ID.

---

## file_hash

SHA-256 Hash.

Zur Erkennung doppelter Dateien.

---

## is_default

```text
1 = Standardversion

0 = Alternative Version
```

---

## is_active

```text
1 = Aktiv

0 = Archiviert
```

---

# Unique Constraints

telegram_unique_id

file_hash

---

# Indizes

idx_movie_files_movie

idx_movie_files_source

idx_movie_files_resolution

idx_movie_files_default

idx_movie_files_hash

idx_movie_files_active

---

# Check Constraints

file_size >= 0

duration >= 0

bitrate >= 0

frame_rate >= 0

is_default IN (0,1)

is_active IN (0,1)

---

# Beziehungen

movies

↓

movie_files

---

movie_files

↓

movie_languages

---

movie_files

↓

movie_subtitles

---

# Beispiel-Datensatz

```text
id

1

movie_id

250

filename

Avatar.2009.2160p.UHD.BluRay.REMUX.mkv

file_size

85263745024

duration

9720

container

MKV

source

REMUX

resolution

2160p

video_codec

HEVC

audio_codec

TrueHD

hdr_format

Dolby Vision

frame_rate

23.976

bitrate

68000

telegram_file_id

BAACAgQAAx...

telegram_unique_id

AgADxxxxxx

is_default

1

is_active

1
```

---

# Business Rules

- Ein Film kann beliebig viele Dateien besitzen.
- Pro Film darf nur eine Standarddatei existieren.
- Telegram-Dateien dürfen nicht doppelt gespeichert werden.
- Prüfsummen dienen der Dublettenerkennung.
- Dateien werden archiviert statt gelöscht.

---

# Performance

Alle Dateien eines Films

```sql
SELECT *
FROM movie_files
WHERE movie_id = ?
ORDER BY is_default DESC;
```

---

Alle 4K-Versionen

```sql
SELECT *
FROM movie_files
WHERE resolution = '2160p';
```

---

Alle REMUX-Versionen

```sql
SELECT *
FROM movie_files
WHERE source = 'REMUX';
```

---

Dublettenprüfung

```sql
SELECT *
FROM movie_files
WHERE file_hash = ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- CRC32
- MD5
- SHA-1
- MediaInfo-JSON
- HDR-Metadaten
- Dolby Vision Profile
- Kapitelinformationen
- Mehrere Speicherorte
- Cloud-Synchronisation
- Dateiversionen
- Automatische Qualitätsbewertung

---

# Hinweise

- Diese Tabelle enthält ausschließlich technische Dateiinformationen.
- Inhaltliche Metadaten verbleiben in `movies`.
- Ein Film kann mehrere technische Versionen besitzen.
- Die Tabelle bildet die Grundlage für den Telegram-Importer und die automatische Medienerkennung.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_FILES.md

Version: 2.0

Status: Official