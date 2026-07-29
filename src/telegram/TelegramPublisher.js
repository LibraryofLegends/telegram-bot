'use strict';

class TelegramPublisher {

    constructor(container) {

        this.container = container;

        this.bot =
            container?.resolve?.('TelegramBot');

        this.layout =
            container?.resolve?.('LayoutBuilder');

    }

    /**
     * Medium veröffentlichen.
     *
     * @param {Object} media
     */
    async publish(media) {

        if (!this.bot) {

            throw new Error(
                "Telegram bot not available."
            );

        }

        const message =
            this.layout.build(media);

        const target =
            this.getTarget(media);

        if (media.artwork?.poster) {

            return await this.bot.sendPhoto(

                target,

                media.artwork.poster,

                {

                    caption: message,

                    parse_mode: "HTML"

                }

            );

        }

        return await this.bot.sendMessage(

            target,

            message,

            {

                parse_mode: "HTML",

                disable_web_page_preview: true

            }

        );

    }

    /**
     * Zielkanal bestimmen.
     *
     * @param {Object} media
     */
    getTarget(media) {

        if (media.mediaType === "series") {

            return process.env.TELEGRAM_SERIES_CHANNEL;

        }

        return process.env.TELEGRAM_MOVIES_CHANNEL;

    }

}

module.exports = TelegramPublisher;