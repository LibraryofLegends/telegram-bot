/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Event System                                            ║
 * ║ Paket        : 03                                                      ║
 * ║ Datei        : EventSubscriber.js                                      ║
 * ║ Klasse       : EventSubscriber                                         ║
 * ║ ID           : LLF-EVENT-0006                                          ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Basisklasse für Event-Subscriber.
 *
 * Subscriber bündeln mehrere Events
 * innerhalb einer gemeinsamen Klasse.
 */
export default class EventSubscriber {

    /**
     * Liefert sämtliche Event-Registrierungen.
     *
     * Rückgabeformat:
     *
     * {
     *     "event.name": "methodName"
     * }
     *
     * oder
     *
     * {
     *     "event.name": {
     *         method: "methodName",
     *         priority: 0,
     *         once: false
     *     }
     * }
     *
     * @returns {Object}
     */
    static getSubscribedEvents() {

        return {};

    }

    /**
     * Prüft, ob Registrierungen vorhanden sind.
     *
     * @returns {boolean}
     */
    static hasSubscriptions() {

        return Object.keys(
            this.getSubscribedEvents()
        ).length > 0;

    }

    /**
     * Anzahl registrierter Events.
     *
     * @returns {number}
     */
    static countSubscriptions() {

        return Object.keys(
            this.getSubscribedEvents()
        ).length;

    }

    /**
     * Exportiert den Subscriber.
     *
     * @returns {Object}
     */
    static toJSON() {

        return {

            subscriptions: this.countSubscriptions(),
            events: this.getSubscribedEvents()

        };

    }

}