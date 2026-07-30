'use strict';

class LibraryStatistics {

    constructor(container) {

        this.container = container;

        this.db =
            container?.resolve?.('Database');

    }

    /**
     * Gesamte Statistik erzeugen.
     */
    async generate() {

        return {

            movies:
                await this.countMovies(),

            series:
                await this.countSeries(),

            seasons:
                await this.countSeasons(),

            episodes:
                await this.countEpisodes(),

            collections:
                await this.countCollections(),

            genres:
                await this.genreStatistics(),

            resolutions:
                await this.resolutionStatistics(),

            sources:
                await this.sourceStatistics(),

            codecs:
                await this.codecStatistics(),

            years:
                await this.yearStatistics(),

            storage:
                await this.storageStatistics()

        };

    }

    async countMovies() {

        return await this.db.movies.count();

    }

    async countSeries() {

        return await this.db.series.count();

    }

    async countSeasons() {

        return await this.db.seasons.count();

    }

    async countEpisodes() {

        return await this.db.episodes.count();

    }

    async countCollections() {

        return await this.db.collections.count();

    }

    async genreStatistics() {

        return await this.db.movies.groupBy(

            "genres"

        );

    }

    async resolutionStatistics() {

        return await this.db.movies.groupBy(

            "resolution"

        );

    }

    async sourceStatistics() {

        return await this.db.movies.groupBy(

            "source"

        );

    }

    async codecStatistics() {

        return await this.db.movies.groupBy(

            "videoCodec"

        );

    }

    async yearStatistics() {

        return await this.db.movies.groupBy(

            "year"

        );

    }

    async storageStatistics() {

        const total =
            await this.db.movies.sum(

                "fileSize"

            );

        return {

            bytes: total,

            gigabytes:

                Number(

                    (

                        total /

                        1024 /

                        1024 /

                        1024

                    ).toFixed(2)

                ),

            terabytes:

                Number(

                    (

                        total /

                        1024 /

                        1024 /

                        1024 /

                        1024

                    ).toFixed(2)

                )

        };

    }

}

module.exports = LibraryStatistics;