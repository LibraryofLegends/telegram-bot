/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Credit

Architecture Layer..: Domain

Module..............: Credit

Module ID...........: LOL-MOD-CRE-0001

LOL-ID..............: LOL-CRE-0001

File................: credit.ts

Location............
Library Of Legends/src/domain/credit/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the participation of a person in a media work.

===============================================================================
*/

import { Person } from "../person";
import { CreditRole } from "./credit-role";

/**
 * Represents a person's contribution to a media work.
 */
export class Credit {

    public constructor(
        public readonly person: Person,
        public readonly role: CreditRole,
        public readonly characterName?: string,
        public readonly billingOrder?: number
    ) {}

}