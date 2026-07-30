╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteCollection.md                                     ║
║ Dokument-ID   : LLF-DOC-ROUTING-0005                                   ║
║ Zugehörige ID : LLF-ROUTING-0005                                       ║
║ Klasse        : RouteCollection                                        ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteCollection

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | RouteCollection |
| Typ | Collection |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Route |
| Verwendet von | Router |

---

# Übersicht

Die Klasse **RouteCollection** verwaltet sämtliche registrierten
Routen einer Anwendung.

Sie bildet die zentrale Datenstruktur des Routing-Systems und stellt
Methoden zum Hinzufügen, Suchen, Iterieren und Exportieren von Routen
bereit.

Der Router selbst besitzt keine eigene Routenverwaltung, sondern
arbeitet ausschließlich mit einer RouteCollection.

---

# Verantwortlichkeit

Die Klasse besitzt genau eine Aufgabe:

Die Verwaltung aller registrierten Route-Objekte.

Sie ist verantwortlich für:

- Registrierung neuer Routen
- Verwaltung der Sammlung
- Suche nach Routen
- Bereitstellung eines Iterators
- Export der Collection

Sie enthält **keine Routinglogik** und führt **kein Matching**
durch. Diese Aufgaben gehören ausschließlich zum Router.

---

# Architektur

```text
                 Router
                    │
                    ▼
          RouteCollection
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
      Route                  Route
        │                       │
        ▼                       ▼
RouteDefinition        RouteDefinition
```

Die Collection kapselt sämtliche Route-Objekte und dient als
einzige Datenquelle für den Router.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| routes | Route[] | Registrierte Routen |

---

# Öffentliche API

## add()

Registriert eine neue Route.

```javascript
collection.add(route);
```

---

## clear()

Entfernt sämtliche Routen.

```javascript
collection.clear();
```

---

## isEmpty()

Prüft, ob sich Routen in der Collection befinden.

```javascript
collection.isEmpty();
```

---

## count()

Liefert die Anzahl registrierter Routen.

```javascript
collection.count();
```

---

## all()

Liefert sämtliche Routen.

```javascript
collection.all();
```

---

## findByName()

Sucht eine Route anhand ihres Namens.

```javascript
collection.findByName("users.show");
```

---

## findByMethod()

Liefert sämtliche Routen einer HTTP-Methode.

```javascript
collection.findByMethod("GET");
```

---

## has()

Prüft, ob eine Route existiert.

```javascript
collection.has("users.show");
```

---

## Symbol.iterator

Erlaubt das direkte Durchlaufen der Collection.

```javascript
for (const route of collection) {

}
```

---

## toJSON()

Exportiert sämtliche Routen.

---

# Beispiel

```javascript
const collection = new RouteCollection();

collection

    .add(routeOne)

    .add(routeTwo)

    .add(routeThree);

console.log(

    collection.count()

);
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
Router
```

---

# Designentscheidung

Warum existiert RouteCollection?

Der Router soll ausschließlich Routing durchführen.

Die Verwaltung der Routen wird vollständig ausgelagert.

Dadurch entstehen klar getrennte Verantwortlichkeiten.

Das entspricht den SOLID-Prinzipien, insbesondere dem
**Single Responsibility Principle (SRP)**.

---

# Vorteile

✓ Zentrale Verwaltung

✓ Erweiterbar

✓ Iterator-Unterstützung

✓ Gute Testbarkeit

✓ Wiederverwendbar

✓ Entkoppelter Router

---

# Zukunft der Collection

Die aktuelle Implementierung verwendet intern ein Array.

Spätere Versionen können zusätzliche Indizes einführen.

Beispiele:

- Map nach Routennamen
- Map nach HTTP-Methode
- Map nach URI
- Trie für Pfad-Matching

Dadurch lassen sich Suchoperationen erheblich beschleunigen,
ohne die öffentliche API zu verändern.

---

# Changelog

## Version 1.0.0

- Erstveröffentlichung
- Registrierung von Routen
- Suchfunktionen
- Iterator-Unterstützung
- JSON-Export

---

# Zukünftige Erweiterungen

□ Mehrere Suchindizes

□ Priorisierte Routen

□ Lazy Loading

□ Route-Caching

□ Performance-Metriken

□ Immutable Collections

□ Snapshot-Unterstützung

□ Collection-Events

□ Filter-API

□ Sortierstrategien

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ Route.md

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

Designentscheidung erläutert.............. ✅

Framework Ready........................... ✅