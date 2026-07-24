# TABLE_SPECIFICATION_MOVIE_RELATIONS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_relations

---

# Zweck

Die Tabelle `movie_relations` speichert sämtliche Beziehungen zwischen zwei Filmen.

Dadurch lassen sich nahezu alle Arten von Verknüpfungen flexibel abbilden.

Beispiele

- Fortsetzung
- Prequel
- Sequel
- Remake
- Reboot
- Spin-off
- Crossover
- Companion Film
- Director's Cut
- Extended Cut
- Alternative Version
- Neuverfilmung

Ein Film kann unbegrenzt viele Beziehungen besitzen.

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

related_movie_id

REFERENCES movies(id)

ON UPDATE CASCADE

ON DELETE CASCADE

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Ausgangsfilm |
| related_movie_id | INTEGER | Nein | - | Verknüpfter Film |
| relation_type | TEXT | Nein | Related | Beziehungstyp |
| direction | TEXT | Nein | One Way | Richtung |
| sort_order | INTEGER | Nein | 0 | Reihenfolge |
| is_canonical | INTEGER | Nein | 1 | Offizielle Beziehung |
| source | TEXT | Ja | NULL | Herkunft |
| notes | TEXT | Ja | NULL | Hinweise |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Ausgangsfilm.

---

## related_movie_id

Zugehöriger Film.

---

## relation_type

Zulässige Werte

```text
Prequel

Sequel

Remake

Reboot

Spin-off

Crossover

Shared Universe

Director's Cut

Extended Cut

Alternative Version

Companion Film

Adaptation

Related
```

---

## direction

Zulässige Werte

```text
One Way

Two Way
```

---

## sort_order

Sortierreihenfolge.

---

## is_canonical

```text
1 = Offizielle Beziehung

0 = Fan-/Alternative Beziehung
```

---

## source

Beispiele

```text
TMDb

IMDb

Library Of Legends

Wikipedia

Manuell
```

---

## notes

Zusätzliche Informationen.

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
related_movie_id,
relation_type
)
```

---

# Indizes

idx_movie_relations_movie

idx_movie_relations_related

idx_movie_relations_type

idx_movie_relations_direction

idx_movie_relations_canonical

---

# Check Constraints

movie_id <> related_movie_id

sort_order >= 0

is_canonical IN (0,1)

---

# Beziehungen

movies

↓

movie_relations

↓

movies

---

# Beispiel-Datensatz

```text
id

1

movie_id

15

related_movie_id

27

relation_type

Sequel

direction

One Way

sort_order

1

is_canonical

1

source

TMDb
```

---

# Beispiele

## Batman Begins

↓

Sequel

↓

The Dark Knight

---

## Dune (1984)

↓

Remake

↓

Dune (2021)

---

## Rogue One

↓

Prequel

↓

Star Wars Episode IV

---

## Zack Snyder's Justice League

↓

Director's Cut

↓

Justice League (2017)

---

# Business Rules

- Ein Film kann beliebig viele Beziehungen besitzen.
- Beziehungen dürfen gerichtet oder bidirektional sein.
- Ein Film darf nicht mit sich selbst verknüpft werden.
- Mehrere Beziehungstypen zwischen denselben Filmen sind zulässig.
- Offizielle Beziehungen werden bevorzugt angezeigt.

---

# Performance

Alle Beziehungen eines Films

```sql
SELECT *
FROM movie_relations
WHERE movie_id = ?;
```

---

Alle Sequels

```sql
SELECT *
FROM movie_relations
WHERE relation_type = 'Sequel';
```

---

Alle Remakes

```sql
SELECT *
FROM movie_relations
WHERE relation_type = 'Remake';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Zeitliche Reihenfolge
- Kanon-Status
- Alternative Zeitlinien
- Multiversum-Beziehungen
- Franchise-Verknüpfungen
- Verknüpfte Serien
- Verknüpfte Spiele
- Verknüpfte Bücher
- Automatische Beziehungserkennung
- KI-gestützte Ähnlichkeitsanalysen

---

# Hinweise

- Diese Tabelle ergänzt `collections` und `universes`, ersetzt sie jedoch nicht.
- Beziehungen können beliebig erweitert werden, ohne das Datenbankschema anzupassen.
- Das Modell eignet sich auch für Serien, Bücher, Spiele und Musik.
- Durch die Trennung in `movie_id` und `related_movie_id` lassen sich gerichtete Beziehungen sauber abbilden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_RELATIONS.md

Version: 2.0

Status: Official