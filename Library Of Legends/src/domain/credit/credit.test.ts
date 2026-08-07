/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Credit Tests

Architecture Layer..: Domain

Module..............: Credit

Module ID...........: LOL-MOD-CRE-0001

LOL-ID..............: LOL-CRE-TEST-0001

File................: credit.test.ts

Location............
Library Of Legends/src/domain/credit/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Unit tests for the Credit entity.

===============================================================================
*/

import { describe, expect, it } from "vitest";

import { Credit } from "./credit";
import { CreditRole } from "./credit-role";

import { Person } from "../person";
import { PersonId } from "../person/person-id";
import { PersonName } from "../person/person-name";

describe("Credit", () => {

    const person = new Person(
        new PersonId("PER-000001"),
        new PersonName("Christopher Nolan")
    );

    const credit = new Credit(
        person,
        CreditRole.Director
    );

    it("should create a credit", () => {

        expect(credit.person).toBe(person);
        expect(credit.role).toBe(CreditRole.Director);

    });

    it("should store an optional character name", () => {

        const actorCredit = new Credit(
            person,
            CreditRole.Actor,
            "Bruce Wayne"
        );

        expect(actorCredit.characterName).toBe("Bruce Wayne");

    });

    it("should store an optional billing order", () => {

        const actorCredit = new Credit(
            person,
            CreditRole.Actor,
            "Bruce Wayne",
            1
        );

        expect(actorCredit.billingOrder).toBe(1);

    });

});