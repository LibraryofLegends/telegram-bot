# TABLE_SPECIFICATION_LANGUAGES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

languages

---

# Zweck

Die Tabelle `languages` speichert alle unterstützten Sprachen innerhalb von Library Of Legends.

Sie dient als zentrale Referenztabelle für:

- Audiosprachen
- Originalsprachen
- Untertitel
- Benutzeroberfläche
- Metadaten

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
| name | TEXT | Nein | - | Deutscher Name |
| native_name | TEXT | Nein | - | Name in der Landessprache |
| english_name | TEXT | Nein | - | Englischer Name |
| iso_639_1 | TEXT | Nein | - | ISO-639-1 Code |
| iso_639_2 | TEXT | Ja | NULL | ISO-639-2 Code |
| locale | TEXT | Ja | NULL | Locale |
| flag | TEXT | Ja | NULL | Flaggen-Emoji |
| text_direction | TEXT | Nein | ltr | Schreibrichtung |
| is_active | INTEGER | Nein | 1 | Aktiv |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## name

Deutscher Sprachname.

Beispiele:

Deutsch

Englisch

Französisch

Japanisch

---

## native_name

Name in Originalsprache.

Beispiele:

Deutsch

English

Français

日本語

---

## english_name

Internationale Bezeichnung.

Beispiele:

German

English

French

Japanese

---

## iso_639_1

ISO-639-1 Sprachcode.

Beispiele:

```text
de

en

fr

ja

it

es
```

---

## iso_639_2

ISO-639-2 Sprachcode.

Beispiele:

```text
deu

eng

fra

jpn
```

---

## locale

Locale-Code.

Beispiele:

```text
de-DE

en-US

en-GB

fr-FR

ja-JP
```

---

## flag

Flaggen-Emoji.

Beispiele:

🇩🇪

🇺🇸

🇫🇷

🇯🇵

---

## text_direction

Schreibrichtung.

Zulässige Werte:

```text
ltr

rtl
```

---

## is_active

Status.

```text
1 = Aktiv

0 = Deaktiviert
```

---

## sort_order

Sortierung.

---

# Unique Constraints

name

iso_639_1

iso_639_2

locale

---

# Indizes

idx_languages_name

idx_languages_iso6391

idx_languages_iso6392

idx_languages_locale

idx_languages_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

text_direction IN ('ltr','rtl')

---

# Beziehungen

languages

↓

movie_languages

↓

movies

---

Später zusätzlich:

languages

↓

series_languages

↓

series

---

languages

↓

subtitle_languages

↓

subtitles

---

languages

↓

book_languages

↓

books

---

languages

↓

music_languages

↓

music

---

# Beispiel-Datensatz

```text
id

1

name

Deutsch

native_name

Deutsch

english_name

German

iso_639_1

de

iso_639_2

deu

locale

de-DE

flag

🇩🇪

text_direction

ltr

is_active

1
```

---

# Business Rules

- Jede Sprache wird nur einmal gespeichert.
- ISO-Codes müssen eindeutig sein.
- Eine Sprache kann von beliebig vielen Medien verwendet werden.
- Sprachen werden niemals gelöscht.
- Stattdessen werden sie deaktiviert.

---

# Performance

Suche nach ISO-Code

```sql
SELECT *
FROM languages
WHERE iso_639_1 = ?;
```

---

Alle aktiven Sprachen

```sql
SELECT *
FROM languages
WHERE is_active = 1
ORDER BY sort_order, name;
```

---

# Zukunftssicherheit

Geplante Erweiterungen:

- Sprachfamilien
- Regionale Varianten
- Dialekte
- KI-Übersetzungen
- Alternative Namen
- Schriftarten
- Sprachsymbole
- Vollständige Lokalisierung

---

# Hinweise

- Diese Tabelle speichert ausschließlich Stammdaten.
- Die Zuordnung zu Filmen erfolgt über `movie_languages`.
- Dieselbe Sprache kann gleichzeitig Originalsprache, Audiosprache oder Untertitelsprache sein.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_LANGUAGES.md

Version: 2.0

Status: Official