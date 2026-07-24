# TABLE_SPECIFICATION_MOVIE_VIDEOS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_videos

---

# Zweck

Die Tabelle `movie_videos` speichert sämtliche Zusatzvideos eines Films.

Dazu gehören unter anderem:

- Trailer
- Teaser
- TV Spot
- Clip
- Featurette
- Behind the Scenes
- Making Of
- Interview
- Deleted Scene
- Bloopers

Ein Film kann beliebig viele Videos besitzen.

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
| video_type | TEXT | Nein | Trailer | Videotyp |
| title | TEXT | Nein | - | Titel |
| description | TEXT | Ja | NULL | Beschreibung |
| provider | TEXT | Ja | NULL | Plattform |
| video_key | TEXT | Ja | NULL | Externe Video-ID |
| url | TEXT | Ja | NULL | Video-URL |
| duration | INTEGER | Ja | NULL | Laufzeit in Sekunden |
| resolution | TEXT | Ja | NULL | Auflösung |
| published_at | DATETIME | Ja | NULL | Veröffentlichung |
| official | INTEGER | Nein | 1 | Offiziell |
| featured | INTEGER | Nein | 0 | Hervorgehoben |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Sprache des Videos.

NULL bedeutet sprachneutral.

---

## video_type

Zulässige Werte

```text
Trailer

Teaser

Clip

TV Spot

Featurette

Behind The Scenes

Making Of

Interview

Deleted Scene

Bloopers

Announcement
```

---

## provider

Beispiele

```text
YouTube

Vimeo

TMDb

IMDb

Apple

Netflix
```

---

## video_key

Externe Video-ID.

Beispiel

```text
dQw4w9WgXcQ
```

---

## url

Direkter Link.

---

## duration

Videolaufzeit in Sekunden.

---

## resolution

Beispiele

```text
720p

1080p

1440p

2160p
```

---

## official

```text
1 = Offiziell

0 = Fan Upload
```

---

## featured

```text
1 = Hervorgehoben

0 = Normal
```

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE

(provider,
video_key)
```

---

# Indizes

idx_movie_videos_movie

idx_movie_videos_type

idx_movie_videos_language

idx_movie_videos_provider

idx_movie_videos_featured

idx_movie_videos_official

---

# Check Constraints

duration >= 0

sort_order >= 0

official IN (0,1)

featured IN (0,1)

---

# Beziehungen

movies

↓

movie_videos

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

2

video_type

Trailer

title

Official Trailer

provider

YouTube

video_key

5PSNL1qE6VY

url

https://youtube.com/watch?v=5PSNL1qE6VY

duration

152

resolution

1080p

official

1

featured

1
```

---

# Business Rules

- Ein Film kann beliebig viele Videos besitzen.
- Videos dürfen mehrfach vorhanden sein, solange sie unterschiedliche Quellen besitzen.
- Offizielle Trailer sollen bevorzugt angezeigt werden.
- Hervorgehobene Videos erscheinen zuerst.

---

# Performance

Alle Trailer

```sql
SELECT *
FROM movie_videos
WHERE movie_id = ?
AND video_type = 'Trailer';
```

---

Alle offiziellen Videos

```sql
SELECT *
FROM movie_videos
WHERE movie_id = ?
AND official = 1;
```

---

Haupttrailer

```sql
SELECT *
FROM movie_videos
WHERE movie_id = ?
AND featured = 1
LIMIT 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrere Videoquellen
- Automatische Trailer-Erkennung
- Vorschaubilder
- Untertitel
- Altersbeschränkungen
- Kapitelmarken
- Streaming-Qualitäten
- Downloadoptionen
- Lokalisierte Trailer
- Livestreams

---

# Hinweise

- Diese Tabelle speichert ausschließlich Zusatzvideos.
- Die eigentlichen Filmdateien befinden sich in `movie_files`.
- Trailer und Bonusmaterial werden getrennt von den Hauptmedien verwaltet.
- Videos können sowohl lokal als auch extern (z. B. YouTube) referenziert werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_VIDEOS.md

Version: 2.0

Status: Official