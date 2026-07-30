╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : Route.md                                               ║
║ Dokument-ID   : LLF-DOC-ROUTING-0004                                   ║
║ Zugehörige ID : LLF-ROUTING-0004                                       ║
║ Klasse        : Route                                                  ║
║ Version       : 1.1.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# Route

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | Route |
| Typ | Runtime Object |
| Status | Stable |
| Seit Version | 1.1.0 |
| Abhängigkeiten | RouteDefinition, RouteParameter |
| Verwendet von | RouteCollection, RouteMatcher |

---

# Übersicht

Die Klasse **Route** repräsentiert eine registrierte Route zur Laufzeit.

Während **RouteDefinition** sämtliche unveränderlichen
Konfigurationsdaten enthält, verwaltet Route ausschließlich
Laufzeitinformationen.

Dadurch werden Konfiguration und Laufzeit konsequent voneinander
getrennt.

---

# Verantwortlichkeit

Route besitzt genau eine Aufgabe:

Die Laufzeitrepräsentation einer Route bereitzustellen.

Sie verwaltet:

- Routendefinition
- Parameter
- zukünftige Laufzeitinformationen

Sie verwaltet **nicht**:

- Matching
- Routing
- HTTP Requests
- Controller-Ausführung

---

# Architektur

```text
RouteDefinition
        │
        ▼
      Route
        │
        ▼
RouteParameter
```

Route kapselt eine unveränderliche RouteDefinition und ergänzt sie
um Laufzeitinformationen.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| definition | RouteDefinition | Routendefinition |
| method | string | HTTP-Methode |
| path | string | Routenpfad |
| handler | mixed | Handler |
| name | string \| null | Routenname |
| parameterCount | number | Anzahl registrierter Parameter |

---

# Öffentliche API

## definition

Liefert die zugehörige RouteDefinition.

---

## method

Liefert die HTTP-Methode.

---

## path

Liefert den Routenpfad.

---

## handler

Liefert den registrierten Handler.

---

## name

Liefert den Namen der Route.

---

## parameterCount

Liefert die Anzahl registrierter Parameter.

---

## addParameter()

Registriert einen RouteParameter.

```javascript
route.addParameter(parameter);
```

---

## removeParameter()

Entfernt einen Parameter.

```javascript
route.removeParameter("id");
```

---

## hasParameter()

Prüft, ob ein Parameter vorhanden ist.

```javascript
route.hasParameter("id");
```

---

## getParameter()

Liefert einen Parameter.

```javascript
const parameter =
    route.getParameter("id");
```

---

## getParameters()

Liefert alle Parameter.

```javascript
const parameters =
    route.getParameters();
```

---

## clearParameters()

Entfernt sämtliche Parameter.

```javascript
route.clearParameters();
```

---

## toJSON()

Exportiert die komplette Route.

---

# Beispiel

```javascript
const definition = new RouteDefinition({

    method: "GET",

    path: "/movies/{id}",

    handler: MovieController,

    name: "movies.show"

});

const route = new Route(definition);

route.addParameter(

    new RouteParameter("id")

);
```

---

# Dependency Graph

```text
RouteDefinition
        │
        ▼
      Route
        │
        ▼
RouteParameter
```

---

# Designentscheidung

Die Klasse **Route** speichert bewusst keine
Konfigurationsdaten selbst.

Alle unveränderlichen Informationen befinden sich in
RouteDefinition.

Route ergänzt diese lediglich um Laufzeitinformationen.

Diese Trennung bringt mehrere Vorteile:

- geringere Kopplung
- klare Verantwortlichkeiten
- einfachere Tests
- bessere Erweiterbarkeit

---

# Vorteile

✅ Single Responsibility

✅ Composition over Inheritance

✅ Immutable Configuration

✅ Erweiterbare Laufzeitdaten

✅ Testfreundlich

✅ Kleine API

✅ Framework-konform

---

# Änderungen in Version 1.1.0

- Vollständige JSDoc-Dokumentation
- Getter vereinheitlicht
- parameterCount ergänzt
- removeParameter() ergänzt
- clearParameters() ergänzt
- API konsolidiert
- Dokumentation erweitert

---

# Zukunft

Geplante Erweiterungen:

- Route-Metadaten
- Middleware-Kontext
- Laufzeitstatistiken
- Match-Zeit
- Request-Kontext
- Caching-Informationen
- Debug-Daten
- Performance-Metriken
- Tracing-Unterstützung
- Erweiterte Serialisierung

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ RouteCollection.md

→ RouteGroup.md

→ RouteMatcher.md

→ RouteResult.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Beispiele vorhanden...................... ✅

Designentscheidung erläutert............. ✅

Dependency Graph enthalten............... ✅

Version 1.1.0 dokumentiert............... ✅

Framework Ready.......................... ✅