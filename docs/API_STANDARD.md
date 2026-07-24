# 📘 API_STANDARD.md

# Library Of Legends 2.0

**Version:** 2.0
**Status:** Official API Standard

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Standard für alle internen und externen APIs innerhalb von Library Of Legends 2.0.

Alle Module kommunizieren nach denselben Regeln.

---

# 2. Grundprinzipien

Jede API soll:

- konsistent sein
- vorhersehbar sein
- versionierbar sein
- leicht dokumentierbar sein
- leicht testbar sein

---

# 3. API-Versionierung

Alle öffentlichen APIs besitzen eine Versionsnummer.

Beispiele:

v1

v2

v3

Beispiel:

/api/v1/movies

---

# 4. Architektur

```text
Client

↓

API

↓

Controller

↓

Service

↓

Repository

↓

Database
```

---

# 5. Request Format

Alle Requests verwenden JSON.

Beispiel:

```json
{
    "title": "Avatar",
    "year": 2009
}
```

---

# 6. Response Format

Erfolgreiche Antworten:

```json
{
    "success": true,
    "data": {

    }
}
```

Fehler:

```json
{
    "success": false,
    "error": {

    }
}
```

---

# 7. HTTP Methoden

GET

Lesen

POST

Erstellen

PUT

Komplettes Aktualisieren

PATCH

Teilweise Aktualisieren

DELETE

Löschen

---

# 8. Endpunkt-Struktur

Format:

```text
/api/v1/<resource>
```

Beispiele:

/api/v1/movies

/api/v1/series

/api/v1/collections

/api/v1/genres

/api/v1/studios

---

# 9. Ressourcen

Jede Hauptentität besitzt ihren eigenen Endpunkt.

Beispiele:

Movies

Series

Collections

Genres

People

Studios

Users

Universes

Files

---

# 10. Statuscodes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

---

# 11. Fehlerformat

Alle Fehler besitzen dieselbe Struktur.

```json
{
    "success": false,
    "error": {
        "code": "MOVIE_NOT_FOUND",
        "message": "Movie not found."
    }
}
```

---

# 12. Pagination

Standard:

page

limit

total

pages

Beispiel:

```text
GET

/api/v1/movies?page=2&limit=50
```

---

# 13. Sortierung

Parameter:

sort

order

Beispiele:

title

release_date

rating

created_at

---

# 14. Filter

Beispiele:

genre

year

language

country

studio

collection

universe

---

# 15. Suche

Standard:

```text
GET

/api/v1/search?q=avatar
```

---

# 16. IDs

Interne Datenbank-ID:

id

Öffentliche Archivnummer:

library_id

Externe IDs:

tmdb_id

imdb_id

tvdb_id

---

# 17. Datumsformat

Alle Datumswerte:

ISO 8601

Beispiel:

2026-07-24T14:30:00Z

---

# 18. Authentifizierung

Alle geschützten Endpunkte verwenden Token-basierte Authentifizierung.

Berechtigungen werden zentral geprüft.

---

# 19. Logging

Alle API-Aufrufe können protokolliert werden.

Erfasst werden:

- Zeitpunkt
- Endpunkt
- Statuscode
- Dauer
- Benutzer (falls vorhanden)

---

# 20. Dokumentation

Jeder Endpunkt dokumentiert:

- Beschreibung
- Parameter
- Rückgabewerte
- Fehlercodes
- Beispiele

---

# 21. Zukunftssicherheit

Neue APIs müssen diesem Standard folgen.

Beispiele:

- REST API
- GraphQL
- WebSocket
- Mobile API

---

# 22. Grundprinzipien

- Konsistente Endpunkte
- Einheitliche Antworten
- Einheitliche Fehler
- Versionierung
- Erweiterbarkeit
- Lesbarkeit

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: API_STANDARD.md

Version: 2.0

Status: Official