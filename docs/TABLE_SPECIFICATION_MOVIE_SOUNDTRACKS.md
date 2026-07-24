# TABLE_SPECIFICATION_MOVIE_SOUNDTRACKS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_soundtracks

---

# Zweck

Die Tabelle `movie_soundtracks` speichert sämtliche Musikstücke eines Films.

Dazu gehören:

- Original Score
- Soundtrack
- Titelsong
- Abspannmusik
- Hintergrundmusik
- Lizenzierte Songs
- Theme Songs
- Konzertversionen

Ein Film kann unbegrenzt viele Musiktitel besitzen.

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

person_id

REFERENCES people(id)

ON UPDATE CASCADE

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| person_id | INTEGER | Ja | NULL | Komponist oder Künstler |
| title | TEXT | Nein | - | Titel des Musikstücks |
| soundtrack_type | TEXT | Nein | Song | Art des Musikstücks |
| performer | TEXT | Ja | NULL | Interpret |
| composer | TEXT | Ja | NULL | Komponist |
| album | TEXT | Ja | NULL | Album |
| duration | INTEGER | Ja | NULL | Laufzeit in Sekunden |
| track_number | INTEGER | Ja | NULL | Tracknummer |
| scene_description | TEXT | Ja | NULL | Verwendung im Film |
| language_id | INTEGER | Ja | NULL | Sprache |
| external_id | TEXT | Ja | NULL | Externe Musik-ID |
| source | TEXT | Ja | NULL | Herkunft |
| is_main_theme | INTEGER | Nein | 0 | Hauptthema |
| sort_order | INTEGER | Nein | 0 | Reihenfolge |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Zusätzliche Fremdschlüssel

language_id

REFERENCES languages(id)

ON UPDATE CASCADE

ON DELETE SET NULL

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## person_id

Optionaler Verweis auf den Komponisten oder Künstler.

---

## title

Titel des Musikstücks.

---

## soundtrack_type

Zulässige Werte

```text
Original Score

Song

Theme

Opening

Ending

Background

Trailer Music

Bonus Track

Unused Track
```

---

## performer

Interpret des Musikstücks.

---

## composer

Komponist.

---

## album

Albumname.

---

## duration

Laufzeit in Sekunden.

---

## track_number

Nummer auf dem Album.

---

## scene_description

Beschreibung der Filmszene.

Beispiele

```text
Eröffnung

Finalkampf

Abspann

Verfolgungsjagd

Romantische Szene
```

---

## language_id

Sprache des Songs.

NULL = Instrumental.

---

## external_id

Kennung bei externen Musikdiensten.

---

## source

Beispiele

```text
MusicBrainz

Spotify

Apple Music

Discogs

Library Of Legends
```

---

## is_main_theme

```text
1 = Hauptthema

0 = Standardtitel
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
title,
performer
)
```

---

# Indizes

idx_movie_soundtracks_movie

idx_movie_soundtracks_person

idx_movie_soundtracks_title

idx_movie_soundtracks_type

idx_movie_soundtracks_main

idx_movie_soundtracks_language

---

# Check Constraints

duration >= 0

track_number > 0

sort_order >= 0

is_main_theme IN (0,1)

---

# Beziehungen

movies

↓

movie_soundtracks

↓

people

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

person_id

15

title

Time

soundtrack_type

Original Score

performer

Hans Zimmer

composer

Hans Zimmer

album

Inception (Original Motion Picture Soundtrack)

duration

275

track_number

12

scene_description

Finale

language_id

NULL

source

MusicBrainz

is_main_theme

1
```

---

# Beispiele

## Interstellar

```text
Cornfield Chase

Mountains

No Time for Caution

S.T.A.Y.
```

---

## Titanic

```text
My Heart Will Go On

Hymn to the Sea
```

---

## Star Wars

```text
Main Title

Imperial March

Binary Sunset
```

---

# Business Rules

- Ein Film kann unbegrenzt viele Musikstücke besitzen.
- Instrumentale Stücke besitzen keine Sprache.
- Das Hauptthema kann besonders hervorgehoben werden.
- Mehrere Künstler pro Film sind möglich.
- Soundtrackdaten können automatisch importiert werden.

---

# Performance

Alle Musikstücke eines Films

```sql
SELECT *
FROM movie_soundtracks
WHERE movie_id = ?;
```

---

Alle Original Scores

```sql
SELECT *
FROM movie_soundtracks
WHERE soundtrack_type = 'Original Score';
```

---

Hauptthema

```sql
SELECT *
FROM movie_soundtracks
WHERE movie_id = ?
AND is_main_theme = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Spotify-Links
- Apple Music-Links
- YouTube Music
- ISRC-Codes
- Musikvideos
- Lyrics
- Dolby Atmos Music
- Mehrere Interpreten
- Verknüpfung mit eigener Musikdatenbank
- KI-Musikanalyse

---

# Hinweise

- Diese Tabelle speichert ausschließlich Musikinformationen.
- Komponisten können zusätzlich über `people` verwaltet werden.
- Das Modell eignet sich unverändert auch für Serien, Spiele und Dokumentationen.
- Die eigentlichen Audiodateien werden nicht gespeichert.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_SOUNDTRACKS.md

Version: 2.0

Status: Official