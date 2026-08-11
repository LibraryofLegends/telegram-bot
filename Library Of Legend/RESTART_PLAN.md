# Library Of Legends — Clean Restart

This repository is intentionally minimal. The previous archive contained 404 TypeScript source files, multiple duplicate implementations, two database systems, and parallel Telegram/post-builder implementations.

## Phase order

1. Foundation and startup
2. Telegram receive pipeline
3. Filename parsing
4. PostgreSQL persistence
5. TMDB enrichment
6. Movie post layout
7. Series + episode post layout
8. Forum topic persistence
9. Search and Netflix-style UI
10. Optional users/favorites/progress

No later phase is introduced until the current phase builds and is tested.
