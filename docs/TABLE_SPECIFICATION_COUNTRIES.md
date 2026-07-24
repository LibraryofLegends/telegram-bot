# TABLE_SPECIFICATION_COUNTRIES.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

countries

---

# Zweck

Die Tabelle `countries` speichert alle Länder zentral.

Sie dient als Referenz für:

- Produktionsländer
- Herkunftsländer
- Studios
- Personen
- Veröffentlichungen
- Sprachen
- Benutzer

Die Tabelle verhindert doppelte Schreibweisen und ermöglicht eine einheitliche Verwaltung aller Länder.

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
| name | TEXT | Nein | - | Deutscher Ländername |
| official_name | TEXT | Ja | NULL | Offizielle Bezeichnung |
| english_name | TEXT | Nein | - | Englischer Name |
| iso_alpha2 | TEXT | Nein | - | ISO-3166-1 Alpha-2 |
| iso_alpha3 | TEXT | Nein | - | ISO-3166-1 Alpha-3 |
| iso_numeric | INTEGER | Nein | - | ISO-3166-1 Numerisch |
| flag | TEXT | Ja | NULL | Flaggen-Emoji |
| continent | TEXT | Ja | NULL | Kontinent |
| capital | TEXT | Ja | NULL | Hauptstadt |
| currency | TEXT | Ja | NULL | Währung |
| timezone | TEXT | Ja | NULL | Standard-Zeitzone |
| is_active | INTEGER | Nein | 1 | Aktiv |
| sort_order | INTEGER | Nein | 0 | Sortierung |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## name

Deutscher Ländername.

Beispiele:

Deutschland

Frankreich

Japan

USA

---

## official_name

Offizielle Staatsbezeichnung.

Beispiele:

Bundesrepublik Deutschland

French Republic

United States of America

---

## english_name

Internationaler Name.

---

## iso_alpha2

ISO-3166 Alpha-2.

Beispiele

```text
DE
US
JP
FR
GB
```

---

## iso_alpha3

ISO-3166 Alpha-3.

```text
DEU
USA
JPN
FRA
GBR
```

---

## iso_numeric

Numerischer ISO-Code.

Beispiel

```text
276
840
392
250
```

---

## flag

Flaggen-Emoji.

Beispiele

🇩🇪

🇺🇸

🇫🇷

🇯🇵

---

## continent

Beispiele

```text
Europa

Nordamerika

Asien

Afrika

Ozeanien

Südamerika
```

---

## capital

Hauptstadt.

---

## currency

ISO-Währungscode.

Beispiele

```text
EUR

USD

JPY

GBP
```

---

## timezone

Beispiele

```text
Europe/Berlin

America/New_York

Asia/Tokyo
```

---

## is_active

```text
1 = Aktiv

0 = Archiviert
```

---

## sort_order

Sortierung.

---

# Unique Constraints

name

iso_alpha2

iso_alpha3

iso_numeric

---

# Indizes

idx_countries_name

idx_countries_alpha2

idx_countries_alpha3

idx_countries_continent

idx_countries_active

---

# Check Constraints

sort_order >= 0

is_active IN (0,1)

---

# Beziehungen

countries

↓

movie_countries

↓

movies

---

Später zusätzlich

countries

↓

people

---

countries

↓

studios

---

countries

↓

languages

---

countries

↓

release_countries

---

# Beispiel-Datensatz

```text
id

1

name

Deutschland

official_name

Bundesrepublik Deutschland

english_name

Germany

iso_alpha2

DE

iso_alpha3

DEU

iso_numeric

276

flag

🇩🇪

continent

Europa

capital

Berlin

currency

EUR

timezone

Europe/Berlin

is_active

1
```

---

# Business Rules

- Jedes Land wird genau einmal gespeichert.
- Alle Module verwenden dieselbe Referenztabelle.
- ISO-Codes müssen eindeutig sein.
- Länder werden niemals gelöscht.
- Stattdessen werden sie archiviert.

---

# Performance

Land über ISO-Code

```sql
SELECT *
FROM countries
WHERE iso_alpha2 = ?;
```

---

Alle Länder Europas

```sql
SELECT *
FROM countries
WHERE continent = 'Europa';
```

---

Alle aktiven Länder

```sql
SELECT *
FROM countries
WHERE is_active = 1
ORDER BY name;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Bundesstaaten
- Regionen
- Zeitzonen je Region
- Mehrere Hauptstädte
- Historische Staaten
- Alternative Landesnamen
- Lokalisierte Ländernamen
- Geokoordinaten

---

# Hinweise

- Diese Tabelle enthält ausschließlich Stammdaten.
- Produktionsländer werden über `movie_countries` verknüpft.
- Herkunftsländer von Personen und Studios sollten ebenfalls auf diese Tabelle verweisen.
- ISO-Standards dienen als eindeutige Referenz für alle Länder.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_COUNTRIES.md

Version: 2.0

Status: Official