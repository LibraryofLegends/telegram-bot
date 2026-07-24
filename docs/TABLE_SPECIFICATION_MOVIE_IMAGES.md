# TABLE_SPECIFICATION_MOVIE_IMAGES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_images

---

# Zweck

Die Tabelle `movie_images` speichert sämtliche Bilder eines Films.

Ein Film kann beliebig viele Bilder besitzen.

Beispiele:

- Poster
- Backdrop
- Logo
- Banner
- Disc Art
- Thumbnail
- Screenshot
- Cover

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
| language_id | INTEGER | Ja | NULL | Sprache des Bildes |
| image_type | TEXT | Nein | Poster | Bildtyp |
| title | TEXT | Ja | NULL | Titel |
| file_name | TEXT | Ja | NULL | Dateiname |
| file_path | TEXT | Nein | - | Speicherort |
| width | INTEGER | Ja | NULL | Breite |
| height | INTEGER | Ja | NULL | Höhe |
| file_size | INTEGER | Ja | NULL | Dateigröße |
| mime_type | TEXT | Ja | NULL | MIME-Type |
| checksum | TEXT | Ja | NULL | SHA-256 |
| source | TEXT | Ja | NULL | Herkunft |
| is_primary | INTEGER | Nein | 0 | Hauptbild |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Sprache des Bildes.

Beispiele

```text
Deutsch

Englisch

Japanisch
```

NULL bedeutet sprachneutral.

---

## image_type

Zulässige Werte

```text
Poster

Backdrop

Banner

Logo

Cover

Disc

Thumbnail

Screenshot

Character

Fanart
```

---

## title

Optionaler Titel.

---

## file_name

Originaldateiname.

---

## file_path

Pfad oder URL.

---

## width

Bildbreite in Pixel.

---

## height

Bildhöhe in Pixel.

---

## file_size

Dateigröße in Byte.

---

## mime_type

Beispiele

```text
image/jpeg

image/png

image/webp

image/avif
```

---

## checksum

SHA-256 Prüfsumme.

---

## source

Beispiele

```text
TMDb

IMDb

FanArt.tv

Library Of Legends

Eigener Scan
```

---

## is_primary

```text
1 = Hauptbild

0 = Alternativ
```

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE

(movie_id,
image_type,
language_id,
checksum)
```

---

# Indizes

idx_movie_images_movie

idx_movie_images_type

idx_movie_images_language

idx_movie_images_primary

idx_movie_images_source

idx_movie_images_checksum

---

# Check Constraints

width > 0

height > 0

file_size >= 0

sort_order >= 0

is_primary IN (0,1)

---

# Beziehungen

movies

↓

movie_images

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

image_type

Poster

title

Deutsches Kinoposter

file_name

poster_de.jpg

file_path

/posters/avatar/de/poster.jpg

width

2000

height

3000

file_size

2847361

mime_type

image/jpeg

checksum

d5a71...

source

TMDb

is_primary

1

sort_order

1
```

---

# Business Rules

- Ein Film kann beliebig viele Bilder besitzen.
- Für jeden Bildtyp sollte nur ein Hauptbild existieren.
- Bilder dürfen mehrfach pro Sprache vorhanden sein.
- Prüfsummen verhindern doppelte Bilder.
- Bilder werden archiviert statt gelöscht.

---

# Performance

Alle Poster

```sql
SELECT *
FROM movie_images
WHERE movie_id = ?
AND image_type = 'Poster';
```

---

Alle Backdrops

```sql
SELECT *
FROM movie_images
WHERE movie_id = ?
AND image_type = 'Backdrop';
```

---

Hauptposter

```sql
SELECT *
FROM movie_images
WHERE movie_id = ?
AND image_type = 'Poster'
AND is_primary = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- KI-generierte Poster
- Mehrsprachige Logos
- Saisonale Cover
- HDR-Bilder
- Animierte Banner
- BlurHash
- Farbpalette
- Dominante Farben
- Gesichtserkennung
- OCR von Postern

---

# Hinweise

- Diese Tabelle speichert ausschließlich Bildinformationen.
- Mehrsprachige Poster werden über `language_id` unterschieden.
- Logos, Banner und Backdrops werden gemeinsam verwaltet.
- Screenshots können später automatisch aus Videodateien erzeugt werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_IMAGES.md

Version: 2.0

Status: Official