# 📋 CODING_WORKFLOW.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Development Workflow

---

# 1. Ziel

Dieses Dokument definiert den offiziellen Entwicklungsablauf von Library Of Legends 2.0.

Alle neuen Funktionen, Module und Erweiterungen werden nach diesem Workflow entwickelt.

Der Ablauf soll:

- Fehler vermeiden
- Doppelarbeit verhindern
- Einheitliche Qualität gewährleisten
- Langfristige Wartbarkeit sicherstellen

---

# 2. Grundprinzip

Bevor Code geschrieben wird, wird zuerst geplant.

Jede Entwicklung durchläuft dieselben Phasen.

---

# 3. Entwicklungsablauf

```text
Idee

↓

Analyse

↓

Planung

↓

Dokumentation

↓

Domain Model

↓

Datenbank

↓

Repository

↓

Service

↓

Controller

↓

Layout

↓

Tests

↓

Dokumentation aktualisieren

↓

Freigabe
```

---

# 4. Phase 1 – Analyse

Vor jeder Entwicklung wird geprüft:

- Welches Problem soll gelöst werden?
- Welche bestehenden Module sind betroffen?
- Kann vorhandener Code wiederverwendet werden?
- Gibt es Auswirkungen auf andere Bereiche?

---

# 5. Phase 2 – Planung

Vor dem Programmieren wird festgelegt:

- Ziel
- Architektur
- Verantwortlichkeiten
- Modulaufbau
- Datenmodell

Erst danach beginnt die Umsetzung.

---

# 6. Phase 3 – Dokumentation

Vor größeren Änderungen werden die entsprechenden Dokumente geprüft und bei Bedarf erweitert.

Beispiele:

- DOMAIN_MODEL.md
- DATABASE_STANDARD.md
- ARCHITECTURE_STANDARD.md

---

# 7. Phase 4 – Datenmodell

Falls neue Daten benötigt werden:

- Neue Entitäten definieren
- Beziehungen festlegen
- Auswirkungen prüfen

---

# 8. Phase 5 – Datenbank

Falls notwendig:

- Neue Migration erstellen
- Tabellen ergänzen
- Indizes anlegen
- Constraints definieren

Vorhandene Migrationen werden nicht verändert.

---

# 9. Phase 6 – Repository

Anschließend erfolgt die Datenbankanbindung.

Repositorys enthalten ausschließlich:

- SQL
- CRUD-Operationen
- Datenbankzugriffe

Keine Geschäftslogik.

---

# 10. Phase 7 – Service

Der Service implementiert die Geschäftslogik.

Beispiele:

- Validierungen
- Berechnungen
- Kombination mehrerer Repositorys
- Regeln

---

# 11. Phase 8 – Controller

Der Controller verbindet Benutzeranfragen mit dem Service.

Aufgaben:

- Requests entgegennehmen
- Service aufrufen
- Antworten zurückgeben

Keine Geschäftslogik.

---

# 12. Phase 9 – Layout

Layouts erzeugen die Ausgabe.

Beispiele:

- Telegram-Posts
- Nachrichten
- Karten
- Menüs

Layouts enthalten keine SQL-Abfragen.

---

# 13. Phase 10 – Tests

Vor der Freigabe wird geprüft:

- Funktioniert die neue Funktion?
- Gibt es Seiteneffekte?
- Stimmen Datenbankzugriffe?
- Stimmen Layouts?

---

# 14. Phase 11 – Dokumentation

Nach Abschluss werden alle betroffenen Dokumente aktualisiert.

Beispiele:

- CHANGELOG.md
- SCHEMA_OVERVIEW.md
- DOMAIN_MODEL.md

---

# 15. Phase 12 – Freigabe

Erst nach erfolgreicher Prüfung gilt eine Funktion als abgeschlossen.

---

# 16. Grundregeln

Während der Entwicklung gelten folgende Regeln:

- Erst analysieren
- Dann planen
- Danach dokumentieren
- Erst dann programmieren

Qualität hat Vorrang vor Geschwindigkeit.

---

# 17. Änderungsregeln

Bestehende Module werden nur geändert, wenn es notwendig ist.

Neue Funktionen werden bevorzugt durch Erweiterungen umgesetzt.

---

# 18. Dokumentationspflicht

Jede größere Änderung muss dokumentiert werden.

Mindestens:

- Datenbank
- Architektur
- Changelog

---

# 19. Entwicklungsprinzipien

Library Of Legends 2.0 folgt folgenden Grundsätzen:

- Qualität vor Geschwindigkeit
- Planung vor Implementierung
- Lesbarkeit vor Kürze
- Wiederverwendbarkeit vor Kopieren
- Dokumentation ist Bestandteil der Entwicklung
- Standards gelten projektweit

---

# 20. Workflow-Übersicht

```text
Idee
   │
   ▼
Analyse
   │
   ▼
Planung
   │
   ▼
Dokumentation
   │
   ▼
Domain Model
   │
   ▼
Datenbank
   │
   ▼
Repository
   │
   ▼
Service
   │
   ▼
Controller
   │
   ▼
Layout
   │
   ▼
Tests
   │
   ▼
Dokumentation aktualisieren
   │
   ▼
Freigabe
```

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: CODING_WORKFLOW.md

Version: 2.0

Status: Official