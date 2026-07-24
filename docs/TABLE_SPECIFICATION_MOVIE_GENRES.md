# TABLE_SPECIFICATION_MOVIE_GENRES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_genres

---

# Zweck

Die Tabelle `movie_genres` verknüpft Filme mit ihren Genres.

Da ein Film mehrere Genres besitzen kann und jedes Genre mehreren Filmen zugeordnet werden kann, handelt es sich um eine klassische Many-to-Many-Beziehung.

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

genre_id

REFERENCES genres(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| genre_id | INTEGER | Nein | - | Zugehöriges Genre |
| is_primary | INTEGER | Nein | 0 | Hauptgenre |
| sort_order | INTEGER | Nein | 0 | Reihenfolge |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

Beispiel:

```text
15
```

---

## genre_id

Referenz auf das Genre.

Beispiel:

```text
3
```

---

## is_primary

Kennzeichnet das Hauptgenre.

Werte:

```text
0 = Nein

1 = Ja
```

Ein Film sollte maximal ein Hauptgenre besitzen.

---

## sort_order

Legt die Reihenfolge der Genres fest.

Beispiel:

```text
0

1

2

3
```

---

## created_at

Zeitpunkt der Erstellung.

Standard:

CURRENT_TIMESTAMP

---

# Unique Constraints

Ein Film darf dasselbe Genre nur einmal besitzen.

```text
UNIQUE

(movie_id, genre_id)
```

---

# Indizes

idx_movie_genres_movie_id

idx_movie_genres_genre_id

idx_movie_genres_primary

idx_movie_genres_sort_order

---

# Check Constraints

```text
is_primary IN (0,1)

sort_order >= 0
```

---

# Beziehungen

movies

↓

movie_genres

↓

genres

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

genre_id

3

is_primary

1

sort_order

0

created_at

2026-07-24 18:45:12
```

---

# Beispiel

Film:

```text
Avatar
```

Genres:

```text
Action

Science Fiction

Abenteuer
```

Datensätze:

| movie_id | genre_id | is_primary |
|----------|---------|------------|
| 42 | 1 | 1 |
| 42 | 7 | 0 |
| 42 | 15 | 0 |

---

# Business Rules

- Jeder Film muss mindestens ein Genre besitzen.
- Ein Genre darf beliebig vielen Filmen zugeordnet werden.
- Pro Film sollte höchstens ein Hauptgenre existieren.
- Dieselbe Kombination aus Film und Genre darf nicht mehrfach vorkommen.

---

# Performance

Standardabfragen:

Filme eines Genres

↓

```sql
SELECT movie_id
FROM movie_genres
WHERE genre_id = ?
```

---

Genres eines Films

↓

```sql
SELECT genre_id
FROM movie_genres
WHERE movie_id = ?
```

Beide Abfragen werden durch Indizes optimiert.

---

# Zukunftssicherheit

Die Tabelle kann später erweitert werden um:

- Relevanzwert
- KI-Klassifizierung
- Automatische Genre-Erkennung
- Benutzerdefinierte Genres
- Gewichtung der Genre-Zuordnung

---

# Hinweise

- Es werden ausschließlich IDs gespeichert.
- Alle weiteren Informationen stammen aus den Tabellen `movies` und `genres`.
- Die Tabelle enthält bewusst keine redundanten Daten wie Genre-Namen oder Filmtitel.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_GENRES.md

Version: 2.0

Status: Official