╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : HeaderBag.md                                           ║
║ Dokument-ID   : LLF-DOC-HTTP-0002                                      ║
║ Zugehörige ID : LLF-HTTP-0002                                          ║
║ Klasse        : HeaderBag                                              ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# HeaderBag

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | HTTP System |
| Klasse | HeaderBag |
| Typ | Collection |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Keine |
| Verwendet von | Request, Response |

---

# Übersicht

Die Klasse **HeaderBag** verwaltet sämtliche HTTP-Header eines
Requests oder einer Response.

Alle Header werden unabhängig von ihrer Groß- und
Kleinschreibung gespeichert und abgefragt.

Intern verwendet die Klasse eine `Map`, wodurch schnelle
Lese- und Schreibzugriffe möglich sind.

---

# Verantwortlichkeit

HeaderBag besitzt genau eine Aufgabe:

Die Verwaltung von HTTP-Headern.

Die Klasse übernimmt:

- Speichern
- Lesen
- Aktualisieren
- Löschen
- Exportieren

Die Klasse übernimmt ausdrücklich **nicht**:

- Header-Validierung nach RFC
- Request-Verarbeitung
- Response-Erstellung
- Content Negotiation

---

# Architektur

```text
Request
     │
     ▼
 HeaderBag
     ▲
     │
Response
```

HeaderBag dient als gemeinsame Header-Verwaltung für Requests
und Responses.

---

# Konstruktor

```javascript
const headers = new HeaderBag({

    "Content-Type": "application/json",

    "Accept": "*/*"

});
```

Beim Erstellen werden sämtliche Header automatisch
normalisiert.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| size | number | Anzahl der Header |
| isEmpty | boolean | Keine Header vorhanden |

---

# Öffentliche API

## size

Liefert die Anzahl gespeicherter Header.

---

## isEmpty

Prüft, ob Header vorhanden sind.

---

## set()

Speichert oder überschreibt einen Header.

```javascript
headers.set(

    "Content-Type",

    "application/json"

);
```

---

## get()

Liefert einen Header.

```javascript
headers.get("Content-Type");
```

---

## has()

Prüft, ob ein Header existiert.

```javascript
headers.has("Authorization");
```

---

## remove()

Entfernt einen Header.

```javascript
headers.remove("Authorization");
```

---

## clear()

Entfernt sämtliche Header.

```javascript
headers.clear();
```

---

## all()

Liefert alle Header.

```javascript
const allHeaders = headers.all();
```

---

## toJSON()

Exportiert alle Header.

```javascript
const json = headers.toJSON();
```

---

# Beispiel

```javascript
const headers = new HeaderBag();

headers
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer TOKEN");

console.log(

    headers.get("content-type")

);
```

Ausgabe:

```text
application/json
```

---

# Case-Insensitive Verhalten

Alle Headernamen werden intern in Kleinbuchstaben gespeichert.

Folgende Zugriffe sind identisch:

```javascript
headers.get("Content-Type");
```

```javascript
headers.get("content-type");
```

```javascript
headers.get("CONTENT-TYPE");
```

Alle liefern denselben Wert.

---

# Designentscheidung

HTTP-Header sind laut RFC nicht
groß-/kleinschreibungssensitiv.

Deshalb normalisiert HeaderBag alle Headernamen automatisch.

Dadurch entstehen:

- konsistente Speicherung
- einfache Vergleiche
- geringere Fehleranfälligkeit
- bessere Performance

---

# Vorteile

✅ Single Responsibility

✅ Case-Insensitive Header

✅ Map-basierte Speicherung

✅ Fluent API

✅ Framework-konform

✅ JSON-Export

---

# Änderungen in Version 1.0.0

- Erstimplementierung
- Map als interne Speicherung
- Case-Insensitive Header
- Fluent API
- JSON-Export
- Vollständige JSDoc

---

# Zukunft

Geplante Erweiterungen:

- Mehrfachwerte pro Header
- RFC-Validierung
- HeaderParser
- HeaderIterator
- HeaderFilter
- Accept-Header-Auswertung
- Content-Type-Helfer
- Cache-Control-Helfer
- Cookie-Unterstützung
- Qualitätswerte (q-values)

---

# Dependency Graph

```text
Request
     │
     ▼
 HeaderBag
     ▲
     │
Response
```

---

# 🔗 Siehe auch

→ RequestMethod.md

→ ParameterBag.md

→ CookieBag.md

→ Request.md

→ Response.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Case-Insensitive Verhalten erklärt....... ✅

Beispiele vorhanden...................... ✅

Designentscheidung erläutert............. ✅

Dependency Graph enthalten............... ✅

Version 1.0.0 dokumentiert............... ✅

Framework Ready.......................... ✅