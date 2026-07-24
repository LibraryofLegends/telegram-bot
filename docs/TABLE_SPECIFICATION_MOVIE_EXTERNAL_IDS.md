# TABLE_SPECIFICATION_MOVIE_EXTERNAL_IDS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_external_ids

---

# Zweck

Die Tabelle `movie_external_ids` verwaltet sämtliche externen Identifikationen eines Films.

Sie dient zur Verknüpfung mit externen Plattformen und Datenquellen.

Beispiele

- IMDb
- TMDb
- TVDb
- OMDb
- Trakt
- Letterboxd
- Wikidata
- FanArt.tv
- Rotten Tomatoes
- Metacritic

Ein Film kann beliebig viele externe IDs besitzen.

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
| provider | TEXT | Nein | - | Externer Anbieter |
| external_id | TEXT | Nein | - | Externe Kennung |
| external_url | TEXT | Ja | NULL | Profil- oder Detailseite |
| api_url | TEXT | Ja | NULL | API-Endpunkt |
| provider_type | TEXT | Nein | Movie | Medientyp |
| is_primary | INTEGER | Nein | 0 | Primäre Verknüpfung |
| is_verified | INTEGER | Nein | 0 | Verifiziert |
| last_synced_at | DATETIME | Ja | NULL | Letzte Synchronisation |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## provider

Externer Anbieter.

Beispiele

```text
IMDb

TMDb

TVDb

OMDb

Trakt

Letterboxd

Rotten Tomatoes

Metacritic

Wikidata

FanArt.tv
```

---

## external_id

Kennung beim jeweiligen Anbieter.

Beispiele

```text
tt1375666

27205

603
```

---

## external_url

Öffentliche Detailseite.

Beispiele

```text
https://www.imdb.com/title/tt1375666

https://www.themoviedb.org/movie/27205
```

---

## api_url

Optionaler API-Endpunkt.

---

## provider_type

Zulässige Werte

```text
Movie

Collection

Universe
```

---

## is_primary

```text
1 = Primäre Referenz

0 = Normale Referenz
```

---

## is_verified

```text
1 = Verifiziert

0 = Nicht geprüft
```

---

## last_synced_at

Zeitpunkt der letzten erfolgreichen Synchronisation.

---

# Unique Constraints

```text
UNIQUE

(provider,
external_id)

UNIQUE

(movie_id,
provider)
```

---

# Indizes

idx_movie_external_ids_movie

idx_movie_external_ids_provider

idx_movie_external_ids_external_id

idx_movie_external_ids_verified

idx_movie_external_ids_primary

---

# Check Constraints

is_primary IN (0,1)

is_verified IN (0,1)

---

# Beziehungen

movies

↓

movie_external_ids

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

provider

IMDb

external_id

tt1375666

external_url

https://www.imdb.com/title/tt1375666

provider_type

Movie

is_primary

1

is_verified

1

last_synced_at

2026-07-25 12:30:15
```

---

# Beispiele

## Inception

IMDb

↓

tt1375666

---

TMDb

↓

27205

---

Trakt

↓

inception-2010

---

Letterboxd

↓

inception

---

Wikidata

↓

Q43361

---

# Business Rules

- Ein Film kann beliebig viele externe IDs besitzen.
- Jeder Anbieter darf pro Film nur einmal vorkommen.
- Dieselbe externe Kennung darf nicht mehreren Filmen zugeordnet werden.
- Synchronisationszeitpunkte werden gespeichert.
- Verifizierte Einträge werden bevorzugt verwendet.

---

# Performance

IMDb-ID eines Films

```sql
SELECT *
FROM movie_external_ids
WHERE movie_id = ?
AND provider = 'IMDb';
```

---

Alle externen IDs

```sql
SELECT *
FROM movie_external_ids
WHERE movie_id = ?;
```

---

Nicht verifizierte Einträge

```sql
SELECT *
FROM movie_external_ids
WHERE is_verified = 0;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrere IDs pro Anbieter
- API-Versionen
- Synchronisationsprotokolle
- Automatische Konflikterkennung
- OAuth-Authentifizierung
- Webhook-Unterstützung
- Externe Bewertungen
- Externe Bilder
- Externe Trailer
- Delta-Synchronisation

---

# Hinweise

- Diese Tabelle speichert ausschließlich externe Referenzen.
- Alle Synchronisationsprozesse greifen auf diese Tabelle zu.
- Neue Anbieter können ohne Datenbankänderung ergänzt werden.
- Das Modell kann unverändert für Serien, Personen, Bücher, Spiele und Musik übernommen werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_EXTERNAL_IDS.md

Version: 2.0

Status: Official