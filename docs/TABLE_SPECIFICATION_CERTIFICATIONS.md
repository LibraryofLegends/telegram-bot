# TABLE_SPECIFICATION_CERTIFICATIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

certifications

---

# Zweck

Die Tabelle `certifications` speichert sämtliche Altersfreigaben und Bewertungssysteme.

Sie dient als zentrale Referenz für:

- Filme
- Serien
- Dokumentationen
- Anime
- Spiele
- Hörmedien

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Fremdschlüssel

country_id

REFERENCES countries(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| country_id | INTEGER | Nein | - | Zugehöriges Land |
| system | TEXT | Nein | - | Bewertungssystem |
| code | TEXT | Nein | - | Altersfreigabe |
| minimum_age | INTEGER | Nein | 0 | Mindestalter |
| description | TEXT | Ja | NULL | Beschreibung |
| color | TEXT | Ja | NULL | Darstellungsfarbe |
| icon | TEXT | Ja | NULL | Symbol |
| is_active | INTEGER | Nein | 1 | Aktiv |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## country_id

Referenz auf das Land.

---

## system

Bewertungssystem.

Beispiele

```text
FSK

MPAA

BBFC

PEGI

USK

ACB
```

---

## code

Offizielle Altersfreigabe.

Beispiele

```text
FSK 0

FSK 6

FSK 12

FSK 16

FSK 18

G

PG

PG-13

R

NC-17
```

---

## minimum_age

Numerischer Alterswert.

Beispiele

```text
0

6

12

16

18
```

---

## description

Beschreibung der Freigabe.

---

## color

Optionale Darstellungsfarbe.

Beispiele

```text
green

yellow

orange

red
```

---

## icon

Optionales Symbol oder Emoji.

Beispiele

```text
🟢

🟡

🟠

🔴
```

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

(country_id,
system,
code)
```

---

# Indizes

idx_certifications_country

idx_certifications_system

idx_certifications_code

idx_certifications_age

idx_certifications_active

---

# Check Constraints

minimum_age >= 0

is_active IN (0,1)

sort_order >= 0

---

# Beziehungen

countries

↓

certifications

↓

movie_certifications

↓

movies

---

Später zusätzlich

certifications

↓

series_certifications

↓

series

---

certifications

↓

game_certifications

↓

games

---

# Beispiel-Datensatz

```text
id

1

country_id

1

system

FSK

code

FSK 16

minimum_age

16

description

Freigegeben ab 16 Jahren

color

orange

icon

🟠

is_active

1
```

---

# Business Rules

- Eine Altersfreigabe existiert nur einmal.
- Ein Land kann mehrere Bewertungssysteme besitzen.
- Neue Bewertungssysteme können jederzeit ergänzt werden.
- Alte Freigaben werden archiviert, nicht gelöscht.

---

# Performance

Alle FSK-Freigaben

```sql
SELECT *
FROM certifications
WHERE system = 'FSK';
```

---

Alle Freigaben eines Landes

```sql
SELECT *
FROM certifications
WHERE country_id = ?;
```

---

Alle Freigaben ab 16 Jahren

```sql
SELECT *
FROM certifications
WHERE minimum_age >= 16;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Historische Freigaben
- Regionale Varianten
- Inhaltswarnungen
- Jugendschutz-Hinweise
- Freigabedatum
- Rechtliche Grundlagen
- Mehrsprachige Beschreibungen

---

# Hinweise

- Diese Tabelle enthält ausschließlich Stammdaten.
- Die Zuordnung zu Filmen erfolgt über `movie_certifications`.
- Dadurch kann ein Film unterschiedliche Altersfreigaben für verschiedene Länder besitzen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_CERTIFICATIONS.md

Version: 2.0

Status: Official