# 📋 NAMING_CONVENTIONS.md

# Library Of Legends 2.0

**Version:** 2.0  
**Status:** Official Naming Conventions

---

# 1. Ziel

Dieses Dokument definiert die offiziellen Namenskonventionen für das gesamte Projekt.

Alle Dateien, Ordner, Klassen, Funktionen, Variablen, Tabellen und Datenbankobjekte folgen diesen Regeln.

---

# 2. Grundprinzipien

Namen sollen:

- eindeutig sein
- verständlich sein
- konsistent sein
- englisch sein
- Abkürzungen vermeiden

---

# 3. Ordner

Ordnernamen werden ausschließlich klein geschrieben.

Beispiele:

```text
app
config
database
docs
domains
integrations
layouts
logger
scripts
services
shared
tests
utils
```

---

# 4. Dateien

Dateien verwenden:

```text
entity.type.js
```

Beispiele:

```text
movie.service.js

movie.repository.js

movie.validator.js

movie.layout.js

movie.routes.js

movie.constants.js

movie.mapper.js
```

---

# 5. JavaScript-Funktionen

Verwenden camelCase.

Beispiele:

```javascript
getMovie()

saveMovie()

deleteMovie()

findMovie()

assignMovieToCollection()

createLibraryId()
```

---

# 6. Variablen

camelCase

Beispiele:

```javascript
movie

movieId

collection

collectionId

releaseDate
```

---

# 7. Konstanten

UPPER_CASE

Beispiele:

```javascript
DEFAULT_LANGUAGE

MAX_RESULTS

SUPPORTED_FORMATS

MEDIA_TYPES

CACHE_TIMEOUT
```

---

# 8. Klassen

PascalCase

Beispiele:

```javascript
MovieService

MovieRepository

MovieLayout

MovieValidator
```

---

# 9. Datenbanktabellen

snake_case

Plural.

Beispiele:

```text
media_items

movies

series

seasons

episodes

collections

genres

people

studios

files
```

---

# 10. Datenbankspalten

snake_case

Beispiele:

```text
library_id

media_type

release_date

created_at

updated_at

poster_path

backdrop_path
```

---

# 11. Primärschlüssel

Immer:

```text
id
```

---

# 12. Fremdschlüssel

Immer:

```text
<tabelle>_id
```

Beispiele:

```text
movie_id

genre_id

collection_id

series_id

season_id
```

---

# 13. Join-Tabellen

Alphabetisch oder nach Hauptentität benennen.

Beispiele:

```text
movie_genres

movie_people

movie_studios

movie_collections

series_genres

series_people
```

---

# 14. Indizes

Format:

```text
idx_<tabelle>_<spalte>
```

Beispiele:

```text
idx_movies_tmdb_id

idx_media_items_title

idx_collections_slug
```

---

# 15. Foreign Keys

Format:

```text
fk_<quelle>_<ziel>
```

Beispiele:

```text
fk_movies_media_items

fk_movie_people_people

fk_movie_people_movies
```

---

# 16. Unique Constraints

Format:

```text
uq_<tabelle>_<spalte>
```

Beispiele:

```text
uq_media_items_library_id

uq_collections_slug
```

---

# 17. Check Constraints

Format:

```text
chk_<tabelle>_<regel>
```

Beispiele:

```text
chk_movies_runtime

chk_media_items_media_type
```

---

# 18. Migrationen

Format:

```text
001_media_items.sql

002_movies.sql

003_series.sql
```

Immer dreistellige Nummerierung.

---

# 19. Dokumente

Großbuchstaben mit Unterstrich.

Beispiele:

```text
README.md

CHANGELOG.md

ARCHITECTURE_STANDARD.md

DATABASE_STANDARD.md

JAVASCRIPT_STANDARD.md

MODULE_STANDARD.md
```

---

# 20. Grundregel

Wenn Unsicherheit besteht:

- Lesbarkeit vor Kürze
- Verständlichkeit vor Abkürzungen
- Konsistenz vor persönlichem Stil

Alle neuen Dateien und Module müssen diesen Namenskonventionen folgen.

---

# Dokumentinformationen

Projekt: Library Of Legends 2.0

Dokument: NAMING_CONVENTIONS.md

Version: 2.0

Status: Official