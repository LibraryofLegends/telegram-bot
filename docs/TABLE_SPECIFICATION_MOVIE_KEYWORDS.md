# TABLE_SPECIFICATION_MOVIE_KEYWORDS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_keywords

---

# Zweck

Die Tabelle `movie_keywords` speichert sämtliche standardisierten Schlüsselwörter eines Films.

Keywords dienen der:

- Volltextsuche
- Ähnlichkeitserkennung
- Empfehlungssystemen
- Automatischen Kategorisierung
- Datenimporten
- KI-Auswertungen

Im Gegensatz zu `tags` stammen Keywords häufig aus externen Quellen.

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
| keyword | TEXT | Nein | - | Schlüsselwort |
| normalized_keyword | TEXT | Nein | - | Normalisierte Schreibweise |
| language_id | INTEGER | Ja | NULL | Sprache |
| source | TEXT | Nein | TMDb | Herkunft |
| external_id | TEXT | Ja | NULL | Externe Keyword-ID |
| relevance | DECIMAL(4,2) | Nein | 1.00 | Relevanz |
| confidence | DECIMAL(5,2) | Ja | NULL | KI-Vertrauen |
| is_primary | INTEGER | Nein | 0 | Haupt-Keyword |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Fremdschlüssel (zusätzlich)

language_id

REFERENCES languages(id)

ON UPDATE CASCADE

ON DELETE SET NULL

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## keyword

Originales Schlüsselwort.

Beispiele

```text
Time Travel

Artificial Intelligence

Space Mission

Haunted House

Serial Killer
```

---

## normalized_keyword

Normalisierte Version für Suche.

Beispiele

```text
time travel

artificial intelligence

space mission
```

---

## language_id

Sprache des Keywords.

NULL = sprachneutral.

---

## source

Herkunft.

Beispiele

```text
TMDb

IMDb

Wikidata

Library Of Legends

AI
```

---

## external_id

Externe Kennung.

Beispiele

```text
1542

99381

KW-154
```

---

## relevance

Relevanz des Keywords.

```text
1.00

0.90

0.75
```

---

## confidence

Vertrauenswert einer KI.

```text
98.60

94.20

87.10
```

---

## is_primary

```text
1 = Haupt-Keyword

0 = Standard
```

---

## is_active

```text
1 = Aktiv

0 = Archiviert
```

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
normalized_keyword,
source
)
```

---

# Indizes

idx_movie_keywords_movie

idx_movie_keywords_keyword

idx_movie_keywords_normalized

idx_movie_keywords_language

idx_movie_keywords_source

idx_movie_keywords_primary

---

# Check Constraints

relevance >= 0

relevance <= 1

confidence >= 0

confidence <= 100

is_primary IN (0,1)

is_active IN (0,1)

---

# Beziehungen

movies

↓

movie_keywords

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

keyword

Time Travel

normalized_keyword

time travel

language_id

2

source

TMDb

external_id

437

relevance

0.98

confidence

99.30

is_primary

1

is_active

1
```

---

# Beispiele

## Interstellar

```text
Black Hole

Space Travel

NASA

Time Dilation

Gravity

Future

Artificial Intelligence
```

---

## Jurassic Park

```text
Dinosaurs

DNA

Island

Genetic Engineering

Theme Park
```

---

## The Matrix

```text
Simulation

Artificial Intelligence

Virtual Reality

Cyberpunk

Chosen One
```

---

# Business Rules

- Ein Film kann unbegrenzt viele Keywords besitzen.
- Keywords können aus mehreren Quellen stammen.
- Identische Keywords derselben Quelle werden nicht doppelt gespeichert.
- Keywords bleiben unverändert im Original erhalten.
- Für Suchvorgänge wird die normalisierte Version verwendet.

---

# Performance

Alle Keywords eines Films

```sql
SELECT *
FROM movie_keywords
WHERE movie_id = ?;
```

---

Suche nach Keyword

```sql
SELECT *
FROM movie_keywords
WHERE normalized_keyword = ?;
```

---

Alle TMDb-Keywords

```sql
SELECT *
FROM movie_keywords
WHERE source = 'TMDb';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Keyword-Hierarchien
- Synonyme
- Übersetzungen
- KI-generierte Keywords
- Popularitätswerte
- Keyword-Clustering
- Semantische Beziehungen
- Automatische Gewichtung
- Trends
- Embedding-Vektoren für KI-Suche

---

# Hinweise

- Keywords unterscheiden sich bewusst von Tags.
- Tags sind redaktionell gepflegt.
- Keywords stammen überwiegend aus standardisierten externen Quellen.
- Beide Systeme können parallel genutzt werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_KEYWORDS.md

Version: 2.0

Status: Official