/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Person Tests

Architecture Layer..: Domain

Module..............: Person

Module ID...........: LOL-MOD-PER-0001

LOL-ID..............: LOL-PER-TEST-0001

File................: person.test.ts

Location............
Library Of Legends/src/domain/person/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Person entity.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Person } from "./person";
import { PersonId } from "./person-id";
import { PersonName } from "./person-name";

describe("Person", () => {

    const person = new Person(
        new PersonId("PER-000001"),
        new PersonName("Christopher Nolan")
    );

    it("should create a person", () => {

        expect(person.displayName).toBe("Christopher Nolan");

    });

    it("should expose the person's name", () => {

        expect(person.name.toString()).toBe("Christopher Nolan");

    });

    it("should compare entities by identifier", () => {

        const other = new Person(
            new PersonId("PER-000001"),
            new PersonName("Christopher Nolan")
        );

        expect(person.equals(other)).toBe(true);

    });

    it("should not be equal when identifiers differ", () => {

        const other = new Person(
            new PersonId("PER-000002"),
            new PersonName("Christopher Nolan")
        );

        expect(person.equals(other)).toBe(false);

    });

});