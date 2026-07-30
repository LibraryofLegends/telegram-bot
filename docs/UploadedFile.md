╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : UploadedFile.md                                        ║
║ Dokument-ID   : LLF-DOC-HTTP-0004                                      ║
║ Zugehörige ID : LLF-HTTP-0004                                          ║
║ Klasse        : UploadedFile                                           ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# UploadedFile

---

# 🚀 Quick Facts

| Eigenschaft | Wert |
|-------------|------|
| Modul | HTTP System |
| Klasse | UploadedFile |
| Typ | Value Object |
| Status | Stable |
| Seit Version | 1.0.0 |
| Abhängigkeiten | Keine |
| Verwendet von | Request |

---

# Übersicht

Die Klasse **UploadedFile** repräsentiert eine über einen HTTP-Request
hochgeladene Datei.

Sie kapselt sämtliche Metadaten einer Upload-Datei und stellt diese
über eine einfache, unveränderliche API bereit.

Die Klasse selbst führt bewusst keine Dateisystemoperationen aus.

---

# Verantwortlichkeit

UploadedFile besitzt genau eine Aufgabe:

Die Beschreibung einer hochgeladenen Datei.

Die Klasse verwaltet:

- Dateiname
- Dateipfad
- MIME-Type
- Dateigröße
- Upload-Fehlercode

Die Klasse übernimmt ausdrücklich **nicht**:

- Dateien verschieben
- Dateien kopieren
- Dateien löschen
- MIME-Type erkennen
- Dateiinhalte lesen

---

# Architektur

```text
HTTP Request
      │
      ▼
 UploadedFile
      │
      ▼
Filesystem
```

UploadedFile dient ausschließlich als Datenobjekt zwischen Request
und Filesystem.

---

# Konstruktor

Die Erstellung erfolgt über das Options Pattern.

```javascript
const file = new UploadedFile({

    name: "poster.jpg",

    path: "/tmp/upload123",

    mimeType: "image/jpeg",

    size: 583920,

    error: 0

});
```

---

# Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| name | string | Ursprünglicher Dateiname |
| path | string | Temporärer Dateipfad |
| mimeType | string | MIME-Type |
| size | number | Dateigröße in Byte |
| error | number | Upload-Fehlercode |
| isValid | boolean | Upload erfolgreich |

---

# Öffentliche API

## name

Liefert den Dateinamen.

---

## path

Liefert den temporären Dateipfad.

---

## mimeType

Liefert den MIME-Type.

---

## size

Liefert die Dateigröße.

---

## error

Liefert den Upload-Fehlercode.

---

## isValid

Prüft, ob der Upload erfolgreich war.

```javascript
if (

    file.isValid

) {

    // Datei kann verarbeitet werden

}
```

---

## toJSON()

Exportiert sämtliche Dateiinformationen.

```javascript
const json = file.toJSON();
```

---

# Beispiel

```javascript
const file = new UploadedFile({

    name: "avatar.png",

    path: "/tmp/php123",

    mimeType: "image/png",

    size: 24581

});

console.log(file.name);

console.log(file.mimeType);

console.log(file.isValid);
```

Ausgabe:

```text
avatar.png

image/png

true
```

---

# Validierung

Beim Erstellen werden sämtliche Eingaben überprüft.

## Dateiname

- muss ein String sein
- darf nicht leer sein

---

## Dateipfad

- muss ein String sein
- darf nicht leer sein

---

## MIME-Type

- muss ein String sein

---

## Dateigröße

- muss eine positive Ganzzahl oder 0 sein

---

## Fehlercode

- muss eine Ganzzahl ≥ 0 sein

---

# Designentscheidung

UploadedFile ist bewusst als Value Object implementiert.

Es speichert ausschließlich Metadaten.

Operationen auf Dateien gehören in eine zukünftige
Filesystem-Komponente.

Dadurch ergeben sich:

- klare Verantwortlichkeiten
- bessere Testbarkeit
- austauschbare Speicherlösungen
- saubere Architektur

---

# Vorteile

✅ Single Responsibility

✅ Value Object

✅ Immutable API

✅ Options Pattern

✅ Framework-konform

✅ JSON-Export

---

# Änderungen in Version 1.0.0

- Erstimplementierung
- Options Pattern
- Vollständige Validierung
- Getter ergänzt
- JSON-Export
- Vollständige JSDoc

---

# Zukunft

Geplante Erweiterungen:

- extension
- originalExtension
- guessedExtension
- hash
- checksum
- lastModified
- move()
- copy()
- delete()
- openReadStream()
- openWriteStream()
- imageDimension-Erkennung

---

# Dependency Graph

```text
HTTP Request
      │
      ▼
 UploadedFile
      │
      ▼
Filesystem
```

---

# 🔗 Siehe auch

→ Request.md

→ ParameterBag.md

→ HeaderBag.md

→ CookieBag.md

→ Response.md

---

# Qualitätsstatus

Quick Facts vorhanden..................... ✅

Architektur dokumentiert................. ✅

API vollständig beschrieben.............. ✅

Validierung dokumentiert................. ✅

Beispiele vorhanden...................... ✅

Designentscheidung erläutert............. ✅

Dependency Graph enthalten............... ✅

Version 1.0.0 dokumentiert............... ✅

Framework Ready.......................... ✅