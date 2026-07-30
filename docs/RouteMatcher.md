╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteMatcher.md                                        ║
║ Dokument-ID   : LLF-DOC-ROUTING-0007                                   ║
║ Zugehörige ID : LLF-ROUTING-0007                                       ║
║ Klasse        : RouteMatcher                                           ║
║ Version       : 1.1.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteMatcher

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | RouteMatcher |
| Typ | Matcher |
| Status | Stable |
| Seit Version | 1.1.0 |
| Abhängigkeiten | RouteCollection, Route, RouteDefinition, RouteResult |
| Verwendet von | Router |

---

# Übersicht

Der **RouteMatcher** ist für den eigentlichen Matching-Prozess des Routing-Systems verantwortlich.

Er durchsucht alle registrierten Routen, vergleicht sie mit einer eingehenden HTTP-Anfrage und liefert **immer** ein `RouteResult` zurück.

Seit Version **1.1.0** verwendet der RouteMatcher konsequent das **Result Pattern**. Dadurch existieren keine `null`-Rückgaben oder unterschiedlichen Rückgabetypen mehr.

---

# Verantwortlichkeit

Der RouteMatcher besitzt genau eine Aufgabe:

Das Ermitteln einer passenden Route.

Der Matcher übernimmt **nicht**:

- Registrierung von Routen
- Verwaltung der RouteCollection
- Controller-Ausführung
- Middleware
- HTTP-Response-Erzeugung

Dadurch bleibt die Klasse vollständig auf den Matching-Prozess fokussiert.

---

# Architektur

```text
Request
   │
   ▼
RouteMatcher
   │
   ├────────► RouteCollection
   │                │
   │                ▼
   │              Route
   │                │
   │                ▼
   │        RouteDefinition
   │
   ▼
RouteResult
```

---

# Matching-Ablauf

```text
match()

 │

 ├────────► validateInput()

 │

 ├────────► normalizeMethod()

 │

 ├────────► normalizePath()

 │

 ├────────► findMatchingRoute()

 │

 ├────────► extractParameters()

 │

 └────────► createRouteResult()
```

Jeder Arbeitsschritt besitzt eine klar definierte Verantwortung.

---

# Öffentliche API

## match()

Startet den kompletten Matching-Prozess.

### Parameter

| Name | Typ |
|------|-----|
| routes | RouteCollection |
| method | string |
| path | string |

### Rückgabe

```text
RouteResult
```

Der Rückgabewert ist immer ein vollständiges Ergebnisobjekt.

---

# Private Methoden

| Methode | Aufgabe |
|----------|----------|
| validateInput() | Eingaben prüfen |
| normalizeMethod() | HTTP-Methode vereinheitlichen |
| normalizePath() | Request-Pfad normalisieren |
| findMatchingRoute() | Route suchen |
| isMatchingPath() | Pfade vergleichen |
| extractParameters() | URL-Parameter extrahieren |
| createSuccessResult() | Erfolgreiches Ergebnis erzeugen |
| createNotFoundResult() | 404-Ergebnis erzeugen |

---

# Beispiel

```javascript
const result = matcher.match(

    routes,

    "GET",

    "/movies/42"

);

if (result.isMatched()) {

    console.log(

        result.parameters.id

    );

}
```

---

# Erfolgreiches Ergebnis

```text
matched

↓

true

↓

RouteResult
```

---

# Nicht gefunden

```text
matched

↓

false

↓

404

↓

RouteResult
```

---

# Dependency Graph

```text
Request

   │

   ▼

RouteMatcher

   │

   ├────────► RouteCollection

   │                │

   │                ▼

   │              Route

   │                │

   │                ▼

   │        RouteDefinition

   │

   ▼

RouteResult
```

---

# Designentscheidung

Version **1.1.0** führt das Result Pattern vollständig ein.

Frühere Versionen konnten unterschiedliche Rückgabewerte liefern:

- Route
- null

Diese Variante wurde bewusst verworfen.

Seit Version 1.1.0 liefert der Matcher ausschließlich ein `RouteResult`.

Dadurch entstehen:

- konsistente APIs
- weniger Sonderfälle
- einfachere Tests
- bessere Erweiterbarkeit

---

# Vorteile

✅ Single Responsibility

✅ Result Pattern

✅ Kleine öffentliche API

✅ Private Helper-Methoden

✅ Testfreundlich

✅ Erweiterbar

✅ Framework-konform

---

# Changelog

## Version 1.1.0

- Result Pattern vollständig integriert
- `RouteResult` als einziger Rückgabetyp
- Matching-Prozess in private Methoden aufgeteilt
- Verbesserte Eingabevalidierung
- Einheitliche Fehlerbehandlung
- Vereinfachte öffentliche API

---

# Zukunft

Geplante Erweiterungen:

- Constraints (`{id:\d+}`)
- Optionale Parameter
- Wildcards
- Host-Matching
- Regex-Routen
- Priorisierte Routen
- Route Cache
- Compiled Routing
- Performance-Messung
- Debug-Modus

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ RouteResult.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API dokumentiert......................... ✅

Private Methoden beschrieben............. ✅

Designentscheidung dokumentiert.......... ✅

Beispiele vorhanden...................... ✅

Dependency Graph enthalten............... ✅

Framework Ready.......................... ✅