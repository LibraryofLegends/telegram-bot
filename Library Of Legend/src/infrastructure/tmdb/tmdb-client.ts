/*
===============================================================================
                            PROJECT PHOENIX
===============================================================================
Component...........: TMDBClient
Architecture Layer..: Infrastructure
Module..............: TMDB
Module ID...........: LOL-MOD-TMDB-0001
LOL-ID..............: LOL-TMDB-0001
File................: tmdb-client.ts
Location............: Library Of Legends/src/infrastructure/tmdb/
Version.............: 1.0.0
Status..............: Core
Lifecycle...........: Production
Description.........: Minimal TMDB client with movie/TV matching and metadata.
===============================================================================
*/

import https from "https";

export interface TMDBCastMember {
  id: number;
  name: string;
  character?: string;
}

export interface TMDBMetadata {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  year?: number;
  overview?: string;
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres: Array<{ id: number; name: string }>;
  cast: TMDBCastMember[];
  runtime?: number;
  status?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export class TMDBClient {
  public constructor(private readonly apiKey?: string) {}

  public async findMovie(title: string, year?: number): Promise<TMDBMetadata | undefined> {
    return this.find("movie", title, year);
  }

  public async findSeries(title: string, year?: number): Promise<TMDBMetadata | undefined> {
    return this.find("tv", title, year);
  }

  private async find(type: "movie" | "tv", title: string, year?: number): Promise<TMDBMetadata | undefined> {
    if (!this.apiKey || !title.trim()) return undefined;

    const endpoint = type === "movie" ? "/search/movie" : "/search/tv";
    const params: Record<string, string | number> = {
      api_key: this.apiKey,
      language: "de-DE",
      query: title.trim()
    };
    if (year) params[type === "movie" ? "year" : "first_air_date_year"] = year;

    const search = await this.request<{ results: any[] }>(endpoint, params);
    const results = search?.results || [];
    if (!results.length) return undefined;

    const best = this.pickBest(results, year);
    if (!best?.id) return undefined;

    const details = await this.request<any>(`/${type}/${best.id}`, {
      api_key: this.apiKey,
      language: "de-DE",
      append_to_response: "credits"
    });

    return details ? this.normalize(details, type) : undefined;
  }

  private pickBest(results: any[], year?: number): any | undefined {
    if (year) {
      const exact = results.find((item) => {
        const raw = item.release_date || item.first_air_date || "";
        return String(raw).startsWith(String(year));
      });
      if (exact) return exact;
    }
    return [...results].sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0))[0];
  }

  private normalize(item: any, type: "movie" | "tv"): TMDBMetadata {
    const releaseDate = item.release_date || item.first_air_date || "";
    const cast = Array.isArray(item.credits?.cast)
      ? item.credits.cast.slice(0, 10).map((person: any) => ({ id: Number(person.id), name: String(person.name || ""), character: person.character || undefined }))
      : [];

    return {
      id: Number(item.id),
      mediaType: type,
      title: String(item.title || item.name || item.original_title || item.original_name || "Unbekannter Titel"),
      year: releaseDate ? Number(String(releaseDate).slice(0, 4)) : undefined,
      overview: item.overview || undefined,
      rating: Number.isFinite(Number(item.vote_average)) ? Number(item.vote_average) : undefined,
      posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w780${item.poster_path}` : undefined,
      backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : undefined,
      genres: Array.isArray(item.genres) ? item.genres.map((g: any) => ({ id: Number(g.id), name: String(g.name || "") })) : [],
      cast,
      runtime: Number.isFinite(Number(item.runtime)) ? Number(item.runtime) : undefined,
      status: item.status || undefined,
      numberOfSeasons: Number.isFinite(Number(item.number_of_seasons)) ? Number(item.number_of_seasons) : undefined,
      numberOfEpisodes: Number.isFinite(Number(item.number_of_episodes)) ? Number(item.number_of_episodes) : undefined
    };
  }

  private async request<T>(endpoint: string, params: Record<string, string | number>): Promise<T | undefined> {
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

    return new Promise<T | undefined>((resolve) => {
      const request = https.get(url, { headers: { Accept: "application/json" } }, (response) => {
        let data = "";
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => {
          if ((response.statusCode || 0) < 200 || (response.statusCode || 0) >= 300) { resolve(undefined); return; }
          try { resolve(JSON.parse(data) as T); } catch { resolve(undefined); }
        });
      });
      request.setTimeout(15000, () => { request.destroy(); resolve(undefined); });
      request.on("error", () => resolve(undefined));
    });
  }
}