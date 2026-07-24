# TABLE_SPECIFICATION_PEOPLE.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

people

---

# Zweck

Die Tabelle `people` speichert sämtliche Personen, die an einem Medium beteiligt sind.

Sie dient als zentrale Personenverwaltung für alle Module.

Beispiele:

- Schauspieler
- Regisseure
- Produzenten
- Drehbuchautoren
- Kameraleute
- Komponisten
- Synchronsprecher
- Moderatoren
- Erzähler

---

# Primärschlüssel

id

INTEGER

PRIMARY KEY

AUTOINCREMENT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| full_name | TEXT | Nein | - | Vollständiger Name |
| first_name | TEXT | Ja | NULL | Vorname |
| last_name | TEXT | Ja | NULL | Nachname |
| original_name | TEXT | Ja | NULL | Originalschreibweise |
| stage_name | TEXT | Ja | NULL | Künstlername |
| slug | TEXT | Nein | - | Technischer Name |
| gender | TEXT | Ja | NULL | Geschlecht |
| birthday | DATE | Ja | NULL | Geburtsdatum |
| deathday | DATE | Ja | NULL | Sterbedatum |
| birthplace | TEXT | Ja | NULL | Geburtsort |
| nationality | TEXT | Ja | NULL | Nationalität |
| biography | TEXT | Ja | NULL | Biografie |
| profile_path | TEXT | Ja | NULL | Profilbild |
| homepage | TEXT | Ja | NULL | Offizielle Webseite |
| imdb_id | TEXT | Ja | NULL | IMDb-ID |
| tmdb_id | INTEGER | Ja | NULL | TMDb-ID |
| popularity | REAL | Nein | 0 | Popularität |
| is_active | INTEGER | Nein | 1 | Aktiv |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## full_name

Offizieller vollständiger Name.

Beispiel:

```text
Keanu Reeves
```

---

## first_name

Vorname.

---

## last_name

Nachname.

---

## original_name

Originale Schreibweise.

Beispiel:

```text
成龍
```

---

## stage_name

Künstlername.

Beispiel:

```text
Jackie Chan
```

---

## slug

Technischer eindeutiger Name.

Beispiel:

```text
keanu-reeves
```

---

## gender

Zulässige Werte:

```text
male

female

non_binary

unknown
```

---

## birthday

Geburtsdatum.

---

## deathday

Sterbedatum.

NULL bedeutet:

```text
Person lebt.
```

---

## birthplace

Geburtsort.

Beispiel:

```text
Beirut, Libanon
```

---

## nationality

Nationalität.

Beispiel:

```text
Kanada
```

---

## biography

Kurzbiografie.

---

## profile_path

Pfad oder URL zum Profilbild.

---

## homepage

Offizielle Webseite.

---

## imdb_id

IMDb-Personen-ID.

---

## tmdb_id

TMDb-Personen-ID.

---

## popularity

Beliebtheitswert.

Standard:

```text
0
```

---

## is_active

Status.

```text
1 = Aktiv

0 = Archiviert
```

---

# Unique Constraints

slug

tmdb_id

imdb_id

---

# Indizes

idx_people_full_name

idx_people_last_name

idx_people_slug

idx_people_tmdb

idx_people_imdb

idx_people_popularity

idx_people_active

---

# Check Constraints

is_active IN (0,1)

popularity >= 0

birthday <= CURRENT_DATE

deathday >= birthday

---

# Beziehungen

people

↓

movie_people

↓

movies

---

people

↓

series_people

↓

series

---

people

↓

music_people

↓

music

---

people

↓

book_people

↓

books

---

people

↓

game_people

↓

games

---

# Beispiel-Datensatz

```text
id

1

full_name

Keanu Reeves

first_name

Keanu

last_name

Reeves

slug

keanu-reeves

gender

male

birthday

1964-09-02

birthplace

Beirut, Libanon

nationality

Kanada

tmdb_id

6384

imdb_id

nm0000206

popularity

92.4

is_active

1
```

---

# Business Rules

- Eine Person wird nur einmal gespeichert.
- Mehrere Rollen werden über Beziehungstabellen verwaltet.
- Externe IDs dürfen nicht doppelt vorkommen.
- Personen werden grundsätzlich nicht gelöscht.
- Stattdessen werden sie archiviert.

---

# Performance

Standardabfragen:

Person über TMDb-ID

```sql
SELECT *
FROM people
WHERE tmdb_id = ?;
```

---

Person über IMDb-ID

```sql
SELECT *
FROM people
WHERE imdb_id = ?;
```

---

Suche nach Namen

```sql
SELECT *
FROM people
WHERE full_name LIKE ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Social-Media-Profile
- Alternative Namen
- Spitznamen
- Auszeichnungen
- Filmografie
- Bildergalerien
- Mehrsprachige Biografien
- Synchronrollen
- Agenturen

---

# Hinweise

- Diese Tabelle enthält ausschließlich Stammdaten zu Personen.
- Die eigentlichen Rollen (z. B. Schauspieler, Regisseur oder Produzent) werden nicht hier gespeichert, sondern in den jeweiligen Beziehungstabellen wie `movie_people`.
- Dadurch kann dieselbe Person beliebig viele unterschiedliche Funktionen in verschiedenen Medien übernehmen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_PEOPLE.md

Version: 2.0

Status: Official