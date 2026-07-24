# TABLE_SPECIFICATION_MOVIE_QUOTES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_quotes

---

# Zweck

Die Tabelle `movie_quotes` speichert sämtliche Zitate eines Films.

Dazu gehören unter anderem:

- Berühmte Filmzitate
- Dialoge
- Monologe
- Einzeiler
- Eröffnungszitate
- Schlusszitate
- Kultzitate
- Erzählertexte

Ein Film kann unbegrenzt viele Zitate besitzen.

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

ON DELETE SET NULL

NULL erlaubt

---

language_id

REFERENCES languages(id)

ON UPDATE CASCADE

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| person_id | INTEGER | Ja | NULL | Sprecher |
| language_id | INTEGER | Ja | NULL | Sprache |
| quote | TEXT | Nein | - | Filmzitat |
| quote_type | TEXT | Nein | Quote | Art des Zitats |
| scene_description | TEXT | Ja | NULL | Szenenbeschreibung |
| timestamp | TEXT | Ja | NULL | Zeitpunkt im Film |
| spoiler_level | TEXT | Nein | None | Spoilerstufe |
| source | TEXT | Ja | NULL | Herkunft |
| verified | INTEGER | Nein | 0 | Verifiziert |
| is_featured | INTEGER | Nein | 0 | Hervorgehoben |
| sort_order | INTEGER | Nein | 0 | Reihenfolge |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## person_id

Referenz auf den Sprecher des Zitats.

---

## language_id

Sprache des Zitats.

---

## quote

Originales Filmzitat.

---

## quote_type

Zulässige Werte

```text
Quote

Dialogue

Monologue

Opening

Ending

Catchphrase

Narration

Speech

Conversation
```

---

## scene_description

Kurze Beschreibung der Szene.

Beispiele

```text
Eröffnung

Finalkampf

Gerichtssaal

Raumschiff

Abspann
```

---

## timestamp

Zeitpunkt im Film.

Beispiele

```text
00:08:15

01:24:52

02:03:11
```

---

## spoiler_level

Zulässige Werte

```text
None

Minor

Major
```

---

## source

Beispiele

```text
IMDb

TMDb

Blu-ray

Drehbuch

Library Of Legends
```

---

## verified

```text
1 = Verifiziert

0 = Nicht geprüft
```

---

## is_featured

```text
1 = Kultzitat

0 = Standard
```

---

## sort_order

Sortierreihenfolge.

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
quote
)
```

---

# Indizes

idx_movie_quotes_movie

idx_movie_quotes_person

idx_movie_quotes_language

idx_movie_quotes_featured

idx_movie_quotes_verified

idx_movie_quotes_type

---

# Check Constraints

verified IN (0,1)

is_featured IN (0,1)

sort_order >= 0

---

# Beziehungen

movies

↓

movie_quotes

↓

people

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_id

18

person_id

52

language_id

1

quote

I'll be back.

quote_type

Catchphrase

scene_description

Polizeistation

timestamp

00:54:28

spoiler_level

None

source

IMDb

verified

1

is_featured

1
```

---

# Beispiele

## Terminator

```text
I'll be back.
```

---

## Star Wars

```text
May the Force be with you.
```

---

## Forrest Gump

```text
Life is like a box of chocolates.
```

---

## The Dark Knight

```text
Why so serious?
```

---

# Business Rules

- Ein Film kann unbegrenzt viele Zitate besitzen.
- Ein Sprecher kann mehrere Zitate besitzen.
- Spoiler können gekennzeichnet werden.
- Kultzitate werden hervorgehoben.
- Originalsprache bleibt erhalten.

---

# Performance

Alle Zitate eines Films

```sql
SELECT *
FROM movie_quotes
WHERE movie_id = ?;
```

---

Alle Kultzitate

```sql
SELECT *
FROM movie_quotes
WHERE is_featured = 1;
```

---

Alle Zitate einer Figur bzw. eines Darstellers

```sql
SELECT *
FROM movie_quotes
WHERE person_id = ?;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Mehrsprachige Übersetzungen
- Audioausschnitte
- Videoclips
- Kapitelmarken
- Benutzerbewertungen
- Lieblingszitate
- Volltextsuche
- KI-Zitaterkennung
- Verknüpfung mit Drehbüchern
- Automatische Untertitel-Synchronisation

---

# Hinweise

- Diese Tabelle speichert ausschließlich Dialoge und Zitate.
- Hintergrundinformationen gehören weiterhin in `movie_trivia`.
- Das Modell eignet sich ebenso für Serien, Hörspiele, Dokumentationen und andere dialogbasierte Medien.
- Zeitstempel erleichtern die spätere Navigation innerhalb eines Films.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_QUOTES.md

Version: 2.0

Status: Official