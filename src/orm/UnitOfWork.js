'use strict';

class UnitOfWork {

    constructor(driver) {

        this.driver = driver;

        this.newEntities = new Set();

        this.dirtyEntities = new Set();

        this.deletedEntities = new Set();

    }

    persist(entity) {

        this.newEntities.add(entity);

    }

    markDirty(entity) {

        this.dirtyEntities.add(entity);

    }

    remove(entity) {

        this.deletedEntities.add(entity);

    }

    async commit() {

        await this.driver.beginTransaction();

        try {

            await this.insertAll();

            await this.updateAll();

            await this.deleteAll();

            await this.driver.commit();

        }

        catch (error) {

            await this.driver.rollback();

            throw error;

        }

        finally {

            this.clear();

        }

    }

    async insertAll() {}

    async updateAll() {}

    async deleteAll() {}

    clear() {

        this.newEntities.clear();

        this.dirtyEntities.clear();

        this.deletedEntities.clear();

    }

}

module.exports = UnitOfWork;