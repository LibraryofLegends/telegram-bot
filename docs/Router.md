╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : Router.md                                              ║
║ Dokument-ID   : LLF-DOC-ROUTING-0009                                   ║
║ Zugehörige ID : LLF-ROUTING-0009                                       ║
║ Klasse        : Router                                                 ║
║ Version       : 1.1.0                                                  ║
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
| Typ | Coordinator |
| Status | Stable |
| Seit Version | 1.1.0 |
| Abhängigkeiten | RouteCollection, RouteMatcher |
| Verwendet von | Application |

---

# Übersicht

Die Klasse **Router** bildet den zentralen Einstiegspunkt des
Routing-Systems.

Ihre Aufgabe besteht ausschließlich darin, eingehende
Routing-Anfragen entgegenzunehmen und vollständig an den
**RouteMatcher** zu delegieren.

Der Router enthält bewusst keinerlei Matching-Logik.

---

# Verantwortlichkeit

Router besitzt genau eine Aufgabe:

Die Koordination des Routing-Prozesses.

Der Router verwaltet:

- RouteCollection
- RouteMatcher
- Routing-Delegation

Der Router verwaltet ausdrücklich **nicht**:

- URL-Matching
- Parameterextraktion
- Request-Objekte
- Controller-Ausführung
- Middleware-Ausführung
- HTTP-Responses

---

# Architektur

```text
Application
      │
      ▼
    Router
      │
      ▼
RouteMatcher
      │
      ▼
RouteResult
```

Der Router fungiert ausschließlich als Orchestrator zwischen
Application und RouteMatcher.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| routes | RouteCollection | Registrierte Routen |
| matcher | RouteMatcher | Zuständige Matching-Komponente |

---

# Konstruktor

```javascript
const router = new Router(

    routeCollection,

    routeMatcher

);
```

Beide Abhängigkeiten können über Dependency Injection
bereitgestellt werden.

Werden keine Instanzen übergeben, erzeugt der Router
Standardimplementierungen.

---

# Öffentliche API

## routes

Liefert die registrierte RouteCollection.

---

## matcher

Liefert den verwendeten RouteMatcher.

---

## dispatch()

Startet den Routing-Vorgang.

```javascript
const result = router.dispatch(

    "GET",

    "/movies/12"

);
```

Der Router delegiert den Vorgang vollständig an den
RouteMatcher.

---

## has()

Prüft, ob eine Route existiert.

```javascript
if (

    router.has(

        "GET",

        "/movies"

    )

) {

    // ...

}
```

---

## toJSON()

Exportiert den Router.

---

# Ablauf

```text
dispatch()

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

Der Router verändert das Ergebnis des Matchers nicht.

---

# Beispiel

```javascript
const router = new Router();

const result = router.dispatch(

    "GET",

    "/users"

);

if (

    result.isMatched()

) {

    console.log(

        result.route

    );

}
```

---

# Designentscheidung

Der Router besitzt bewusst keine eigene Matching-Logik.

Dadurch ergeben sich mehrere Vorteile:

- klare Verantwortlichkeiten
- einfache Testbarkeit
- austauschbarer Matcher
- geringe Kopplung
- hohe Erweiterbarkeit

---

# Vorteile

✅ Single Responsibility

✅ Dependency Injection

✅ Lose Kopplung

✅ Testfreundlich

✅ Erweiterbar

✅ Framework-konform

---

# Änderungen in Version 1.1.0

- Router auf reine Orchestrierung reduziert
- Entfernung der RouteResult-Kompatibilitätsschicht
- Keine instanceof-Prüfungen mehr im dispatch()
- Delegation vollständig an RouteMatcher
- Vollständige JSDoc
- Dokumentation vollständig überarbeitet

---

# Zukunft

Die Architektur erlaubt spätere Erweiterungen ohne Änderungen
am öffentlichen API.

Geplante Erweiterungen:

- Request-Unterstützung
- URI-Objekte
- Host-Routing
- Domain-Routing
- Locale-Routing
- Pipeline-Unterstützung
- Middleware-Dispatcher
- Controller-Resolver
- Performance-Monitoring
- Debug-Modus

---

# Dependency Graph

```text
Application
      │
      ▼
    Router
      │
      ▼
RouteMatcher
      │
      ▼
RouteResult
```

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

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Dependency Injection dokumentiert........ ✅

Designentscheidung erläutert............. ✅

Beispiele vorhanden...................... ✅

Dependency Graph enthalten............... ✅

Version 1.1.0 dokumentiert............... ✅

Framework Ready.......................... ✅