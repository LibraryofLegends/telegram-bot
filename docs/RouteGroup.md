╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteGroup.md                                          ║
║ Dokument-ID   : LLF-DOC-ROUTING-0006                                   ║
║ Zugehörige ID : LLF-ROUTING-0006                                       ║
║ Klasse        : RouteGroup                                             ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteGroup

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | Routing System |
| Klasse | RouteGroup |
| Typ | Builder / Collection |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | RouteDefinition, Route, RouteCollection |
| Verwendet von | Router |

---

# Übersicht

Die Klasse **RouteGroup** fasst mehrere Routen zusammen, die gemeinsame Eigenschaften besitzen.

Anstatt dieselben Informationen für jede Route einzeln zu definieren, können sie zentral auf Gruppenebene angegeben werden.

Beispiele:

- URL-Präfixe
- Middleware
- Metadaten
- API-Versionen
- Berechtigungen

RouteGroup übernimmt diese Eigenschaften automatisch für alle enthaltenen Routen.

---

# Verantwortlichkeit

RouteGroup besitzt genau eine Aufgabe:

Gemeinsame Routeneigenschaften verwalten und beim Registrieren neuer Routen automatisch übernehmen.

Die Klasse führt **kein Routing** und **kein Route-Matching** durch.

---

# Builder-Prinzip

RouteGroup arbeitet als Builder.

Beim Hinzufügen einer Route wird keine vorhandene Definition verändert.

Stattdessen erzeugt die Gruppe automatisch eine neue `RouteDefinition`, in die alle Gruppeneigenschaften übernommen werden.

Dadurch bleiben ursprüngliche Definitionen unverändert.

---

# Architektur

```text
             RouteGroup

        Prefix

        Middleware

        Metadata

              │

              ▼

      RouteDefinition

              │

              ▼

            Route
```

Die Gruppenkonfiguration wird während der Erstellung einer Route angewendet.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| prefix | string | Gemeinsamer URI-Präfix |
| middleware | Array | Gruppen-Middleware |
| metadata | Object | Zusätzliche Metadaten |
| routes | RouteCollection | Registrierte Routen |

---

# Öffentliche API

## prefix

Liefert den URI-Präfix.

---

## middleware

Liefert sämtliche Gruppen-Middleware.

---

## metadata

Liefert die Gruppen-Metadaten.

---

## routes

Liefert die interne RouteCollection.

---

## add()

Registriert eine neue Route.

Währenddessen werden

- Präfix
- Middleware
- Metadaten

automatisch übernommen.

Beispiel

```javascript
group.add(routeDefinition);
```

---

## toJSON()

Exportiert die komplette Gruppe.

---

# Beispiel

```javascript
const api = new RouteGroup(

    "/api",

    [

        "auth"

    ]

);

api.add(

    new RouteDefinition(

        "GET",

        "/users",

        "UserController@index"

    )

);
```

Ergebnis

```text
/api/users
```

Die Middleware der Gruppe wird automatisch ergänzt.

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

      ▲

      │

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

Warum existiert RouteGroup?

Große Anwendungen besitzen häufig Hunderte oder Tausende Routen.

Ohne Gruppen müssten gemeinsame Eigenschaften ständig wiederholt werden.

RouteGroup reduziert Redundanz erheblich.

Außerdem ermöglicht sie später verschachtelte Gruppen.

---

# Vorteile

✓ Builder Pattern

✓ Weniger Duplikate

✓ Saubere Konfiguration

✓ Erweiterbar

✓ Leicht testbar

✓ Sehr gute Wartbarkeit

---

# Zukunft der RouteGroup

Spätere Versionen können unterstützen:

- verschachtelte Gruppen
- Namenspräfixe
- Domain-Routing
- Controller-Gruppen
- API-Versionierung
- HTTPS-Gruppen
- Sprachgruppen
- Feature-Flags
- Standardparameter
- Gruppenereignisse

---

# Changelog

## Version 1.0.0

- Erstveröffentlichung
- Prefix-Unterstützung
- Middleware-Vererbung
- Metadaten-Vererbung
- Builder-Architektur
- JSON-Export

---

# Zukünftige Erweiterungen

□ Nested Groups

□ Name Prefixes

□ Domain Routing

□ API Version Groups

□ HTTPS-only Groups

□ Locale Groups

□ Default Parameters

□ Controller Groups

□ Attribute Support

□ Fluent Builder API

---

# 🔗 Siehe auch

→ RouteMethod.md

→ RouteParameter.md

→ RouteDefinition.md

→ Route.md

→ RouteCollection.md

→ RouteMatcher.md

→ Router.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Dokument vollständig...................... ✅

Architektur beschrieben................... ✅

API dokumentiert.......................... ✅

Builder Pattern erläutert................. ✅

Beispiele vorhanden....................... ✅

Dependency Graph enthalten................ ✅

Framework Ready........................... ✅