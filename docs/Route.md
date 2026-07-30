╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : Route.md                                               ║
║ Dokument-ID   : LLF-DOC-ROUTING-0004                                   ║
║ Zugehörige ID : LLF-ROUTING-0004                                       ║
║ Klasse        : Route                                                  ║
║ Version       : 1.0.0                                                  ║
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
| Seit Version | 1.0.0 |
| Abhängigkeiten | RouteDefinition, RouteParameter |
| Verwendet von | RouteCollection, Router |

---

# Übersicht

Die Klasse **Route** repräsentiert eine Route während der Laufzeit.

Im Gegensatz zur **RouteDefinition**, die ausschließlich die
Konfiguration einer Route beschreibt, enthält eine Route alle
Informationen, die während eines konkreten Routing-Vorgangs
benötigt werden.

Dazu gehören insbesondere:

- die zugrunde liegende Routendefinition
- die aktuell ermittelten Parameter
- der Laufzeitzustand der Route

---

# Verantwortlichkeit

Die Klasse besitzt genau eine Aufgabe:

Eine bereits definierte Route während der Verarbeitung einer
HTTP-Anfrage darzustellen.

Sie verwaltet ausschließlich Laufzeitinformationen.

Konfigurationsdaten werden niemals verändert.

---

# Architektur

Das LLF trennt Routing in zwei Ebenen.

## Ebene 1

```text
RouteDefinition

↓

Konfiguration
```

---

## Ebene 2

```text
Route

↓

Laufzeit
```

Dadurch kann eine einzige Routendefinition beliebig oft
für verschiedene Requests verwendet werden.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| definition | RouteDefinition | Unveränderliche Routendefinition |
| parameters | Map | Aktuelle Parameter |

---

# Öffentliche API

## definition

Liefert die zugrunde liegende Definition.

---

## method

Liefert die HTTP-Methode.

Beispiel

```javascript
route.method;

// GET
```

---

## path

Liefert den URI.

---

## handler

Liefert den Handler.

---

## name

Liefert den Routennamen.

---

## addParameter()

Registriert einen neuen Parameter.

Beispiel

```javascript
route.addParameter(parameter);
```

---

## getParameter()

Liefert einen Parameter anhand seines Namens.

```javascript
route.getParameter("id");
```

---

## hasParameter()

Prüft, ob ein Parameter existiert.

---

## getParameters()

Liefert sämtliche Parameter.

---

## toJSON()

Exportiert die komplette Route.

Beispiel

```javascript
{

    definition: {

        ...

    },

    parameters: [

        ...

    ]

}
```

---

# Beispiel

```javascript
const definition = new RouteDefinition(

    "GET",

    "/users/{id}",

    "UserController@show"

);

const route = new Route(

    definition

);

route.addParameter(

    new RouteParameter(

        "id",

        42

    )

);
```

---

# Verwendet von

✓ RouteCollection

✓ Router

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

RouteCollection

        │

        ▼

Router
```

---

# Designentscheidung

Warum existieren RouteDefinition und Route?

Die meisten Frameworks speichern sowohl Konfiguration
als auch Laufzeitdaten in derselben Klasse.

Das LLF trennt diese Bereiche bewusst.

Dadurch entsteht:

✓ bessere Testbarkeit

✓ weniger Seiteneffekte

✓ einfacheres Debugging

✓ sichere Parallelität

✓ sauberere Architektur

---

# Vorteile

✓ Runtime Object

✓ Immutable Definition

✓ SOLID-konform

✓ leicht erweiterbar

✓ sauber testbar

✓ serialisierbar

---

# Changelog

Version 1.0.0

- Erstveröffentlichung
- Runtime-Objekt eingeführt
- Parameterverwaltung
- Definition-Verknüpfung
- JSON-Export

---

# Zukünftige Erweiterungen

□ Request-Referenz

□ Response-Referenz

□ Route-Matching-Informationen

□ Controller-Instanz

□ Middleware-Ausführungsstatus

□ Parameter-Konverter

□ URL-Generator

□ Profiling-Daten

□ Debug-Informationen

□ Lifecycle-Hooks

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ RouteCollection.md

→ RouteGroup.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Dokument vollständig...................... ✅

Architektur beschrieben................... ✅

API dokumentiert.......................... ✅

Beispiele vorhanden....................... ✅

Dependency Graph enthalten................ ✅

Siehe auch vorhanden...................... ✅

Framework Ready........................... ✅