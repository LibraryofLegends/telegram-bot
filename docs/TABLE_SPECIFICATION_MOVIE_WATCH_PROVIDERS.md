# TABLE_SPECIFICATION_MOVIE_WATCH_PROVIDERS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_watch_providers

---

# Zweck

Die Tabelle `movie_watch_providers` speichert sämtliche Bezugsquellen eines Films.

Dazu gehören unter anderem:

- Streaming
- Kauf
- Leihe
- Kostenlos
- Kino
- Blu-ray
- UHD Blu-ray
- DVD

Ein Film kann gleichzeitig auf mehreren Plattformen verfügbar sein.

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

ON DELETE CASCADE

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| country_id | INTEGER | Nein | - | Land |
| provider_name | TEXT | Nein | - | Anbieter |
| provider_type | TEXT | Nein | Streaming | Angebotsart |
| quality | TEXT | Ja | NULL | Qualität |
| audio_languages | TEXT | Ja | NULL | Audiosprachen |
| subtitle_languages | TEXT | Ja | NULL | Untertitel |
| url | TEXT | Ja | NULL | Direktlink |
| available_from | DATE | Ja | NULL | Verfügbar ab |
| available_until | DATE | Ja | NULL | Verfügbar bis |
| price | DECIMAL(10,2) | Ja | NULL | Preis |
| currency | TEXT | Ja | NULL | Währung |
| is_subscription | INTEGER | Nein | 1 | Im Abo enthalten |
| is_active | INTEGER | Nein | 1 | Aktuell verfügbar |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## country_id

Land, für das das Angebot gilt.

---

## provider_name

Beispiele

```text
Netflix

Disney+

Prime Video

Apple TV

WOW

Paramount+

RTL+

Joyn

Sky

MagentaTV

Plex

YouTube Movies
```

---

## provider_type

Zulässige Werte

```text
Streaming

Subscription

Rental

Purchase

Free

Cinema

Blu-ray

UHD Blu-ray

DVD
```

---

## quality

Beispiele

```text
SD

HD

Full HD

4K

HDR10

Dolby Vision
```

---

## audio_languages

Liste der verfügbaren Tonspuren.

---

## subtitle_languages

Liste der verfügbaren Untertitel.

---

## url

Direkter Link zum Angebot.

---

## available_from

Start der Verfügbarkeit.

---

## available_until

Ende der Verfügbarkeit.

NULL bedeutet unbegrenzt.

---

## price

Preis des Angebots.

Beispiele

```text
4.99

13.99

19.99
```

---

## currency

ISO-4217-Währungscode.

Beispiele

```text
EUR

USD

GBP
```

---

## is_subscription

```text
1 = Im Abo enthalten

0 = Separat bezahlen
```

---

## is_active

```text
1 = Verfügbar

0 = Nicht verfügbar
```

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
country_id,
provider_name,
provider_type
)
```

---

# Indizes

idx_movie_watch_movie

idx_movie_watch_country

idx_movie_watch_provider

idx_movie_watch_type

idx_movie_watch_active

idx_movie_watch_subscription

---

# Check Constraints

price >= 0

is_subscription IN (0,1)

is_active IN (0,1)

available_until >= available_from

---

# Beziehungen

movies

↓

movie_watch_providers

↓

countries

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

country_id

1

provider_name

Netflix

provider_type

Subscription

quality

4K Dolby Vision

audio_languages

Deutsch, Englisch

subtitle_languages

Deutsch, Englisch

available_from

2026-07-01

available_until

NULL

price

NULL

currency

EUR

is_subscription

1

is_active

1
```

---

# Beispiele

## Superman

Deutschland

↓

Netflix

↓

4K Dolby Vision

↓

Deutsch

↓

Im Abo enthalten

---

USA

↓

Apple TV

↓

Kaufen

↓

19.99 USD

---

# Business Rules

- Ein Film kann beliebig viele Anbieter besitzen.
- Anbieter unterscheiden sich nach Land.
- Mehrere Angebotsarten pro Anbieter sind zulässig.
- Abgelaufene Angebote werden archiviert.
- Preise können NULL sein, wenn der Film im Abonnement enthalten ist.

---

# Performance

Alle Anbieter eines Films

```sql
SELECT *
FROM movie_watch_providers
WHERE movie_id = ?;
```

---

Alle Streaming-Anbieter

```sql
SELECT *
FROM movie_watch_providers
WHERE provider_type = 'Streaming';
```

---

Alle aktiven Angebote

```sql
SELECT *
FROM movie_watch_providers
WHERE is_active = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Provider-Logos
- Affiliate-Links
- Regionssperren
- Dolby Atmos
- IMAX Enhanced
- Mehrere Preisstufen
- Preisverlauf
- Werbefinanzierte Angebote
- Live-Verfügbarkeitsprüfung
- Automatische Synchronisation mit TMDb oder JustWatch

---

# Hinweise

- Diese Tabelle speichert ausschließlich Bezugsquellen.
- Streaming, Kauf und Leihe werden gemeinsam verwaltet.
- Das Modell kann unverändert auch für Serien übernommen werden.
- Historische Verfügbarkeiten bleiben erhalten.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_WATCH_PROVIDERS.md

Version: 2.0

Status: Official