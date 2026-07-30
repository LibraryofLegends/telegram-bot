╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteDefinition.md                                     ║
║ Dokument-ID   : LLF-DOC-ROUTING-0003                                   ║
║ Zugehörige ID : LLF-ROUTING-0003                                       ║
║ Klasse        : RouteDefinition                                        ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteDefinition

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | RouteDefinition |
| Typ | Immutable Definition Object |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | RouteMethod |
| Verwendet von | Route, Router |

---

# Übersicht

Die Klasse **RouteDefinition** beschreibt eine Route vollständig,
ohne Informationen über deren aktuelle Laufzeit zu speichern.

Sie dient als unveränderliche (Immutable) Definition und stellt
die zentrale Konfiguration einer Route dar.

Eine RouteDefinition beschreibt ausschließlich:

- HTTP-Methode
- URL-Pfad
- Handler
- Name
- Middleware
- Metadaten

Die Klasse enthält keinerlei Logik zur Verarbeitung einer HTTP-Anfrage.

---

# Verantwortlichkeit

RouteDefinition besitzt genau eine Aufgabe:

Die vollständige Beschreibung einer Route.

Sie kennt weder Requests noch Responses,
keine Parameterwerte,
keine Controller-Instanzen
und keine Routinglogik.

Dadurch bleibt sie vollständig unabhängig.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| method | string | HTTP-Methode |
| path | string | URL-Pfad |
| handler | Function \| string | Zielhandler |
| name | string \| null | Routenname |
| middleware | Array | Middleware-Liste |
| metadata | Object | Zusätzliche Informationen |

---

# Konstruktor

```javascript
new RouteDefinition(

    method,
    path,
    handler,
    name,
    middleware,
    metadata

);
```

---

# Öffentliche API

## method

Liefert die HTTP-Methode.

---

## path

Liefert den URI-Pfad.

---

## handler

Liefert den Handler.

---

## name

Liefert den Routennamen.

---

## middleware

Liefert sämtliche Middleware.

Da RouteDefinition unveränderlich ist,
ist diese Liste schreibgeschützt.

---

## metadata

Liefert zusätzliche Metadaten.

---

## toJSON()

Exportiert die Definition.

Beispiel

```javascript
{

    method: "GET",

    path: "/users/{id}",

    handler: "UserController@show",

    name: "users.show",

    middleware: [

        "auth"

    ],

    metadata: {}

}
```

---

# Immutable Design

RouteDefinition ist ein sogenanntes
Immutable Object.

Nach der Erstellung kann die Instanz
nicht mehr verändert werden.

Dadurch entstehen zahlreiche Vorteile.

✓ Thread-Sicherheit

✓ Vorhersehbares Verhalten

✓ Einfaches Debugging

✓ Sichere Serialisierung

✓ Optimales Caching

✓ Keine versehentlichen Änderungen

---

# Beispiel

```javascript
import RouteDefinition
from "./RouteDefinition.js";

const route = new RouteDefinition(

    "GET",

    "/users/{id}",

    "UserController@show",

    "users.show",

    [

        "auth"

    ]

);
```

---

# Verwendet von

✓ Route

✓ RouteCollection

✓ RouteGroup

✓ Router

---

# Dependency Graph

RouteMethod

↓

RouteDefinition

↓

Route

↓

RouteCollection

↓

Router

---

# Designentscheidung

Warum RouteDefinition?

Viele Frameworks speichern Konfiguration
und Laufzeitinformationen innerhalb
derselben Klasse.

Das LLF trennt diese Bereiche vollständig.

Dadurch entstehen kleinere Klassen
mit klar definierten Verantwortlichkeiten.

Diese Architektur erleichtert außerdem

- Caching
- Kompilierung
- Debugging
- Testbarkeit
- Performanceoptimierungen

---

# Vorteile

✓ Immutable

✓ SOLID-konform

✓ Leicht testbar

✓ Sehr gut serialisierbar

✓ Zukunftssicher

✓ Erweiterbar

---

# Changelog

Version 1.0.0

- Erstveröffentlichung
- Immutable Design
- Middleware-Unterstützung
- Metadaten
- Routennamen
- JSON-Export

---

# Zukünftige Erweiterungen

□ Host-Routing

□ Domain-Routing

□ API-Versionierung

□ HTTPS-only

□ Route-Gruppenattribute

□ OpenAPI-Informationen

□ Compiler-Hinweise

□ Cache-Strategien

□ Signierte Routen

□ Feature-Flags

---

# Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Dokument vollständig...................... ✅

Eigenschaften dokumentiert................ ✅

API dokumentiert.......................... ✅

Beispiele vorhanden....................... ✅

Dependency Graph enthalten................ ✅

Siehe auch vorhanden...................... ✅

Architektur erläutert..................... ✅

Framework Ready........................... ✅