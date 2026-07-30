╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteParameter.md                                      ║
║ Dokument-ID   : LLF-DOC-ROUTING-0002                                   ║
║ Zugehörige ID : LLF-ROUTING-0002                                       ║
║ Klasse        : RouteParameter                                         ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteParameter

## Übersicht

Die Klasse **RouteParameter** repräsentiert einen einzelnen
Routenparameter innerhalb des Routing-Systems des
Library Of Legends Frameworks.

Ein Parameter besteht aus:

- Name
- Wert
- optionaler Validierungsregel (Constraint)

Die Klasse besitzt keinerlei Routinglogik und dient ausschließlich
als Datenobjekt (Value Object).

---

# Verantwortlichkeit

RouteParameter ist ausschließlich für die Verwaltung eines
einzelnen Parameters zuständig.

Die Klasse kennt weder Router noch RouteCollection
oder Controller.

Dadurch bleibt sie vollständig unabhängig und
beliebig wiederverwendbar.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| name | string | Name des Parameters |
| value | mixed | Aktueller Wert |
| constraint | RegExp \| null | Validierungsregel |

---

# Öffentliche API

## constructor()

Erstellt einen neuen Parameter.

Beispiel

```javascript
const parameter = new RouteParameter(
    "id",
    15
);
```

---

## name

Liefert den Parameternamen.

Beispiel

```javascript
parameter.name;

// id
```

---

## value

Liefert den aktuellen Wert.

Beispiel

```javascript
parameter.value;

// 15
```

---

## value = ...

Ändert den Parameterwert.

Beispiel

```javascript
parameter.value = 42;
```

---

## constraint

Liefert den aktuellen Constraint.

Beispiel

```javascript
parameter.constraint;
```

---

## isValid()

Prüft den Parameter gegen den
definierten Constraint.

Beispiel

```javascript
const parameter = new RouteParameter(
    "id",
    25,
    /^\d+$/
);

parameter.isValid();

// true
```

---

## toJSON()

Exportiert den Parameter.

Beispiel

```javascript
{
    name: "id",
    value: 25,
    hasConstraint: true,
    valid: true
}
```

---

# Anwendungsbeispiele

## Benutzerprofil

```javascript
const id = new RouteParameter(
    "id",
    8
);
```

---

## Artikel

```javascript
const slug = new RouteParameter(
    "slug",
    "hello-world"
);
```

---

## UUID

```javascript
const uuid = new RouteParameter(
    "uuid",
    "...",
    /^[0-9a-f-]+$/i
);
```

---

# Verwendet von

✓ Route

✓ RouteCollection

✓ Router

---

# Dependency Graph

RouteParameter

↓

Route

↓

RouteCollection

↓

Router

---

# Designentscheidung

Warum eine eigene Klasse?

Viele Frameworks behandeln Parameter lediglich
als Strings.

Das LLF verwendet stattdessen eigene Objekte.

Dadurch können Parameter zukünftig wesentlich
mehr Informationen enthalten als lediglich
einen Namen und einen Wert.

Dies erleichtert spätere Erweiterungen erheblich.

---

# Vorteile

✓ Wiederverwendbar

✓ Typunabhängig

✓ Eigene Validierung

✓ Erweiterbar

✓ Saubere Architektur

✓ SOLID-konform

---

# Changelog

Version 1.0.0

- Erstveröffentlichung
- Name
- Wert
- Constraint
- Validierung
- JSON-Export

---

# Zukünftige Erweiterungen

□ Standardwerte

□ Optionale Parameter

□ Typprüfung

□ UUID-Unterstützung

□ Enum-Unterstützung

□ Mehrere Constraints

□ Parameter-Konverter

□ Automatische Typumwandlung

□ URL-Encoding

□ URL-Decoding

---

# Siehe auch

→ RouteMethod.md

→ Route.md

→ RouteCollection.md

→ RouteGroup.md

→ Router.md

---

# Qualitätsstatus

Dokument vollständig..................... ✅

Architektur beschrieben................. ✅

Eigenschaften dokumentiert.............. ✅

API dokumentiert........................ ✅

Beispiele vorhanden..................... ✅

Dependency Graph enthalten.............. ✅

Siehe auch vorhanden.................... ✅

Framework Ready......................... ✅