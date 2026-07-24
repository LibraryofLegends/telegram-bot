# 📘 DOMAIN_MODEL.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Domain Model

---

# 1. Ziel

Dieses Dokument beschreibt das fachliche Datenmodell von Library Of Legends 2.0.

Alle Entitäten, Beziehungen und Module basieren auf diesem Modell.

Neue Medientypen werden ausschließlich über dieses Domain Model erweitert.

---

# 2. Basismodell

Alle Medien basieren auf einer gemeinsamen Entität.

```text
MediaItem
```

MediaItem enthält alle Eigenschaften, die für sämtliche Medienarten gelten.

---

# 3. Vererbungsmodell

```text
MediaItem

├── Movie
├── Series
├── Music
├── Comic
├── Manga
├── Audiobook
├── Audio Drama
├── Documentary
├── Short Film
└── Animation
```

Neue Medientypen können jederzeit ergänzt werden.

---

# 4. MediaItem

MediaItem enthält allgemeine Informationen.

Beispiele:

- Library ID
- Titel
- Originaltitel
- Medientyp
- Beschreibung
- Erscheinungsdatum
- Laufzeit
- Sprache
- Land
- Poster
- Backdrop
- Cover
- Status
- Bewertung
- Altersfreigabe
- Erstellt am
- Aktualisiert am

---

# 5. Movie

Movie erweitert MediaItem.

Zusätzliche Informationen:

- TMDB ID
- IMDb ID
- Budget
- Einnahmen
- Produktionsstatus

---

# 6. Series

Series erweitert MediaItem.

Zusätzliche Informationen:

- Anzahl Staffeln
- Anzahl Episoden
- Laufend
- Abgeschlossen

---

# 7. Season

Eine Serie besitzt mehrere Staffeln.

Season enthält:

- Staffelnummer
- Titel
- Beschreibung
- Poster
- Erscheinungsdatum

---

# 8. Episode

Eine Staffel besitzt mehrere Episoden.

Episode enthält:

- Episodennummer
- Titel
- Laufzeit
- Beschreibung
- Erscheinungsdatum

---

# 9. Collection

Collections gruppieren mehrere Filme.

Beispiele:

- Harry Potter
- Fast & Furious
- Jurassic Park
- Alien
- Marvel Phase 1

---

# 10. Universe

Universes beschreiben zusammenhängende Welten.

Beispiele:

- Marvel Cinematic Universe
- DC Universe
- Wizarding World
- Star Wars
- Star Trek

Ein Universe kann mehrere Collections enthalten.

---

# 11. Genre

Genres beschreiben Inhalte.

Beispiele:

- Action
- Abenteuer
- Horror
- Komödie
- Fantasy
- Science Fiction
- Thriller
- Animation

Ein Medium besitzt beliebig viele Genres.

---

# 12. Person

Eine Person kann verschiedene Rollen besitzen.

Beispiele:

- Schauspieler
- Regisseur
- Produzent
- Drehbuchautor
- Komponist

Eine Person kann an beliebig vielen Medien beteiligt sein.

---

# 13. Studio

Ein Studio produziert Medien.

Beispiele:

- Marvel Studios
- Warner Bros.
- Universal Pictures
- Paramount Pictures
- Disney

Ein Studio produziert beliebig viele Medien.

---

# 14. Language

Sprachen.

Beispiele:

- Deutsch
- Englisch
- Französisch
- Japanisch

Ein Medium besitzt mehrere Sprachen.

---

# 15. Country

Produktionsländer.

Beispiele:

- Deutschland
- USA
- Großbritannien
- Japan

Ein Medium kann mehreren Ländern zugeordnet werden.

---

# 16. Rating

Bewertungen.

Beispiele:

- TMDB
- IMDb
- Rotten Tomatoes
- Metacritic

Ein Medium besitzt mehrere Bewertungen.

---

# 17. File

Beschreibt die eigentliche Mediendatei.

Beispiele:

- Dateiname
- Dateigröße
- Auflösung
- Video Codec
- Audio Codec
- Bitrate
- HDR
- Quelle
- Container

Ein Medium kann mehrere Dateien besitzen.

---

# 18. Subtitle

Untertitel.

Beispiele:

- Deutsch
- Englisch
- Französisch

Mehrere Untertitel pro Datei möglich.

---

# 19. Audio Track

Tonspuren.

Beispiele:

- Deutsch
- Englisch
- DTS-HD
- Dolby Atmos
- AAC

Mehrere Audiospuren pro Datei möglich.

---

# 20. Tag

Freie Schlagwörter.

Beispiele:

- Weihnachten
- Kultfilm
- Oscar
- Klassiker
- Neu

Beliebig viele Tags pro Medium.

---

# 21. Playlist

Benutzerdefinierte Sammlungen.

Beispiele:

- Meine Favoriten
- Heute Abend
- Kinderfilme
- Halloween

---

# 22. User

Benutzer des Systems.

Ein Benutzer besitzt:

- Favoriten
- Playlists
- Verlauf
- Bewertungen

---

# 23. Beziehungen

```text
MediaItem

├── Genres
├── Collections
├── Universes
├── Studios
├── People
├── Languages
├── Countries
├── Ratings
├── Files
├── Tags

Movie

└── Collections

Series

├── Seasons

│

└── Episodes

Files

├── Audio Tracks

└── Subtitles
```

---

# 24. Erweiterbarkeit

Neue Medientypen können jederzeit ergänzt werden.

Beispiele:

- Games
- Podcasts
- Magazine
- E-Books
- Live-Konzerte

Das bestehende Modell muss dafür nicht verändert werden.

---

# 25. Grundprinzip

Das Domain Model bildet die fachliche Grundlage des gesamten Projekts.

Datenbank, Repositorys, Services und Controller orientieren sich ausschließlich an diesem Modell.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: DOMAIN_MODEL.md

Version: 2.0

Status: Official