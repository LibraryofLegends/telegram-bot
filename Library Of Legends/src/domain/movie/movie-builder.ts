/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieBuilder

Architecture Layer..: Domain

Module..............: Movie

Module ID...........: LOL-MOD-MOV-0001

LOL-ID..............: LOL-MOV-0002

File................: movie-builder.ts

Location............
Library Of Legends/src/domain/movie/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Builder for creating valid Movie entities.

===============================================================================
*/

import { Movie } from "./movie";
import { MovieId } from "./movie-id";

import { Title } from "../../shared/domain/value-objects/title";
import { Year } from "../../shared/domain/value-objects/year";
import { Runtime } from "../../shared/domain/value-objects/runtime";
import { MediaMetadata } from "../../shared/domain/value-objects/media-metadata";

export class MovieBuilder {

    private id?: MovieId;
    private title?: Title;
    private year?: Year;
    private runtime?: Runtime;
    private metadata?: MediaMetadata;

    public withId(id: MovieId): this {
        this.id = id;
        return this;
    }

    public withTitle(title: Title): this {
        this.title = title;
        return this;
    }

    public withYear(year: Year): this {
        this.year = year;
        return this;
    }

    public withRuntime(runtime: Runtime): this {
        this.runtime = runtime;
        return this;
    }

    public withMetadata(metadata: MediaMetadata): this {
        this.metadata = metadata;
        return this;
    }

    public build(): Movie {

        if (!this.id) {
            throw new Error("MovieId is required.");
        }

        if (!this.title) {
            throw new Error("Title is required.");
        }

        if (!this.year) {
            throw new Error("Year is required.");
        }

        if (!this.runtime) {
            throw new Error("Runtime is required.");
        }

        return new Movie(
            this.id,
            this.title,
            this.year,
            this.runtime,
            this.metadata
        );

    }

}