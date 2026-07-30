╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : Router.md                                              ║
║ Dokument-ID   : LLF-DOC-ROUTING-0009                                   ║
║ Zugehörige ID : LLF-ROUTING-0009                                       ║
║ Klasse        : Router                                                 ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# Router

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | Router |
| Typ | Orchestrator |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | RouteCollection, RouteMatcher, RouteResult |
| Verwendet von | Application, HTTP Kernel |

---

# Übersicht

Die Klasse **Router** bildet den zentralen Einstiegspunkt des Routing-Systems.

Sie koordiniert sämtliche Komponenten, die für die Verarbeitung
einer eingehenden HTTP-Anfrage notwendig sind.

Der Router selbst enthält keine Matching-Algorithmen und verwaltet
keine Routen.

Er delegiert diese Aufgaben vollständig an spezialisierte Klassen.

Dadurch bleibt der Router klein, übersichtlich und leicht testbar.

---

# Verantwortlichkeit

Der Router besitzt genau eine Aufgabe:

Die einzelnen Komponenten des Routing-Systems zu koordinieren.

Er

✓ empfängt eine Anfrage

✓ startet das Matching

✓ verarbeitet das Ergebnis

✓ liefert ein RouteResult zurück

Er kennt keine Details über den Matching-Algorithmus.

---

# Architektur

```text
              Request

                 │

                 ▼

              Router

        ┌────────┴────────┐

        ▼                 ▼

RouteMatcher      RouteCollection

        │

        ▼

   RouteResult

        │

        ▼

 Application / Kernel
```

Der Router fungiert ausschließlich als Orchestrator.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| routes | RouteCollection | Registrierte Routen |
| matcher | RouteMatcher | Matching-Komponente |

---

# Öffentliche API

## routes

Liefert die RouteCollection.

---

## matcher

Liefert den aktuell verwendeten RouteMatcher.

---

## dispatch()

Startet den Routing-Vorgang.

Parameter

| Name | Typ |
|------|-----|
| method | string |
| path | string |

Rückgabe

```text
RouteResult
```

---

## has()

Prüft, ob eine Route existiert.

Rückgabe

```text
boolean
```

---

## toJSON()

Exportiert den Router.

---

# Beispiel

```javascript
const router = new Router(

    routes,

    matcher

);

const result = router.dispatch(

    "GET",

    "/users"

);

if (result.isMatched()) {

    console.log(

        result.route

    );

}
```

---

# Ablauf

```text
HTTP Request

      │

      ▼

Router.dispatch()

      │

      ▼

RouteMatcher.match()

      │

      ▼

RouteResult

      │

      ▼

Application
```

---

# Verwendet von

✓ Application

✓ HTTP Kernel

---

# Dependency Graph

```text
Request

      │

      ▼

Router

      │

      ├──────────────► RouteMatcher

      │                     │

      │                     ▼

      │              RouteCollection

      │                     │

      │                     ▼

      │                   Route

      │

      ▼

RouteResult
```

---

# Designentscheidung

Warum existiert Router?

In vielen Frameworks übernimmt der Router mehrere Aufgaben gleichzeitig.

Beispiele:

- Matching
- Middleware
- Controller-Erzeugung
- Parameterauflösung
- Events

Dadurch entstehen sehr große Klassen.

Das LLF trennt diese Verantwortlichkeiten bewusst.

Router übernimmt ausschließlich die Koordination.

Alle Fachlogik wird ausgelagert.

---

# Vorteile

✓ Orchestrator Pattern

✓ SOLID-konform

✓ Kleine Klasse

✓ Leicht testbar

✓ Erweiterbar

✓ Austauschbare Komponenten

---

# Zukunft des Routers

Spätere Versionen werden weitere Komponenten koordinieren.

Beispiele:

- Middleware Pipeline

- Controller Resolver

- Parameter Resolver

- Dependency Injection

- URL Generator

- Exception Handler

- Event Dispatcher

- Route Cache

- Compiled Routing

Die öffentliche API bleibt dabei weitgehend unverändert.

---

# Changelog

## Version 1.0.0

- Erstveröffentlichung

- Orchestrator-Architektur

- RouteMatcher-Unterstützung

- RouteCollection-Unterstützung

- RouteResult-Unterstützung

- JSON-Export

---

# Zukünftige Erweiterungen

□ Request-Unterstützung

□ Response-Erzeugung

□ Middleware-Pipeline

□ Controller-Resolver

□ URL-Generator

□ Exception-Handling

□ Event-Hooks

□ Route-Caching

□ Compiled Routing

□ Performance-Monitoring

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ RouteMatcher.md

→ RouteResult.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Dokument vollständig...................... ✅

Architektur beschrieben................... ✅

API dokumentiert.......................... ✅

Beispiele vorhanden....................... ✅

Dependency Graph enthalten................ ✅

Designentscheidung erläutert.............. ✅

Framework Ready........................... ✅