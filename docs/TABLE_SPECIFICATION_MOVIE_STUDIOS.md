# TABLE_SPECIFICATION_MOVIE_STUDIOS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_studios

---

# Zweck

Die Tabelle `movie_studios` verknüpft Filme mit Studios.

Zusätzlich wird gespeichert, welche Rolle ein Studio innerhalb der Produktion übernimmt.

Beispiele:

- Produktionsstudio
- Vertriebsunternehmen
- Streaming-Anbieter
- Animationsstudio
- Co-Produzent

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

studio_id

REFERENCES studios(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| studio_id | INTEGER | Nein | - | Zugehöriges Studio |
| role | TEXT | Nein | Production | Rolle des Studios |
| is_primary | INTEGER | Nein | 0 | Hauptstudio |
| billing_order | INTEGER | Nein | 0 | Reihenfolge |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## studio_id

Referenz auf das Studio.

---

## role

Art der Beteiligung.

Mögliche Werte:

```text
Production

Distribution

Animation

Streaming

Visual Effects

Post Production

Sound

Financing

Co-Production
```

---

## is_primary

Kennzeichnet das Hauptstudio.

```text
1 = Hauptstudio

0 = Weiteres Studio
```

---

## billing_order

Reihenfolge der Studios.

```text
0

1

2

3
```

---

## created_at

Zeitpunkt der Erstellung.

---

# Unique Constraints

Ein Studio darf für dieselbe Rolle nur einmal pro Film eingetragen werden.

```text
UNIQUE

(movie_id,
studio_id,
role)
```

---

# Indizes

idx_movie_studios_movie_id

idx_movie_studios_studio_id

idx_movie_studios_role

idx_movie_studios_primary

idx_movie_studios_billing_order

---

# Check Constraints

billing_order >= 0

is_primary IN (0,1)

---

# Beziehungen

movies

↓

movie_studios

↓

studios

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

studio_id

7

role

Production

is_primary

1

billing_order

1

created_at

2026-07-24 21:15:00
```

---

# Beispiele

## Avengers: Endgame

Studio:

Marvel Studios

↓

Role:

Production

---

Studio:

Walt Disney Studios Motion Pictures

↓

Role:

Distribution

---

## Toy Story

Studio:

Pixar Animation Studios

↓

Role:

Animation

---

Studio:

Walt Disney Pictures

↓

Role:

Distribution

---

# Business Rules

- Ein Film kann beliebig viele Studios besitzen.
- Ein Studio kann an beliebig vielen Filmen beteiligt sein.
- Ein Studio kann mehrere Rollen für denselben Film übernehmen.
- Dieselbe Kombination aus Film, Studio und Rolle darf nur einmal existieren.
- Pro Rolle sollte nur ein Hauptstudio (`is_primary = 1`) existieren.

---

# Performance

Alle Studios eines Films

```sql
SELECT *
FROM movie_studios
WHERE movie_id = ?
ORDER BY billing_order;
```

---

Alle Filme eines Studios

```sql
SELECT *
FROM movie_studios
WHERE studio_id = ?;
```

---

Alle Produktionsstudios

```sql
SELECT *
FROM movie_studios
WHERE role = 'Production';
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Vertragslaufzeiten
- Produktionsbudget je Studio
- Beteiligungsanteil
- Studio-Logos je Film
- Regionale Vertriebsrechte
- Veröffentlichungsrechte
- Lizenzinformationen

---

# Hinweise

- Die Tabelle enthält ausschließlich Beziehungen.
- Stammdaten der Studios befinden sich ausschließlich in der Tabelle `studios`.
- Mehrere Rollen eines Studios werden durch separate Datensätze gespeichert.
- Die Sortierung ermöglicht die Darstellung in der offiziellen Reihenfolge der Filmcredits.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_STUDIOS.md

Version: 2.0

Status: Official