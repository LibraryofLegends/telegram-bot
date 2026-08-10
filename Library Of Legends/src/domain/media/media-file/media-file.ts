/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaFile

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-MDF-0001

LOL-ID..............: LOL-MDF-0001

File................: media-file.ts

Location............
Library Of Legends/src/domain/media/media-file/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central media file aggregate.
Contains and evaluates video, audio and subtitle streams.

===============================================================================
*/

import { Entity } from "../../../shared/domain/entities/entity";
import { EntityId } from "../../../shared/domain/identifiers/entity-id";

import { VideoStream } from "../video-stream";
import { AudioStream } from "../audio-stream";
import { SubtitleStream } from "../subtitle-stream";

/**
 * MediaFile Aggregate Root
 */
export class MediaFile extends Entity<EntityId> {

    private videoStreams: VideoStream[] = [];
    private audioStreams: AudioStream[] = [];
    private subtitleStreams: SubtitleStream[] = [];

    public constructor(id: EntityId) {
        super(id);
    }

    // =========================================================================
    // ADD STREAMS
    // =========================================================================

    public addVideoStream(stream: VideoStream): void {
        this.videoStreams.push(stream);
    }

    public addAudioStream(stream: AudioStream): void {
        this.audioStreams.push(stream);
    }

    public addSubtitleStream(stream: SubtitleStream): void {
        this.subtitleStreams.push(stream);
    }

    // =========================================================================
    // GET STREAMS
    // =========================================================================

    public getVideoStreams(): VideoStream[] {
        return [...this.videoStreams];
    }

    public getAudioStreams(): AudioStream[] {
        return [...this.audioStreams];
    }

    public getSubtitleStreams(): SubtitleStream[] {
        return [...this.subtitleStreams];
    }

    // =========================================================================
    // BEST VIDEO
    // =========================================================================

    public getBestVideo(): VideoStream | null {

        if (this.videoStreams.length === 0) {
            return null;
        }

        return this.videoStreams.reduce((best, current) => {

            const bestRes = best.resolution;
            const currRes = current.resolution;

            if (currRes.isHigherThan(bestRes)) {
                return current;
            }

            return best;

        });

    }

    // =========================================================================
    // BEST AUDIO
    // =========================================================================

    public getBestAudio(): AudioStream | null {

        if (this.audioStreams.length === 0) {
            return null;
        }

        return this.audioStreams.reduce((best, current) => {

            // 1. Priorität: Sprache (Deutsch bevorzugt)
            if (current.language.isGerman() && !best.language.isGerman()) {
                return current;
            }

            // 2. Priorität: Channels
            if (current.channels.isHigherThan(best.channels)) {
                return current;
            }

            return best;

        });

    }

    // =========================================================================
    // BEST SUBTITLES
    // =========================================================================

    public getBestSubtitles(): SubtitleStream | null {

        if (this.subtitleStreams.length === 0) {
            return null;
        }

        return this.subtitleStreams.reduce((best, current) => {

            // 1. Forced hat höchste Priorität
            if (current.type.isForced() && !best.type.isForced()) {
                return current;
            }

            // 2. Deutsch bevorzugt
            if (current.language.isGerman() && !best.language.isGerman()) {
                return current;
            }

            return best;

        });

    }

}