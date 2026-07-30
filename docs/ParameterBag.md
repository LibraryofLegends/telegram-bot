╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : ParameterBag.md                                        ║
║ Dokument-ID   : LLF-DOC-HTTP-0003                                      ║
║ Zugehörige ID : LLF-HTTP-0003                                          ║
║ Klasse        : ParameterBag                                           ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# ParameterBag

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | HTTP System |
| Klasse | ParameterBag |
| Typ | Collection |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Keine |
| Verwendet von | Request, Session, Route, Controller |

---

# Übersicht

Die Klasse **ParameterBag** verwaltet beliebige Schlüssel-Wert-Paare.

Sie dient als universelle Datenstruktur für sämtliche Parameter
innerhalb des Frameworks und stellt eine einheitliche API zum
Speichern, Lesen, Aktualisieren und Entfernen von Werten bereit.

Im Gegensatz zur HeaderBag werden die Schlüssel nicht
normalisiert. Jeder Parameter bleibt exakt unter seinem
ursprünglichen Namen gespeichert.

---

# Verantwortlichkeit

ParameterBag besitzt genau eine Aufgabe:

Die Verwaltung beliebiger Parameter.

Die Klasse übernimmt:

- Speichern
- Lesen
- Aktualisieren
- Löschen
- Exportieren

Die Klasse übernimmt ausdrücklich **nicht**:

- Datentyp-Konvertierung
- Validierung
- Serialisierung komplexer Objekte
- Request-Verarbeitung

---

# Architektur

```text
              Request
             /   |   \
            /    |    \
           ▼     ▼     ▼
      Query   Attributes  Body
           \     |     /
            \    |    /
             ▼   ▼   ▼
          ParameterBag
                 ▲
                 │
             Session
```

ParameterBag dient als gemeinsame Basiskomponente für sämtliche
Parameterquellen des Frameworks.

---

# Konstruktor

```javascript
const parameters = new ParameterBag({

    page: 1,

    search: "Marvel",

    active: true

});
```

Beim Erstellen werden alle Einträge automatisch übernommen.

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| size | number | Anzahl gespeicherter Parameter |
| isEmpty | boolean | Keine Parameter vorhanden |

---

# Öffentliche API

## size

Liefert die Anzahl gespeicherter Parameter.

---

## isEmpty

Prüft, ob Parameter vorhanden sind.

---

## set()

Speichert oder überschreibt einen Parameter.

```javascript
parameters.set(

    "page",

    2

);
```

---

## get()

Liefert einen Parameter.

```javascript
parameters.get("page");
```

Optional kann ein Standardwert angegeben werden.

```javascript
parameters.get(

    "page",

    1

);
```

---

## has()

Prüft, ob ein Parameter existiert.

```javascript
parameters.has("search");
```

---

## remove()

Entfernt einen Parameter.

```javascript
parameters.remove("search");
```

---

## clear()

Entfernt sämtliche Parameter.

```javascript
parameters.clear();
```

---

## all()

Liefert sämtliche Parameter.

```javascript
const values = parameters.all();
```

---

## toJSON()

Exportiert alle Parameter.

```javascript
const json = parameters.toJSON();
```

---

# Beispiel

```javascript
const parameters = new ParameterBag();

parameters
    .set("movie", "Iron Man")
    .set("year", 2008)
    .set("rating", 8.0);

console.log(

    parameters.get("movie")

);

console.log(

    parameters.all()

);
```

Ausgabe:

```javascript
{
    movie: "Iron Man",
    year: 2008,
    rating: 8.0
}
```

---

# Designentscheidung

ParameterBag ist bewusst generisch gehalten.

Sie kennt weder HTTP noch Routing oder Sessions.

Dadurch kann dieselbe Klasse in zahlreichen Bereichen des
Frameworks wiederverwendet werden.

Diese Wiederverwendbarkeit reduziert doppelten Code und sorgt für
eine einheitliche API.

---

# Vorteile

✅ Single Responsibility

✅ Generische Collection

✅ Map-basierte Speicherung

✅ Beliebige Datentypen

✅ Fluent API

✅ Framework-konform

✅ JSON-Export

---

# Änderungen in Version 1.0.0

- Erstimplementierung
- Map als interne Speicherung
- Unterstützung beliebiger Datentypen
- Fluent API
- JSON-Export
- Vollständige JSDoc

---

# Zukunft

Geplante Erweiterungen:

- getString()
- getNumber()
- getBoolean()
- getArray()
- getObject()
- merge()
- replace()
- filter()
- map()
- Iterator-Unterstützung
- Dot-Notation (`user.name`)
- Verschachtelte Parameter

---

# Dependency Graph

```text
              Request
             /   |   \
            ▼    ▼    ▼
      Query Body Attributes
            \    |    /
             ▼   ▼   ▼
          ParameterBag
                 ▲
                 │
             Session
```

---

# 🔗 Siehe auch

→ RequestMethod.md

→ HeaderBag.md

→ CookieBag.md

→ Request.md

→ Response.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Beispiele vorhanden...................... ✅

Designentscheidung erläutert............. ✅

Dependency Graph enthalten............... ✅

Version 1.0.0 dokumentiert............... ✅

Framework Ready.......................... ✅