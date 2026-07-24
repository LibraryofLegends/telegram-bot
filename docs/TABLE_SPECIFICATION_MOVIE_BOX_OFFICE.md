# TABLE_SPECIFICATION_MOVIE_BOX_OFFICE.md

# Library Of Legends 2.0

Version: 2.0

Status: Official

---

# Tabelle

movie_box_office

---

# Zweck

Die Tabelle `movie_box_office` speichert sämtliche finanziellen Kennzahlen eines Films.

Dazu gehören unter anderem:

- Produktionsbudget
- Marketingbudget
- Gesamtkosten
- Weltweites Einspielergebnis
- Einnahmen nach Ländern
- Eröffnungswochenende
- Gewinn
- Verlust
- Besucherzahlen
- Historische Entwicklungen

Ein Film kann mehrere Datensätze besitzen, beispielsweise für verschiedene Länder oder Aktualisierungen.

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

country_id

REFERENCES countries(id)

ON UPDATE CASCADE

ON DELETE SET NULL

NULL erlaubt

---

# Spalten

| Name | Typ | Null | Standard | Beschreibung |
|------|------|------|-----------|--------------|
| id | INTEGER | Nein | Auto | Interne ID |
| movie_id | INTEGER | Nein | - | Zugehöriger Film |
| country_id | INTEGER | Ja | NULL | Land |
| financial_type | TEXT | Nein | Worldwide Gross | Art der Finanzdaten |
| amount | DECIMAL(18,2) | Nein | 0.00 | Betrag |
| currency | TEXT | Nein | USD | Währung |
| report_date | DATE | Ja | NULL | Stichtag |
| admissions | INTEGER | Ja | NULL | Besucher |
| rank_position | INTEGER | Ja | NULL | Platzierung |
| source | TEXT | Ja | NULL | Datenquelle |
| notes | TEXT | Ja | NULL | Hinweise |
| is_official | INTEGER | Nein | 1 | Offizielle Daten |
| created_at | DATETIME | Nein | CURRENT_TIMESTAMP | Erstellt |
| updated_at | DATETIME | Nein | CURRENT_TIMESTAMP | Aktualisiert |

---

# Beschreibung der Spalten

## movie_id

Referenz auf den Film.

---

## country_id

NULL = Weltweit.

Ansonsten gelten die Zahlen ausschließlich für das jeweilige Land.

---

## financial_type

Zulässige Werte

```text
Production Budget

Marketing Budget

Total Budget

Opening Day

Opening Weekend

Domestic Gross

International Gross

Worldwide Gross

Re-Release

Home Media

Streaming Revenue

TV Rights

Merchandising

Profit

Loss
```

---

## amount

Finanzbetrag.

---

## currency

ISO-4217-Währung.

Beispiele

```text
USD

EUR

GBP

JPY

CAD
```

---

## report_date

Datum der Erfassung.

---

## admissions

Anzahl der Kinobesucher.

---

## rank_position

Beispiele

```text
1

5

18

250
```

---

## source

Beispiele

```text
Box Office Mojo

The Numbers

IMDb

TMDb

Studio

Library Of Legends
```

---

## notes

Zusätzliche Informationen.

---

## is_official

```text
1 = Offiziell

0 = Geschätzt
```

---

# Unique Constraints

```text
UNIQUE
(
movie_id,
country_id,
financial_type,
report_date
)
```

---

# Indizes

idx_movie_box_office_movie

idx_movie_box_office_country

idx_movie_box_office_type

idx_movie_box_office_date

idx_movie_box_office_official

---

# Check Constraints

amount >= 0

admissions >= 0

rank_position > 0

is_official IN (0,1)

---

# Beziehungen

movies

↓

movie_box_office

↓

countries

---

# Beispiel-Datensatz

```text
id

1

movie_id

42

country_id

NULL

financial_type

Worldwide Gross

amount

2201647264.00

currency

USD

report_date

1998-04-01

admissions

NULL

rank_position

1

source

Box Office Mojo

is_official

1
```

---

# Beispiele

## Titanic

```text
Production Budget

200000000 USD
```

```text
Worldwide Gross

2201647264 USD
```

---

## Avatar

```text
Worldwide Gross

2923706026 USD
```

---

## Avengers: Endgame

```text
Opening Weekend

357115007 USD
```

---

# Business Rules

- Ein Film kann beliebig viele Finanzdatensätze besitzen.
- Weltweite Zahlen besitzen kein Land.
- Mehrere Währungen werden unterstützt.
- Historische Änderungen bleiben erhalten.
- Geschätzte Werte können neben offiziellen Daten gespeichert werden.

---

# Performance

Alle Finanzdaten eines Films

```sql
SELECT *
FROM movie_box_office
WHERE movie_id = ?;
```

---

Weltweite Einnahmen

```sql
SELECT *
FROM movie_box_office
WHERE financial_type = 'Worldwide Gross';
```

---

Top-Einspielergebnisse

```sql
SELECT *
FROM movie_box_office
WHERE financial_type = 'Worldwide Gross'
ORDER BY amount DESC;
```

---

# Zukunftssicherheit

Geplante Erweiterungen

- Inflationsbereinigte Werte
- Wechselkurse
- Wochencharts
- Tagesumsätze
- Kinoketten
- Einnahmen nach Bundesstaaten
- Prognosen
- Streaming-Auswertungen
- KI-Finanzanalysen
- Automatische Synchronisation mit Box Office Mojo und The Numbers

---

# Hinweise

- Diese Tabelle speichert ausschließlich Finanzdaten.
- Mehrere Datensätze pro Film sind ausdrücklich vorgesehen.
- Historische Entwicklungen können vollständig dokumentiert werden.
- Das Modell lässt sich später auch für Serien, Dokumentationen und andere Medien erweitern.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: TABLE_SPECIFICATION_MOVIE_BOX_OFFICE.md

Version: 2.0

Status: Official