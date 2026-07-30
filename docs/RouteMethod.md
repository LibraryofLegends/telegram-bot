╔══════════════════════════════════════════════════════════════════════════╗
║                     🚀 Library Of Legends Framework                     ║
║                           Entwicklerdokumentation                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║ Dokument      : RouteMethod.md                                         ║
║ Dokument-ID   : LLF-DOC-ROUTING-0001                                   ║
║ Zugehörige ID : LLF-ROUTING-0001                                       ║
║ Klasse        : RouteMethod                                            ║
║ Version       : 1.0.0                                                  ║
║ Status        : Stable                                                 ║
║ Erstellt      : 30.07.2026                                             ║
║ Autor         : Mr. Library Of Legends                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

# RouteMethod

## Übersicht

Die Klasse **RouteMethod** definiert sämtliche HTTP-Methoden, die vom
Library Of Legends Framework unterstützt werden.

Sie dient als zentrale Referenz für das gesamte Routing-System und stellt
Hilfsfunktionen zur Validierung und Normalisierung bereit.

---

# Verantwortlichkeit

Die Klasse ist ausschließlich für HTTP-Methoden zuständig.

Sie übernimmt keine Routinglogik.

Dadurch bleibt sie vollständig unabhängig vom Router.

---

# Unterstützte Methoden

| HTTP-Methode | Beschreibung |
|--------------|--------------|
| GET | Daten abrufen |
| POST | Neue Daten erstellen |
| PUT | Ressourcen vollständig ersetzen |
| PATCH | Ressourcen teilweise ändern |
| DELETE | Ressourcen löschen |
| OPTIONS | Serverfähigkeiten abfragen |
| HEAD | Headerinformationen abrufen |
| TRACE | HTTP-Diagnose |
| CONNECT | Tunnelverbindungen |

---

# Öffentliche API

## all()

Liefert sämtliche unterstützten HTTP-Methoden.

Rückgabe:

```javascript
[
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
    "HEAD",
    "TRACE",
    "CONNECT"
]