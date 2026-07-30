╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteDefinition.md                                     ║
║ Dokument-ID   : LLF-DOC-ROUTING-0003                                   ║
║ Zugehörige ID : LLF-ROUTING-0003                                       ║
║ Klasse        : RouteDefinition                                        ║
║ Version       : 1.1.0                                                  ║
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
| Typ | Immutable Value Object |
| Status | Stable |
| Seit Version | 1.1.0 |
| Abhängigkeiten | RouteMethod |
| Verwendet von | Route |

---

# Übersicht

Die Klasse **RouteDefinition** beschreibt eine Route vollständig
und unveränderlich.

Sie enthält ausschließlich statische Konfigurationsdaten und dient
als Grundlage für die Laufzeitrepräsentation einer Route.

Alle Laufzeitinformationen werden von der Klasse **Route**
verwaltet.

---

# Verantwortlichkeit

RouteDefinition besitzt genau eine Aufgabe:

Die unveränderliche Beschreibung einer Route bereitzustellen.

Sie verwaltet:

- HTTP-Methode
- Pfad
- Handler
- Routenname
- Middleware
- Metadaten

Sie verwaltet ausdrücklich **nicht**:

- Parameterwerte
- Matching
- Request-Daten
- Response-Daten
- Controller-Ausführung
- Laufzeitstatus

---

# Architektur

```text
RouteMethod
      │
      ▼
RouteDefinition
      │
      ▼
Route
      │
      ▼
RouteMatcher
```

RouteDefinition bildet die statische Grundlage des gesamten
Routing-Systems.

---

# Konstruktor

Die Erstellung erfolgt über das **Options Pattern**.

```javascript
const definition = new RouteDefinition({

    method: "GET",

    path: "/movies/{id}",

    handler: MovieController,

    name: "movies.show",

    middleware: [

        "auth",

        "cache"

    ],

    metadata: {

        category: "movies"

    }

});
```

Das Options Pattern erlaubt zukünftige Erweiterungen,
ohne den Konstruktor verändern zu müssen.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| method | string | HTTP-Methode |
| path | string | Normalisierter Pfad |
| handler | Function \| string | Controller oder Callback |
| name | string \| null | Name der Route |
| middleware | string[] | Middleware-Liste |
| metadata | Object | Zusätzliche Informationen |
| hasName | boolean | Name vorhanden |
| hasMiddleware | boolean | Middleware vorhanden |
| hasMetadata | boolean | Metadaten vorhanden |

---

# Öffentliche API

## method

Liefert die HTTP-Methode.

---

## path

Liefert den normalisierten Pfad.

---

## handler

Liefert den registrierten Handler.

---

## name

Liefert den Routennamen.

---

## hasName

Prüft, ob ein Routenname vergeben wurde.

---

## middleware

Liefert alle Middleware-Einträge.

---

## hasMiddleware

Prüft, ob Middleware definiert wurde.

---

## metadata

Liefert die Metadaten.

---

## hasMetadata

Prüft, ob Metadaten vorhanden sind.

---

## toJSON()

Exportiert die komplette Routendefinition.

---

# Validierung

Beim Erstellen werden sämtliche Eingaben geprüft.

## HTTP-Methode

Die Methode wird durch **RouteMethod.validate()**
validiert.

---

## Pfad

Der Pfad muss:

- ein String sein
- nicht leer sein
- automatisch normalisiert werden

Beispiele:

```text
movies
```

↓

```text
/movies
```

---

```text
/movies/
```

↓

```text
/movies
```

---

## Handler

Erlaubte Typen:

- Function
- String

---

## Name

Erlaubte Werte:

- String
- null

---

## Middleware

Middleware muss immer ein Array sein.

---

## Metadata

Metadata muss immer ein Objekt sein.

---

# Beispiel

```javascript
const definition = new RouteDefinition({

    method: "POST",

    path: "/users",

    handler: UserController,

    name: "users.store",

    middleware: [

        "auth"

    ],

    metadata: {

        section: "admin"

    }

});
```

---

# Designentscheidung

RouteDefinition ist bewusst vollständig **immutable**.

Nach der Erstellung kann keine Eigenschaft mehr geändert werden.

Dadurch ergeben sich mehrere Vorteile:

- keine Seiteneffekte
- thread-sicheres Verhalten
- einfache Tests
- konsistente Routendefinitionen
- bessere Performance durch unveränderliche Objekte

---

# Vorteile

✅ Immutable Value Object

✅ Options Pattern

✅ Zukunftssichere API

✅ Geringe Kopplung

✅ Single Responsibility

✅ Framework-konform

✅ Erweiterbar

---

# Änderungen in Version 1.1.0

- Umstellung auf das Options Pattern
- Erweiterte Validierung
- Pfadnormalisierung integriert
- Neue Getter `hasName`
- Neue Getter `hasMiddleware`
- Neue Getter `hasMetadata`
- Vollständige JSDoc
- Konsistente Serialisierung
- Dokumentation vollständig überarbeitet

---

# Zukunft

Die Architektur erlaubt spätere Erweiterungen ohne Breaking Changes.

Geplante Eigenschaften:

- defaults
- constraints
- host
- schemes
- domain
- namespace
- locale
- prefix
- priority
- caching
- tags

---

# Dependency Graph

```text
RouteMethod
      │
      ▼
RouteDefinition
      │
      ▼
Route
      │
      ▼
RouteMatcher
```

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ RouteMatcher.md

→ RouteResult.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

Options Pattern beschrieben.............. ✅

Validierung dokumentiert................. ✅

API vollständig.......................... ✅

Beispiele vorhanden...................... ✅

Immutable Design erläutert............... ✅

Dependency Graph enthalten............... ✅

Version 1.1.0 dokumentiert............... ✅

Framework Ready.......................... ✅