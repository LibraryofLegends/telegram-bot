const { handleLibrarySearchCommands } = require("../library-search-commands");
const { handleAzCommands } = require("../library-az-commands");
const { handleBrowseCommands } = require("../library-browse-commands");
const { handleYearCommands } = require("../library-year-commands");
const { handleDupeCommands } = require("../library-dupe-commands");
const { handleWrongImportCommands } = require("../library-wrongimport-commands");
const { handleCleanupCommands } = require("../library-cleanup-commands");
const { handleEpisodeCheckCommands } = require("../library-episodecheck-commands");
const { handleEpisodeFixCommands } = require("../library-episodefix-commands");
const { handleSeriesAuditCommands } = require("../library-seriesaudit-commands");
const { handleSeriesClusterCommands } = require("../library-seriescluster-commands");
const { handleSeriesSplitCommands } = require("../library-seriessplit-commands");
const { handleSeriesFixFromFileCommands } = require("../library-seriesfixfromfile-commands");
const { handleLibraryHolCommands } = require("../library-hol-commands");
const { handleFavoriteCommands } = require("../library-favorites-commands");
const { handlePopularCommands } = require("../library-popular-commands");
const { handleRandomCommands } = require("../library-random-commands");
const { handleHistoryCommands } = require("../library-history-commands");

module.exports = {
    handleLibrarySearchCommands,
    handleAzCommands,
    handleBrowseCommands,
    handleYearCommands,
    handleDupeCommands,
    handleWrongImportCommands,
    handleCleanupCommands,
    handleEpisodeCheckCommands,
    handleEpisodeFixCommands,
    handleSeriesAuditCommands,
    handleSeriesClusterCommands,
    handleSeriesSplitCommands,
    handleSeriesFixFromFileCommands,
    handleLibraryHolCommands,
    handleFavoriteCommands,
    handlePopularCommands,
    handleRandomCommands,
    handleHistoryCommands
};