╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteResult.md                                         ║
║ Dokument-ID   : LLF-DOC-ROUTING-0008                                   ║
║ Zugehörige ID : LLF-ROUTING-0008                                       ║
║ Klasse        : RouteResult                                            ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteResult

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | RouteResult |
| Typ | Result Object |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Route |
| Verwendet von | RouteMatcher, Router |

---

# Übersicht

Die Klasse **RouteResult** repräsentiert das vollständige Ergebnis
eines Routing-Vorgangs.

Anstatt lediglich eine Route oder `null` zurückzugeben,
liefert RouteResult sämtliche Informationen, die während des
Matchings entstanden sind.

Dazu gehören:

- Match-Status
- gefundene Route
- extrahierte Parameter
- HTTP-Statuscode
- Diagnosemeldung

Dadurch entsteht eine deutlich aussagekräftigere Schnittstelle
zwischen RouteMatcher und Router.

---

# Verantwortlichkeit

RouteResult besitzt genau eine Aufgabe:

Das Ergebnis eines Routing-Vorgangs zu kapseln.

Die Klasse führt selbst keinerlei Matching durch.

Sie enthält ausschließlich Informationen über das Ergebnis.

---

# Architektur

```text
HTTP Request

      │

      ▼

RouteMatcher

      │

      ▼

RouteResult

      │

      ▼

Router
```

Der Router arbeitet ausschließlich mit dem RouteResult und muss
keine Sonderfälle selbst behandeln.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| matched | boolean | Wurde eine Route gefunden |
| route | Route \| null | Gefundene Route |
| parameters | Object | Extrahierte Parameter |
| status | number | HTTP-Statuscode |
| message | string | Diagnosemeldung |

---

# Öffentliche API

## matched

Liefert den Match-Status.

---

## route

Liefert die gefundene Route.

---

## parameters

Liefert sämtliche extrahierten Parameter.

---

## status

Liefert den HTTP-Status.

Typische Werte:

- 200
- 404
- 405

---

## message

Liefert eine Diagnosemeldung.

---

## isMatched()

Prüft, ob das Matching erfolgreich war.

```javascript
if (result.isMatched()) {

    // Route gefunden

}
```

---

## toJSON()

Exportiert das komplette Ergebnis.

---

# Beispiel

```javascript
const result = new RouteResult({

    matched: true,

    status: 200,

    route,

    parameters: {

        id: 42

    },

    message: "Route matched."

});
```

---

# Beispiel eines Fehlers

```javascript
const result = new RouteResult({

    matched: false,

    status: 404,

    message: "Route not found."

});
```

---

# Verwendet von

✓ RouteMatcher

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

RouteGroup

      │

      ▼

RouteMatcher

      │

      ▼

RouteResult

      │

      ▼

Router
```

---

# Designentscheidung

Warum existiert RouteResult?

Viele Frameworks geben beim Matching lediglich eine Route oder `null`
zurück.

Dadurch gehen wichtige Informationen verloren.

Das LLF kapselt sämtliche Informationen in einem eigenen
Ergebnisobjekt.

Dadurch entstehen:

- klarere APIs
- bessere Fehlermeldungen
- weniger Sonderfälle
- einfachere Erweiterbarkeit

---

# Vorteile

✓ Result Pattern

✓ Immutable Design

✓ Einheitliche Rückgabewerte

✓ Leicht testbar

✓ Erweiterbar

✓ Zukunftssicher

---

# Zukunft des RouteResult

Spätere Versionen können weitere Informationen aufnehmen.

Beispiele:

- Match-Dauer
- Redirect-Ziele
- Middleware-Kontext
- Diagnosedaten
- Debug-Informationen
- Controller-Informationen
- Prioritätsdaten
- Trace-Informationen

Die öffentliche API bleibt dabei stabil.

---

# Changelog

## Version 1.0.0

- Erstveröffentlichung
- Result Pattern eingeführt
- Match-Status
- HTTP-Statuscode
- Parameter-Unterstützung
- JSON-Export

---

# Zukünftige Erweiterungen

□ Redirect-Unterstützung

□ Diagnosedaten

□ Trace-Informationen

□ Performance-Messungen

□ Middleware-Kontext

□ Controller-Metadaten

□ Request-ID

□ Fehlercodes

□ Internationalisierte Meldungen

□ Erweiterte Statistik

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ RouteMatcher.md

→ Router.md

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