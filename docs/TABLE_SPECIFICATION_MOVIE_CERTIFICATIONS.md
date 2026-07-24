# TABLE_SPECIFICATION_MOVIE_CERTIFICATIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_certifications

---

# Zweck

Die Tabelle `movie_certifications` verknüpft Filme mit ihren Altersfreigaben.

Da ein Film weltweit unterschiedliche Freigaben erhalten kann, können beliebig viele Bewertungen gespeichert werden.

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

certification_id

REFERENCES certifications(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| certification_id | INTEGER | Nein | - | Altersfreigabe |
| is_primary | INTEGER | Nein | 0 | Standardfreigabe |
| release_date | DATE | Ja | NULL | Datum der Freigabe |
| notes | TEXT | Ja | NULL | Hinweise |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## certification_id

Referenz auf die Altersfreigabe.

---

## is_primary

Kennzeichnet die wichtigste Altersfreigabe.

```text
1 = Standard

0 = Weitere
```

---

## release_date

Datum der offiziellen Altersfreigabe.

Beispiel

```text
2024-10-18
```

---

## notes

Optionale Hinweise.

Beispiele

```text
Director's Cut

Extended Version

Uncut

Re-Rating
```

---

# Unique Constraints

```text
UNIQUE

(movie_id,
certification_id)
```

---

# Indizes

idx_movie_certifications_movie

idx_movie_certifications_certification

idx_movie_certifications_primary

idx_movie_certifications_release_date

---

# Check Constraints

is_primary IN (0,1)

---

# Beziehungen

movies

↓

movie_certifications

↓

certifications

---

# Beispiel-Datensatz

```text
id

1

movie_id

87

certification_id

4

is_primary

1

release_date

2025-02-18

notes

Kinofassung
```

---

# Beispiele

## Deadpool

Deutschland

↓

FSK 16

---

USA

↓

R

---

Großbritannien

↓

15

---

# Business Rules

- Ein Film kann beliebig viele Altersfreigaben besitzen.
- Dieselbe Altersfreigabe darf pro Film nur einmal vorkommen.
- Pro Film sollte nur eine Standardfreigabe (`is_primary = 1`) existieren.
- Altersfreigaben werden niemals direkt im Film gespeichert.

---

# Performance

Alle Freigaben eines Films

```sql
SELECT *
FROM movie_certifications
WHERE movie_id = ?;
```

---

Alle Filme mit FSK 18

```sql
SELECT movie_id
FROM movie_certifications
WHERE certification_id = ?;
```

---

Standardfreigabe eines Films

```sql
SELECT *
FROM movie_certifications
WHERE movie_id = ?
AND is_primary = 1;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Kinofassung
- Heimkino-Version
- Streaming-Version
- Mehrere Prüfungen
- Historische Freigaben
- Uncut-Versionen
- Alterswarnungen
- Inhaltswarnungen

---

# Hinweise

- Diese Tabelle speichert ausschließlich Beziehungen.
- Alle Stammdaten befinden sich in `certifications`.
- Ein Film kann je nach Land beliebig viele unterschiedliche Altersfreigaben besitzen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_CERTIFICATIONS.md

Version: 2.0

Status: Official