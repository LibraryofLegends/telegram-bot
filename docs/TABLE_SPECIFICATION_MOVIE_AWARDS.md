# TABLE_SPECIFICATION_MOVIE_AWARDS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_awards

---

# Zweck

Die Tabelle `movie_awards` speichert sämtliche Auszeichnungen und Nominierungen eines Films.

Sie verbindet Filme mit der Tabelle `awards`.

Abgebildet werden unter anderem:

- Oscar
- Golden Globe
- BAFTA
- Emmy
- Saturn Award
- César
- Deutscher Filmpreis
- Filmfestivals

Ein Film kann beliebig viele Auszeichnungen besitzen.

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

award_id

REFERENCES awards(id)

ON UPDATE CASCADE

ON DELETE RESTRICT

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Film |
| award_id | INTEGER | Nein | - | Auszeichnung |
| ceremony_number | INTEGER | Ja | NULL | Nummer der Verleihung |
| award_year | INTEGER | Nein | - | Verleihungsjahr |
| category | TEXT | Nein | - | Kategorie |
| result | TEXT | Nein | Nominated | Ergebnis |
| recipient_type | TEXT | Nein | Movie | Empfänger |
| recipient_name | TEXT | Ja | NULL | Name des Empfängers |
| notes | TEXT | Ja | NULL | Hinweise |
| is_major | INTEGER | Nein | 0 | Bedeutende Auszeichnung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## award_id

Referenz auf die Auszeichnung.

---

## ceremony_number

Nummer der Preisverleihung.

Beispiele

```text
97

82

55
```

---

## award_year

Jahr der Preisverleihung.

---

## category

Beispiele

```text
Best Picture

Best Director

Best Actor

Best Actress

Best Original Screenplay

Best Visual Effects

Best Animated Feature

Best Sound
```

---

## result

Zulässige Werte

```text
Won

Nominated

Shortlisted

Finalist
```

---

## recipient_type

Zulässige Werte

```text
Movie

Person

Studio

Cast

Crew
```

---

## recipient_name

Optionaler Name des Empfängers.

Beispiele

```text
Christopher Nolan

Hans Zimmer

Emma Stone
```

---

## notes

Zusätzliche Informationen.

---

## is_major

```text
1 = Bedeutende Auszeichnung

0 = Standard
```

---

# Unique Constraints

```text
UNIQUE

(
movie_id,
award_id,
award_year,
category,
recipient_name
)
```

---

# Indizes

idx_movie_awards_movie

idx_movie_awards_award

idx_movie_awards_year

idx_movie_awards_category

idx_movie_awards_result

idx_movie_awards_major

---

# Check Constraints

award_year >= 1900

ceremony_number > 0

is_major IN (0,1)

---

# Beziehungen

movies

↓

movie_awards

↓

awards

---

# Beispiel-Datensatz

```text
id

1

movie_id

15

award_id

1

ceremony_number

97

award_year

2025

category

Best Picture

result

Won

recipient_type

Movie

recipient_name

NULL

is_major

1
```

---

# Beispiele

## Oppenheimer

Academy Awards

↓

97th Academy Awards

↓

Best Picture

↓

Won

---

## Dune

Academy Awards

↓

Best Visual Effects

↓

Won

---

## Joker

Academy Awards

↓

Best Actor

↓

Won

↓

Joaquin Phoenix

---

# Business Rules

- Ein Film kann beliebig viele Auszeichnungen besitzen.
- Eine Auszeichnung kann mehrfach vorkommen.
- Gewinner und Nominierungen werden gemeinsam gespeichert.
- Kategorien sind frei erweiterbar.
- Personenbezogene Preise können über `recipient_name` dokumentiert werden.

---

# Performance

Alle Oscars eines Films

```sql
SELECT *
FROM movie_awards
WHERE movie_id = ?
AND award_id = ?;
```

---

Alle gewonnenen Preise

```sql
SELECT *
FROM movie_awards
WHERE result = 'Won';
```

---

Alle Nominierungen

```sql
SELECT *
FROM movie_awards
WHERE result = 'Nominated';
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Eigene Tabelle award_categories
- Mehrsprachige Kategorien
- Verknüpfung mit people
- Verknüpfung mit studios
- Juryinformationen
- Veranstaltungsort
- Zeremoniedatum
- Livestreams
- Pressebilder
- Urkunden
- Trophäen

---

# Hinweise

- Diese Tabelle speichert ausschließlich die Beziehung zwischen Filmen und Auszeichnungen.
- Kategorien bleiben flexibel und können ohne Datenbankänderung erweitert werden.
- Das Modell eignet sich auch als Vorlage für `series_awards`, `person_awards` und `studio_awards`.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_AWARDS.md

Version: 2.0

Status: Official