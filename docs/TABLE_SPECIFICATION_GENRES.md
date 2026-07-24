# TABLE_SPECIFICATION.md

## Tabelle

genres

---

# Zweck

Die Tabelle `genres` enthält sämtliche Genres (Kategorien) für alle Medientypen innerhalb von Library Of Legends.

Genres werden zentral verwaltet und können von mehreren Modulen gemeinsam genutzt werden.

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
| name | TEXT | Nein | - | Anzeigename des Genres |
| slug | TEXT | Nein | - | Eindeutiger URL-/API-Name |
| description | TEXT | Ja | NULL | Beschreibung |
| icon | TEXT | Ja | NULL | Emoji oder Icon |
| color | TEXT | Ja | NULL | UI-Farbe |
| sort_order | INTEGER | Nein | 0 | Sortierreihenfolge |
| is_active | INTEGER | Nein | 1 | Aktiv (1) oder deaktiviert (0) |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt am |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Letzte Änderung |

---

# Beschreibung der Spalten

## id

Interne eindeutige ID.

Beispiel:

```text
1
```

---

## name

Offizieller Genre-Name.

Beispiele:

```text
Action

Abenteuer

Drama

Komödie

Fantasy

Science Fiction

Thriller
```

---

## slug

Technischer eindeutiger Name.

Beispiele:

```text
action

adventure

drama

comedy

fantasy

science-fiction
```

---

## description

Optionale Beschreibung.

Beispiel:

```text
Filme mit einem hohen Anteil an Actionsequenzen.
```

---

## icon

Optionales Emoji oder Icon.

Beispiele:

```text
💥

😂

🧙

👻

🚀

❤️
```

---

## color

Optionale UI-Farbe.

Beispiele:

```text
red

blue

gold

purple
```

oder

```text
#D32F2F
```

---

## sort_order

Bestimmt die Reihenfolge in Listen.

Standard:

```text
0
```

---

## is_active

Status des Genres.

Mögliche Werte:

```text
1 = Aktiv

0 = Deaktiviert
```

---

# Unique Constraints

slug

name

---

# Indizes

idx_genres_name

idx_genres_slug

idx_genres_sort_order

idx_genres_is_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

---

# Beziehungen

Die Tabelle wird über Zuordnungstabellen mit den jeweiligen Medientypen verbunden.

Beispiele:

genres

↓

movie_genres

↓

movies

---

genres

↓

series_genres

↓

series

---

genres

↓

music_genres

↓

music

---

genres

↓

book_genres

↓

books

---

genres

↓

comic_genres

↓

comics

---

# Beispiel-Datensatz

```text
id

1

name

Action

slug

action

description

Filme mit hohem Actionanteil

icon

💥

color

#D32F2F

sort_order

10

is_active

1
```

---

# Standard-Genres

Empfohlene Grundausstattung:

- Action
- Abenteuer
- Animation
- Anime
- Biografie
- Comedy
- Dokumentation
- Drama
- Familie
- Fantasy
- Geschichte
- Horror
- Krimi
- Musik
- Mystery
- Romanze
- Science Fiction
- Sport
- Thriller
- Krieg
- Western

---

# Hinweise

- Genres werden niemals gelöscht, sondern deaktiviert.
- Änderungen am Namen sollten nur in Ausnahmefällen erfolgen.
- Der `slug` dient als dauerhafte technische Kennung und darf nach der Erstellung nicht mehr geändert werden.
- Alle Module verwenden dieselbe zentrale Genre-Tabelle.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_GENRES.md

Version: 2.0

Status: Official