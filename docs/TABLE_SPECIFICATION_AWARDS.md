# TABLE_SPECIFICATION_AWARDS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

awards

---

# Zweck

Die Tabelle `awards` speichert sämtliche Auszeichnungen und Preisverleihungen.

Sie dient als zentrale Referenztabelle für:

- Filme
- Serien
- Personen
- Studios
- Musik
- Dokumentationen

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| name | TEXT | Nein | - | Name der Auszeichnung |
| short_name | TEXT | Ja | NULL | Kurzname |
| slug | TEXT | Nein | - | Technischer Name |
| organizer | TEXT | Ja | NULL | Veranstalter |
| country_id | INTEGER | Ja | NULL | Ursprungsland |
| founded_year | INTEGER | Ja | NULL | Gründungsjahr |
| website | TEXT | Ja | NULL | Offizielle Webseite |
| logo_path | TEXT | Ja | NULL | Logo |
| description | TEXT | Ja | NULL | Beschreibung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Fremdschlüssel

country_id

REFERENCES countries(id)

ON UPDATE CASCADE

ON DELETE SET NULL

---

# Beschreibung der Spalten

## name

Offizieller Name.

Beispiele

```text
Academy Awards

Golden Globe Awards

BAFTA Awards

Primetime Emmy Awards

Saturn Awards
```

---

## short_name

Kurzbezeichnung.

Beispiele

```text
Oscars

Golden Globes

BAFTA

Emmys
```

---

## slug

Technischer Name.

Beispiele

```text
academy-awards

golden-globes

bafta

emmys
```

---

## organizer

Veranstaltende Organisation.

Beispiele

```text
Academy of Motion Picture Arts and Sciences

Hollywood Foreign Press Association
```

---

## founded_year

Beispiele

```text
1929

1944

1947
```

---

## website

Offizielle Internetseite.

---

## logo_path

Pfad oder URL zum Logo.

---

## description

Kurzbeschreibung.

---

## is_active

```text
1 = Aktiv

0 = Archiviert
```

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE

(name)

UNIQUE

(slug)
```

---

# Indizes

idx_awards_name

idx_awards_slug

idx_awards_country

idx_awards_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

founded_year >= 1800

---

# Beziehungen

countries

↓

awards

↓

movie_awards

↓

movies

---

Später zusätzlich

awards

↓

series_awards

↓

series

---

awards

↓

person_awards

↓

people

---

# Beispiel-Datensatz

```text
id

1

name

Academy Awards

short_name

Oscars

slug

academy-awards

organizer

Academy of Motion Picture Arts and Sciences

country_id

2

founded_year

1929

website

https://www.oscars.org

is_active

1
```

---

# Beispiele

Academy Awards

↓

USA

↓

1929

---

Golden Globe Awards

↓

USA

↓

1944

---

BAFTA Awards

↓

Großbritannien

↓

1947

---

# Business Rules

- Jede Preisverleihung wird nur einmal gespeichert.
- Kategorien werden nicht hier gespeichert.
- Gewinner und Nominierungen befinden sich in Beziehungstabellen.
- Auszeichnungen werden niemals gelöscht.
- Stattdessen werden sie archiviert.

---

# Performance

Alle Auszeichnungen

```sql
SELECT *
FROM awards
ORDER BY name;
```

---

Alle aktiven Auszeichnungen

```sql
SELECT *
FROM awards
WHERE is_active = 1;
```

---

Suche nach Namen

```sql
SELECT *
FROM awards
WHERE name LIKE ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrsprachige Namen
- Historische Logos
- Veranstaltungsorte
- Offizielle Social-Media-Kanäle
- Sponsoren
- Archivseiten
- Frühere Bezeichnungen

---

# Hinweise

- Diese Tabelle enthält ausschließlich Stammdaten.
- Kategorien und Gewinner werden separat verwaltet.
- Dieselbe Auszeichnung kann für Filme, Serien und Personen genutzt werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_AWARDS.md

Version: 2.0

Status: Official