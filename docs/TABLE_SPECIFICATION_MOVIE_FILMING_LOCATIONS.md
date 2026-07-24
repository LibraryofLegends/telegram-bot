# TABLE_SPECIFICATION_MOVIE_FILMING_LOCATIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_filming_locations

---

# Zweck

Die Tabelle `movie_filming_locations` speichert sämtliche Drehorte eines Films.

Sie dient zur Verwaltung von:

- Drehorten
- Studios
- Städten
- Bundesländern
- Ländern
- GPS-Koordinaten
- Drehzeiträumen
- Szenenzuordnungen
- Produktionsinformationen

Ein Film kann beliebig viele Drehorte besitzen.

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

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| country_id | INTEGER | Ja | NULL | Land |
| studio_id | INTEGER | Ja | NULL | Filmstudio |
| location_name | TEXT | Nein | - | Name des Drehorts |
| city | TEXT | Ja | NULL | Stadt |
| region | TEXT | Ja | NULL | Bundesland/Region |
| address | TEXT | Ja | NULL | Adresse |
| latitude | DECIMAL(10,7) | Ja | NULL | Breitengrad |
| longitude | DECIMAL(10,7) | Ja | NULL | Längengrad |
| filming_start | DATE | Ja | NULL | Drehbeginn |
| filming_end | DATE | Ja | NULL | Drehende |
| scene_description | TEXT | Ja | NULL | Gedrehte Szene |
| is_studio | INTEGER | Nein | 0 | Studiodreh |
| is_real_location | INTEGER | Nein | 1 | Echter Drehort |
| source | TEXT | Ja | NULL | Herkunft |
| notes | TEXT | Ja | NULL | Hinweise |
| sort_order | INTEGER | Nein | 0 | Reihenfolge |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Zusätzliche Fremdschlüssel

studio_id

REFERENCES studios(id)

ON UPDATE CASCADE

ON DELETE SET NULL

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## country_id

Land des Drehortes.

---

## studio_id

Optionales Filmstudio.

---

## location_name

Name des Drehortes.

Beispiele

```text
Warner Bros. Studios

Central Park

Mount Cook

Skellig Michael

Pinewood Studios
```

---

## city

Beispiele

```text
Los Angeles

London

Wellington

Berlin

New York
```

---

## region

Bundesland oder Region.

---

## address

Optionale vollständige Adresse.

---

## latitude

GPS-Breitengrad.

---

## longitude

GPS-Längengrad.

---

## filming_start

Beginn der Dreharbeiten.

---

## filming_end

Ende der Dreharbeiten.

---

## scene_description

Beispiele

```text
Finalkampf

Eröffnungsszene

Schloss

Autoverfolgung

Wüstenszene
```

---

## is_studio

```text
1 = Studiodreh

0 = Außendreh
```

---

## is_real_location

```text
1 = Echter Ort

0 = Kulisse
```

---

## source

Beispiele

```text
IMDb

TMDb

Wikipedia

Studio

Library Of Legends
```

---

## notes

Freitext.

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
location_name,
city
)
```

---

# Indizes

idx_movie_locations_movie

idx_movie_locations_country

idx_movie_locations_studio

idx_movie_locations_city

idx_movie_locations_real

---

# Check Constraints

latitude BETWEEN -90 AND 90

longitude BETWEEN -180 AND 180

filming_end >= filming_start

is_studio IN (0,1)

is_real_location IN (0,1)

sort_order >= 0

---

# Beziehungen

movies

↓

movie_filming_locations

↓

countries

↓

studios

---

# Beispiel-Datensatz

```text
id

1

movie_id

18

country_id

2

studio_id

5

location_name

Skellig Michael

city

County Kerry

region

Munster

latitude

51.7711000

longitude

-10.5409000

filming_start

2014-05-01

filming_end

2014-05-20

scene_description

Luke Skywalker Exil

is_studio

0

is_real_location

1

source

IMDb
```

---

# Beispiele

## Herr der Ringe

```text
Mount Cook

Neuseeland
```

---

## Harry Potter

```text
Leavesden Studios
```

---

## Star Wars

```text
Skellig Michael
```

---

## Jurassic Park

```text
Kauaʻi

Hawaii
```

---

# Business Rules

- Ein Film kann beliebig viele Drehorte besitzen.
- Studio- und Außendrehs werden getrennt verwaltet.
- GPS-Koordinaten sind optional.
- Mehrere Szenen können demselben Drehort zugeordnet werden.
- Historische Drehorte bleiben erhalten.

---

# Performance

Alle Drehorte eines Films

```sql
SELECT *
FROM movie_filming_locations
WHERE movie_id = ?;
```

---

Alle Außendrehs

```sql
SELECT *
FROM movie_filming_locations
WHERE is_studio = 0;
```

---

Alle Drehorte eines Landes

```sql
SELECT *
FROM movie_filming_locations
WHERE country_id = ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Bilder der Drehorte
- Kartenansicht
- Street View
- Drohnenaufnahmen
- Besucherinformationen
- Drehgenehmigungen
- Verknüpfung mit Filmszenen
- Reiseinformationen
- KI-Kartenerkennung
- Interaktive Drehortkarten

---

# Hinweise

- Diese Tabelle speichert ausschließlich Drehorte.
- Filmstudios können zusätzlich in `studios` gepflegt werden.
- GPS-Daten ermöglichen spätere Kartenfunktionen.
- Das Modell kann unverändert für Serien, Dokumentationen und andere Medien genutzt werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_FILMING_LOCATIONS.md

Version: 2.0

Status: Official