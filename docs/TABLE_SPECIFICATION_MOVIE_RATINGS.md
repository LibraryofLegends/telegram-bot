# TABLE_SPECIFICATION_MOVIE_RATINGS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_ratings

---

# Zweck

Die Tabelle `movie_ratings` speichert sämtliche Bewertungen eines Films.

Dadurch können mehrere Bewertungsquellen parallel verwaltet werden.

Beispiele:

- IMDb
- TMDb
- Rotten Tomatoes
- Metacritic
- Letterboxd
- Trakt
- Library Of Legends
- Benutzerbewertungen

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
| source | TEXT | Nein | - | Bewertungsquelle |
| rating_type | TEXT | Nein | Score | Art der Bewertung |
| rating_value | DECIMAL(5,2) | Nein | - | Bewertungswert |
| maximum_value | DECIMAL(5,2) | Nein | 10.00 | Maximalwert |
| vote_count | INTEGER | Ja | NULL | Anzahl der Stimmen |
| popularity | DECIMAL(10,2) | Ja | NULL | Popularitätswert |
| ranking | INTEGER | Ja | NULL | Rang |
| rating_date | DATE | Ja | NULL | Stand der Bewertung |
| is_primary | INTEGER | Nein | 0 | Hauptbewertung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## source

Bewertungsquelle.

Beispiele

```text
IMDb

TMDb

Rotten Tomatoes

Metacritic

Letterboxd

Trakt

Library Of Legends
```

---

## rating_type

Art der Bewertung.

```text
Score

Audience Score

Critic Score

User Score

Popularity

Trending
```

---

## rating_value

Bewertungswert.

Beispiele

```text
8.7

94

76

4.5
```

---

## maximum_value

Maximal erreichbarer Wert.

Beispiele

```text
10

100

5
```

---

## vote_count

Anzahl abgegebener Stimmen.

---

## popularity

Popularitätswert der Quelle.

---

## ranking

Optionaler Rang.

Beispiele

```text
1

25

100
```

---

## rating_date

Zeitpunkt der Bewertung.

---

## is_primary

```text
1 = Hauptbewertung

0 = Weitere Bewertung
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

(movie_id,
source,
rating_type)
```

---

# Indizes

idx_movie_ratings_movie

idx_movie_ratings_source

idx_movie_ratings_type

idx_movie_ratings_value

idx_movie_ratings_votes

idx_movie_ratings_primary

---

# Check Constraints

rating_value >= 0

maximum_value > 0

vote_count >= 0

ranking > 0

is_primary IN (0,1)

is_active IN (0,1)

---

# Beziehungen

movies

↓

movie_ratings

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

source

IMDb

rating_type

Score

rating_value

8.6

maximum_value

10

vote_count

1482367

popularity

98.42

ranking

18

rating_date

2026-07-01

is_primary

1

is_active

1
```

---

# Beispiele

## The Dark Knight

IMDb

↓

9.0 / 10

↓

3.100.000 Stimmen

---

TMDb

↓

8.5 / 10

↓

24.000 Stimmen

---

Rotten Tomatoes

↓

94 %

↓

Critic Score

---

# Business Rules

- Ein Film kann beliebig viele Bewertungen besitzen.
- Jede Quelle kann mehrere Bewertungstypen liefern.
- Pro Quelle sollte nur eine Hauptbewertung existieren.
- Bewertungen können regelmäßig aktualisiert werden.
- Alte Bewertungen können archiviert werden.

---

# Performance

Alle Bewertungen eines Films

```sql
SELECT *
FROM movie_ratings
WHERE movie_id = ?;
```

---

IMDb-Bewertung

```sql
SELECT *
FROM movie_ratings
WHERE movie_id = ?
AND source = 'IMDb';
```

---

Top-bewertete Filme

```sql
SELECT *
FROM movie_ratings
WHERE source = 'IMDb'
ORDER BY rating_value DESC;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Historische Bewertungsverläufe
- Tages- und Wochencharts
- Eigene Community-Bewertungen
- Like-/Dislike-System
- Rezensionen
- Kritikerbewertungen
- Auszeichnungen
- Trendanalysen
- KI-Bewertungen
- Gewichtete Durchschnittswerte

---

# Hinweise

- Diese Tabelle speichert ausschließlich Bewertungen.
- Bewertungen werden unabhängig vom Film gepflegt.
- Mehrere Quellen können parallel gespeichert werden.
- Das Modell kann unverändert auch für Serien, Bücher, Spiele und Musik verwendet werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_RATINGS.md

Version: 2.0

Status: Official