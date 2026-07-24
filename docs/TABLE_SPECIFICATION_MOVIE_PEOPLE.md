# TABLE_SPECIFICATION_MOVIE_PEOPLE.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_people

---

# Zweck

Die Tabelle `movie_people` verknüpft Filme mit Personen.

Zusätzlich wird gespeichert, welche Funktion eine Person bei einem Film übernimmt.

Beispiele:

- Schauspieler
- Regisseur
- Produzent
- Drehbuchautor
- Kameramann
- Komponist
- Synchronsprecher
- Erzähler

Da eine Person mehrere Funktionen besitzen kann und ein Film viele beteiligte Personen hat, handelt es sich um eine Many-to-Many-Beziehung.

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

person_id

REFERENCES people(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|-----|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| person_id | INTEGER | Nein | - | Zugehörige Person |
| department | TEXT | Nein | - | Hauptbereich |
| job | TEXT | Nein | - | Konkrete Aufgabe |
| character_name | TEXT | Ja | NULL | Rollenname |
| billing_order | INTEGER | Ja | NULL | Reihenfolge im Abspann |
| credit_order | INTEGER | Ja | NULL | Sortierung innerhalb der Credits |
| is_primary | INTEGER | Nein | 0 | Hauptfunktion |
| is_uncredited | INTEGER | Nein | 0 | Nicht im Abspann genannt |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## person_id

Referenz auf die Person.

---

## department

Übergeordneter Bereich.

Beispiele:

```text
Acting

Directing

Writing

Production

Camera

Editing

Sound

Visual Effects

Art

Costume & Make-Up

Lighting

Crew
```

---

## job

Konkrete Aufgabe.

Beispiele:

```text
Actor

Director

Producer

Executive Producer

Writer

Screenplay

Composer

Editor

Cinematographer

Voice Actor
```

---

## character_name

Name der gespielten Figur.

Beispiele:

```text
John Wick

Tony Stark

Harry Potter

Batman
```

---

## billing_order

Reihenfolge auf dem Filmplakat oder in den Credits.

```text
1

2

3
```

---

## credit_order

Sortierung innerhalb der gesamten Mitwirkendenliste.

---

## is_primary

Kennzeichnet die Hauptfunktion.

```text
1 = Hauptfunktion

0 = Weitere Funktion
```

---

## is_uncredited

Kennzeichnet nicht genannte Mitwirkende.

```text
1 = Nicht genannt

0 = Offiziell genannt
```

---

# Unique Constraints

Eine identische Kombination darf nur einmal existieren.

```text
UNIQUE

(movie_id,
person_id,
department,
job,
character_name)
```

---

# Indizes

idx_movie_people_movie_id

idx_movie_people_person_id

idx_movie_people_department

idx_movie_people_job

idx_movie_people_billing_order

idx_movie_people_credit_order

---

# Check Constraints

billing_order >= 0

credit_order >= 0

is_primary IN (0,1)

is_uncredited IN (0,1)

---

# Beziehungen

movies

↓

movie_people

↓

people

---

# Beispiel-Datensatz

```text
id

1

movie_id

24

person_id

81

department

Acting

job

Actor

character_name

John Wick

billing_order

1

credit_order

1

is_primary

1

is_uncredited

0
```

---

# Beispiele

## Keanu Reeves

Film:

John Wick

↓

Abteilung:

Acting

↓

Job:

Actor

↓

Rolle:

John Wick

---

## Christopher Nolan

Film:

Inception

↓

Department:

Directing

↓

Job:

Director

---

## Hans Zimmer

Film:

Interstellar

↓

Department:

Sound

↓

Job:

Original Music Composer

---

# Business Rules

- Eine Person kann beliebig viele Funktionen bei einem Film besitzen.
- Ein Film besitzt beliebig viele beteiligte Personen.
- Dieselbe Kombination darf nicht mehrfach gespeichert werden.
- Schauspielrollen verwenden `character_name`.
- Andere Funktionen lassen `character_name` leer.

---

# Performance

Alle Schauspieler eines Films

```sql
SELECT *
FROM movie_people
WHERE movie_id = ?
AND department = 'Acting'
ORDER BY billing_order;
```

---

Alle Regisseure

```sql
SELECT *
FROM movie_people
WHERE movie_id = ?
AND job = 'Director';
```

---

Filmografie einer Person

```sql
SELECT *
FROM movie_people
WHERE person_id = ?
ORDER BY credit_order;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Gastauftritte
- Cameo-Auftritte
- Motion Capture
- Mehrere Rollen pro Person
- Synchronrollen
- Internationale Sprecher
- Awards
- Credits je Sprachversion

---

# Hinweise

- Rollen werden ausschließlich in dieser Tabelle gespeichert.
- Die Tabelle `people` enthält nur Stammdaten.
- Dadurch kann dieselbe Person in verschiedenen Filmen unterschiedliche Aufgaben übernehmen.
- Das Modell unterstützt beliebig viele Mitwirkende und beliebig viele Funktionen pro Person.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_PEOPLE.md

Version: 2.0

Status: Official