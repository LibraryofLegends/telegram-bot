/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Rating

Architecture Layer..: Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-VAL-0001

LOL-ID..............: LOL-VAL-RATING-0001

File................: rating.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 2.0.0

Status..............: STABLE

Lifecycle...........: Production Ready

Description.........

Rating Value Object.

Fixed version:
- No accessor override
- Fully compatible with ValueObject<number>

===============================================================================
*/

import { ValueObject } from "./value-object";

export class Rating extends ValueObject<number> {

    constructor(value: number) {

        super(value);

        if (!Number.isFinite(value)) {
            throw new Error("❌ Rating muss eine Zahl sein");
        }

        if (value < 0 || value > 10) {
            throw new Error("❌ Rating muss zwischen 0 und 10 liegen");
        }
    }

    // =========================================================================
    // FORMAT
    // =========================================================================

    public format(): string {
        return `${this.value.toFixed(1)} / 10`;
    }
}