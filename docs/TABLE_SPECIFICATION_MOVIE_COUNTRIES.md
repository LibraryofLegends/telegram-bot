# TABLE_SPECIFICATION_MOVIE_COUNTRIES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_countries

---

# Zweck

Die Tabelle `movie_countries` verknüpft Filme mit Ländern.

Sie dient zur Speicherung von:

- Produktionsländern
- Koproduktionsländern
- Herkunftsländern
- Veröffentlichungsländern (optional)

Ein Film kann beliebig viele Länder besitzen.

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

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| country_id | INTEGER | Nein | - | Zugehöriges Land |
| country_role | TEXT | Nein | Production | Rolle des Landes |
| is_primary | INTEGER | Nein | 0 | Hauptproduktionsland |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## country_id

Referenz auf das Land.

---

## country_role

Art der Länderzuordnung.

Zulässige Werte:

```text
Production

Co-Production

Origin

Filming

Distribution

Release
```

---

## is_primary

Kennzeichnet das Hauptproduktionsland.

```text
1 = Hauptland

0 = Weiteres Land
```

---

## sort_order

Sortierreihenfolge.

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

```text
UNIQUE

(movie_id,
country_id,
country_role)
```

---

# Indizes

idx_movie_countries_movie_id

idx_movie_countries_country_id

idx_movie_countries_role

idx_movie_countries_primary

idx_movie_countries_sort_order

---

# Check Constraints

is_primary IN (0,1)

sort_order >= 0

---

# Beziehungen

movies

↓

movie_countries

↓

countries

---

# Beispiel-Datensatz

```text
id

1

movie_id

125

country_id

1

country_role

Production

is_primary

1

sort_order

1
```

---

# Beispiele

## Interstellar

USA

↓

Production

↓

Hauptland

---

Kanada

↓

Co-Production

---

Großbritannien

↓

Production

---

## Das Boot

Deutschland

↓

Production

↓

Hauptland

---

# Business Rules

- Ein Film kann mehrere Länder besitzen.
- Ein Land kann beliebig vielen Filmen zugeordnet sein.
- Dieselbe Kombination aus Film, Land und Rolle darf nur einmal existieren.
- Pro Rolle sollte nur ein Haupteintrag (`is_primary = 1`) vorhanden sein.

---

# Performance

Alle Produktionsländer eines Films

```sql
SELECT *
FROM movie_countries
WHERE movie_id = ?
ORDER BY is_primary DESC, sort_order;
```

---

Alle Filme eines Landes

```sql
SELECT *
FROM movie_countries
WHERE country_id = ?;
```

---

Alle Koproduktionen

```sql
SELECT *
FROM movie_countries
WHERE country_role = 'Co-Production';
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Drehorte
- Regionale Drehlocations
- Steuerförderungen
- Produktionsbudgets nach Land
- Veröffentlichungszeiträume je Land
- Länderspezifische Fassungen
- Internationale Koproduktionsabkommen

---

# Hinweise

- Diese Tabelle enthält ausschließlich Beziehungen.
- Stammdaten der Länder befinden sich ausschließlich in `countries`.
- Ein Land kann unterschiedliche Rollen bei einem Film übernehmen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_COUNTRIES.md

Version: 2.0

Status: Official