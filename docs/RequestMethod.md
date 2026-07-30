╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RequestMethod.md                                       ║
║ Dokument-ID   : LLF-DOC-HTTP-0001                                      ║
║ Zugehörige ID : LLF-HTTP-0001                                          ║
║ Klasse        : RequestMethod                                          ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RequestMethod

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | HTTP System |
| Klasse | RequestMethod |
| Typ | Utility Class |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Keine |
| Verwendet von | Request, Router, Middleware |

---

# Übersicht

Die Klasse **RequestMethod** stellt sämtliche vom Framework
unterstützten HTTP-Methoden bereit.

Sie dient als zentrale Referenz für HTTP-Methoden und stellt
Hilfsmethoden zur Validierung, Normalisierung und Serialisierung
zur Verfügung.

Alle Komponenten des Frameworks verwenden ausschließlich diese
Klasse, um HTTP-Methoden konsistent zu behandeln.

---

# Verantwortlichkeit

RequestMethod besitzt genau eine Aufgabe:

Die Verwaltung und Validierung von HTTP-Methoden.

Die Klasse bietet:

- Konstanten aller unterstützten HTTP-Methoden
- Validierung
- Normalisierung
- Auflistung aller Methoden
- JSON-Export

Die Klasse übernimmt ausdrücklich **nicht**:

- HTTP-Requests
- Routing
- Header-Verarbeitung
- URL-Verarbeitung

---

# Architektur

```text
RequestMethod
      │
      ├────────────► Router
      │
      ├────────────► Request
      │
      └────────────► Middleware
```

RequestMethod stellt allen HTTP-Komponenten eine gemeinsame
Definition der unterstützten Methoden bereit.

---

# Unterstützte HTTP-Methoden

| Konstante | HTTP-Methode |
|------------|-------------|
| GET | GET |
| POST | POST |
| PUT | PUT |
| PATCH | PATCH |
| DELETE | DELETE |
| HEAD | HEAD |
| OPTIONS | OPTIONS |
| TRACE | TRACE |
| CONNECT | CONNECT |

---

# Öffentliche API

## all()

Liefert sämtliche unterstützten HTTP-Methoden.

```javascript
const methods = RequestMethod.all();
```

---

## isValid()

Prüft, ob eine HTTP-Methode unterstützt wird.

```javascript
RequestMethod.isValid("GET");
```

Ergebnis:

```text
true
```

---

## validate()

Validiert eine HTTP-Methode.

```javascript
const method = RequestMethod.validate("post");
```

Ergebnis:

```text
POST
```

Bei einer ungültigen Methode wird eine `TypeError` ausgelöst.

---

## normalize()

Normalisiert eine HTTP-Methode.

```javascript
RequestMethod.normalize("put");
```

Ergebnis:

```text
PUT
```

---

## toJSON()

Exportiert sämtliche HTTP-Methoden.

```javascript
const json = RequestMethod.toJSON();
```

---

# Beispiel

```javascript
import RequestMethod from "./RequestMethod.js";

const method = RequestMethod.validate("get");

if (

    method === RequestMethod.GET

) {

    console.log("GET Request");

}
```

---

# Designentscheidung

HTTP-Methoden werden zentral verwaltet.

Dadurch entstehen folgende Vorteile:

- keine doppelten String-Literale
- konsistente Schreibweise
- einfache Validierung
- bessere Wartbarkeit
- geringere Fehleranfälligkeit

---

# Vorteile

✅ Single Responsibility

✅ Utility Class

✅ Framework-konform

✅ Einfache Erweiterbarkeit

✅ Keine externen Abhängigkeiten

✅ Konsistente Validierung

---

# Änderungen in Version 1.0.0

- Erstimplementierung
- Unterstützung aller Standardmethoden
- Validierung integriert
- Normalisierung integriert
- JSON-Export
- Vollständige JSDoc

---

# Zukunft

Geplante Erweiterungen:

- WebDAV-Methoden
- Eigene Framework-Methoden
- Sicherheitsklassifizierung
- Safe-Method-Erkennung
- Idempotent-Erkennung
- Cacheability-Erkennung
- RFC-Metadaten

---

# Dependency Graph

```text
RequestMethod

Keine Abhängigkeiten
```

---

# 🔗 Siehe auch

→ Request.md

→ HeaderBag.md

→ ParameterBag.md

→ Response.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Beispiele vorhanden...................... ✅

Designentscheidung erläutert............. ✅

Dependency Graph enthalten............... ✅

Version 1.0.0 dokumentiert............... ✅

Framework Ready.......................... ✅