╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : CookieBag.md                                           ║
║ Dokument-ID   : LLF-DOC-HTTP-0005                                      ║
║ Zugehörige ID : LLF-HTTP-0005                                          ║
║ Klasse        : CookieBag                                              ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# CookieBag

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | HTTP System |
| Klasse | CookieBag |
| Typ | Collection |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Keine |
| Verwendet von | Request, Response |

---

# Übersicht

Die Klasse **CookieBag** verwaltet HTTP-Cookies innerhalb des Frameworks.

Sie speichert Cookies als Schlüssel-Wert-Paare und stellt eine
einheitliche API zum Speichern, Lesen, Aktualisieren, Entfernen und
Exportieren bereit.

CookieBag speichert ausschließlich die eigentlichen Cookie-Werte.

Cookie-Attribute wie Ablaufdatum, Domain oder SameSite gehören nicht
zu dieser Klasse.

---

# Verantwortlichkeit

CookieBag besitzt genau eine Aufgabe:

Die Verwaltung von HTTP-Cookies.

Die Klasse übernimmt:

- Speichern
- Lesen
- Aktualisieren
- Löschen
- Exportieren

Die Klasse übernimmt ausdrücklich **nicht**:

- Cookie-Header erzeugen
- Cookie-Attribute verwalten
- Cookies signieren
- Cookies verschlüsseln
- Ablaufdaten berechnen

---

# Architektur

```text
HTTP Request
      │
      ▼
  CookieBag
      ▲
      │
HTTP Response
```

CookieBag dient als gemeinsame Cookie-Collection sowohl für
eingehende Requests als auch für ausgehende Responses.

---

# Konstruktor

Die Erstellung erfolgt optional mit vorhandenen Cookies.

```javascript
const cookies = new CookieBag({

    session: "abc123",

    theme: "dark",

    language: "de"

});
```

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| size | number | Anzahl gespeicherter Cookies |
| isEmpty | boolean | Keine Cookies vorhanden |

---

# Öffentliche API

## size

Liefert die Anzahl gespeicherter Cookies.

---

## isEmpty

Prüft, ob Cookies vorhanden sind.

---

## set()

Speichert oder überschreibt ein Cookie.

```javascript
cookies.set(

    "theme",

    "dark"

);
```

Alle Werte werden automatisch als String gespeichert.

---

## get()

Liefert den Wert eines Cookies.

```javascript
cookies.get(

    "session"

);
```

Existiert das Cookie nicht, wird `null` zurückgegeben.

---

## has()

Prüft, ob ein Cookie existiert.

```javascript
cookies.has(

    "theme"

);
```

---

## remove()

Entfernt ein Cookie.

```javascript
cookies.remove(

    "theme"

);
```

---

## clear()

Entfernt sämtliche Cookies.

```javascript
cookies.clear();
```

---

## all()

Liefert sämtliche Cookies.

```javascript
const values = cookies.all();
```

---

## toJSON()

Exportiert alle Cookies.

```javascript
const json = cookies.toJSON();
```

---

# Beispiel

```javascript
const cookies = new CookieBag();

cookies
    .set("session", "123456")
    .set("theme", "dark")
    .set("language", "de");

console.log(

    cookies.get("theme")

);

console.log(

    cookies.all()

);
```

Ausgabe:

```javascript
{
    session: "123456",
    theme: "dark",
    language: "de"
}
```

---

# Designentscheidung

CookieBag speichert ausschließlich Cookie-Namen und Cookie-Werte.

HTTP-spezifische Eigenschaften wie

- Expires
- Max-Age
- Path
- Domain
- Secure
- HttpOnly
- SameSite

werden bewusst nicht berücksichtigt.

Diese Informationen gehören in eine spätere Klasse wie beispielsweise:

- Cookie
- SetCookie
- CookieFactory

Dadurch bleibt CookieBag eine einfache Collection.

---

# Vorteile

✅ Single Responsibility

✅ Einheitliche Collection-API

✅ Map-basierte Speicherung

✅ Fluent API

✅ Framework-konform

✅ JSON-Export

---

# Änderungen in Version 1.0.0

- Erstimplementierung
- Map-basierte Speicherung
- Fluent API
- Automatische String-Konvertierung
- JSON-Export
- Vollständige JSDoc

---

# Zukunft

Geplante Erweiterungen:

- Cookie Value Object
- SetCookie Builder
- CookieFactory
- Signed Cookies
- Encrypted Cookies
- SameSite-Unterstützung
- HttpOnly-Unterstützung
- Secure-Unterstützung
- CookieParser
- CookieSerializer

---

# Dependency Graph

```text
HTTP Request
      │
      ▼
  CookieBag
      ▲
      │
HTTP Response
```

---

# 🔗 Siehe auch

→ HeaderBag.md

→ ParameterBag.md

→ UploadedFile.md

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