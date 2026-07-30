╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteMatcher.md                                        ║
║ Dokument-ID   : LLF-DOC-ROUTING-0007                                   ║
║ Zugehörige ID : LLF-ROUTING-0007                                       ║
║ Klasse        : RouteMatcher                                           ║
║ Version       : 1.0.0                                                  ║
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
| Typ | Matching Strategy |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | RouteCollection |
| Verwendet von | Router |

---

# Übersicht

Die Klasse **RouteMatcher** ist für das Auffinden der passenden Route
innerhalb einer RouteCollection verantwortlich.

Sie stellt den eigentlichen Matching-Algorithmus des Routing-Systems
bereit und entscheidet anhand der HTTP-Methode sowie des URI-Pfades,
welche Route zu einer eingehenden Anfrage gehört.

Der Router delegiert diese Aufgabe vollständig an den RouteMatcher.

---

# Verantwortlichkeit

RouteMatcher besitzt genau eine Aufgabe:

Eine passende Route finden.

Die Klasse

✓ durchsucht die RouteCollection

✓ vergleicht HTTP-Methoden

✓ vergleicht URI-Pfade

✓ liefert das Matching-Ergebnis

Sie verarbeitet keine Requests und erzeugt keine Responses.

---

# Architektur

```text
            Router
               │
               ▼
        RouteMatcher
               │
               ▼
       RouteCollection
               │
       ┌───────┴────────┐
       ▼                ▼
     Route            Route
```

Dadurch bleibt der Router klein und konzentriert sich ausschließlich auf
die Steuerung des Routing-Prozesses.

---

# Eigenschaften

Die Klasse besitzt keine persistenten Eigenschaften.

Sie arbeitet vollständig zustandslos (Stateless).

Dadurch kann dieselbe Instanz beliebig oft wiederverwendet werden.

---

# Öffentliche API

## match()

Durchsucht eine RouteCollection nach einer passenden Route.

Parameter

| Name | Typ |
|------|-----|
| routes | RouteCollection |
| method | string |
| path | string |

Rückgabe

```text
Route|null
```

---

## has()

Prüft, ob eine passende Route existiert.

Rückgabe

```text
boolean
```

---

# Beispiel

```javascript
const matcher = new RouteMatcher();

const route = matcher.match(

    routes,

    "GET",

    "/users"

);

if (route) {

    console.log(route.name);

}
```

---

# Matching-Ablauf

```text
HTTP Request

        │

        ▼

HTTP-Methode vergleichen

        │

        ▼

URI vergleichen

        │

        ▼

Route gefunden?

      │       │

     Ja      Nein

      │       │

      ▼       ▼

   Route     null
```

---

# Verwendet von

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

Router
```

---

# Designentscheidung

Warum existiert RouteMatcher?

Viele Frameworks integrieren das Matching direkt in den Router.

Dadurch wächst der Router mit jeder neuen Funktion.

Das LLF trennt diese Verantwortlichkeiten bewusst.

RouteMatcher kümmert sich ausschließlich um das Finden einer Route.

Router kümmert sich ausschließlich um den Ablauf.

Diese Aufteilung erleichtert:

- Testbarkeit
- Erweiterbarkeit
- Austausch verschiedener Matching-Strategien
- Performanceoptimierungen

---

# Vorteile

✓ Stateless

✓ Wiederverwendbar

✓ Austauschbar

✓ Sehr gut testbar

✓ Klare Verantwortlichkeit

✓ SOLID-konform

---

# Zukunft des Matchers

Die aktuelle Version verwendet einen einfachen linearen Vergleich.

Spätere Versionen können leistungsfähigere Algorithmen integrieren.

Beispiele:

- reguläre Ausdrücke
- Parameter-Matching
- Wildcards
- Trie-Strukturen
- vorkompilierte Routing-Tabellen
- Cache-Optimierungen

Die öffentliche API bleibt dabei unverändert.

---

# Changelog

## Version 1.0.0

- Erstveröffentlichung
- URI-Matching
- HTTP-Methodenvergleich
- Zustandslose Architektur
- Wiederverwendbare Matching-Strategie

---

# Zukünftige Erweiterungen

□ RouteResult-Unterstützung

□ Parameterauflösung

□ Reguläre Ausdrücke

□ Wildcards

□ Optionale Parameter

□ Domain-Matching

□ Locale-Matching

□ Prioritätsregeln

□ Compiled Routing

□ Matching-Statistiken

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

Dokument vollständig...................... ✅

Architektur beschrieben................... ✅

API dokumentiert.......................... ✅

Matching-Ablauf dokumentiert.............. ✅

Dependency Graph enthalten................ ✅

Designentscheidung erläutert.............. ✅

Framework Ready........................... ✅