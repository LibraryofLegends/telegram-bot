# TABLE_SPECIFICATION_MOVIE_GOOFS.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_goofs

---

# Zweck

Die Tabelle `movie_goofs` speichert sämtliche bekannten Filmfehler eines Films.

Dazu gehören unter anderem:

- Anschlussfehler
- Kontinuitätsfehler
- Sichtbare Filmtechnik
- Sachliche Fehler
- Historische Fehler
- Logikfehler
- Produktionsfehler
- Crew im Bild
- Sichtbare Mikrofone
- Fehlerhafte Requisiten

Ein Film kann beliebig viele Goofs besitzen.

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
| language_id | INTEGER | Ja | NULL | Sprache |
| goof_type | TEXT | Nein | Continuity | Fehlerart |
| title | TEXT | Ja | NULL | Kurzbeschreibung |
| description | TEXT | Nein | - | Fehlerbeschreibung |
| scene_description | TEXT | Ja | NULL | Szenenbeschreibung |
| timestamp | TEXT | Ja | NULL | Zeitpunkt im Film |
| spoiler_level | TEXT | Nein | None | Spoilerstufe |
| severity | INTEGER | Nein | 2 | Schweregrad (1–5) |
| source | TEXT | Ja | NULL | Herkunft |
| source_url | TEXT | Ja | NULL | Quellenlink |
| verified | INTEGER | Nein | 0 | Verifiziert |
| is_featured | INTEGER | Nein | 0 | Hervorgehoben |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## language_id

Sprache des Eintrags.

---

## goof_type

Zulässige Werte

```text
Continuity

Factual Error

Historical Error

Crew Visible

Equipment Visible

Audio Error

Editing Error

Plot Hole

Revealing Mistake

Character Error

Geographical Error

Vehicle Error

Costume Error

Prop Error

Other
```

---

## title

Kurze Überschrift.

---

## description

Ausführliche Beschreibung des Fehlers.

---

## scene_description

Beschreibung der Szene.

Beispiele

```text
Autoverfolgung

Küchenszene

Finalkampf

Gerichtssaal

Abspann
```

---

## timestamp

Zeitpunkt im Film.

Beispiele

```text
00:12:35

01:05:41

02:08:12
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

## severity

```text
1 = Kaum sichtbar

2 = Gering

3 = Auffällig

4 = Deutlich

5 = Sehr gravierend
```

---

## source

Beispiele

```text
IMDb

TMDb

Blu-ray

Library Of Legends

Community
```

---

## source_url

Optionaler Link zur Quelle.

---

## verified

```text
1 = Verifiziert

0 = Nicht geprüft
```

---

## is_featured

```text
1 = Besonders bekannt

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
description
)
```

---

# Indizes

idx_movie_goofs_movie

idx_movie_goofs_type

idx_movie_goofs_language

idx_movie_goofs_featured

idx_movie_goofs_verified

idx_movie_goofs_severity

---

# Check Constraints

severity BETWEEN 1 AND 5

verified IN (0,1)

is_featured IN (0,1)

sort_order >= 0

---

# Beziehungen

movies

↓

movie_goofs

↓

languages

---

# Beispiel-Datensatz

```text
id

1

movie_id

25

language_id

1

goof_type

Continuity

title

Kaffeetasse wechselt Position

description

Zwischen zwei Kameraeinstellungen steht die Kaffeetasse plötzlich an einer anderen Stelle.

scene_description

Frühstücksszene

timestamp

00:28:17

spoiler_level

None

severity

3

source

IMDb

verified

1

is_featured

1
```

---

# Beispiele

## Continuity

```text
Die Jacke ist im nächsten Schnitt plötzlich geschlossen.
```

---

## Crew Visible

```text
Ein Kameramann spiegelt sich im Fenster.
```

---

## Equipment Visible

```text
Das Mikrofon ist am oberen Bildrand sichtbar.
```

---

## Historical Error

```text
Ein Fahrzeugmodell wird gezeigt, das zur dargestellten Zeit noch nicht existierte.
```

---

# Business Rules

- Ein Film kann unbegrenzt viele Goofs besitzen.
- Spoiler werden entsprechend gekennzeichnet.
- Verifizierte Einträge werden bevorzugt angezeigt.
- Besonders bekannte Fehler können hervorgehoben werden.
- Historische Änderungen bleiben nachvollziehbar.

---

# Performance

Alle Goofs eines Films

```sql
SELECT *
FROM movie_goofs
WHERE movie_id = ?;
```

---

Alle Anschlussfehler

```sql
SELECT *
FROM movie_goofs
WHERE goof_type = 'Continuity';
```

---

Alle gravierenden Fehler

```sql
SELECT *
FROM movie_goofs
WHERE severity >= 4;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Bilder zum Fehler
- Videoclips
- Frame-Position
- Benutzerbewertungen
- Community-Meldungen
- KI-Erkennung von Goofs
- Verknüpfung mit Filmszenen
- Änderungsverlauf
- Mehrsprachige Beschreibungen
- Automatische Quellenprüfung

---

# Hinweise

- Diese Tabelle speichert ausschließlich Filmfehler.
- Hintergrundinformationen gehören in `movie_trivia`.
- Dialoge gehören in `movie_quotes`.
- Das Modell kann unverändert auch für Serien und Dokumentationen verwendet werden.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_GOOFS.md

Version: 2.0

Status: Official