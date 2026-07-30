/**
 * ============================================================================
 * Library Of Legends 2.0
 * ---------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleDependencyResolver.js
 * ---------------------------------------------------------------------------
 * Beschreibung:
 *
 * Löst Modulabhängigkeiten auf und liefert die korrekte
 * Lade-Reihenfolge.
 *
 * ============================================================================
 */

'use strict';

class ModuleDependencyResolver {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

    }

    /**
     * Lade-Reihenfolge berechnen.
     *
     * @returns {Array<Module>}
     */

    resolve() {

        const resolved = [];

        const visited = new Set();

        const visiting = new Set();

        for (

            const module

            of this.registry.all()

        ) {

            this.visit(

                module,

                resolved,

                visited,

                visiting

            );

        }

        return resolved;

    }

    /**
     * Rekursiver Resolver.
     *
     * @private
     */

    visit(

        module,

        resolved,

        visited,

        visiting

    ) {

        const name = module.getName();

        if (

            visited.has(name)

        ) {

            return;

        }

        if (

            visiting.has(name)

        ) {

            throw new Error(

                `Zyklische Modulabhängigkeit erkannt: ${name}`

            );

        }

        visiting.add(name);

        const dependencies =

            module.getDependencies?.() || [];

        for (

            const dependency

            of dependencies

        ) {

            if (

                !this.registry.has(dependency)

            ) {

                throw new Error(

                    `Fehlendes Modul "${dependency}" (benötigt von "${name}")`

                );

            }

            this.visit(

                this.registry.get(dependency),

                resolved,

                visited,

                visiting

            );

        }

        visiting.delete(name);

        visited.add(name);

        resolved.push(module);

    }

}

module.exports = ModuleDependencyResolver;