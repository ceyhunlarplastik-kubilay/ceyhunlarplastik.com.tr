import { describe, expect, it } from "vitest"

import {
    buildYoutubeEmbedUrl,
    buildYoutubeThumbnailUrl,
    extractYoutubeVideoId,
    normalizeYoutubeUrl,
} from "./youtubeVideo"

const VIDEO_ID = "dQw4w9WgXcQ"

describe("extractYoutubeVideoId", () => {
    it.each([
        `https://www.youtube.com/watch?v=${VIDEO_ID}`,
        `https://youtube.com/watch?v=${VIDEO_ID}`,
        `https://m.youtube.com/watch?v=${VIDEO_ID}`,
        `https://youtu.be/${VIDEO_ID}`,
        `https://www.youtube.com/embed/${VIDEO_ID}`,
        `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
        `https://www.youtube.com/shorts/${VIDEO_ID}`,
        `https://www.youtube.com/live/${VIDEO_ID}`,
        `https://www.youtube.com/v/${VIDEO_ID}`,
    ])("parses %s", (url) => {
        expect(extractYoutubeVideoId(url)).toBe(VIDEO_ID)
    })

    it("ignores playlist, timestamp and share query tails", () => {
        expect(
            extractYoutubeVideoId(`https://www.youtube.com/watch?v=${VIDEO_ID}&list=PLabc123&index=2&t=42s`),
        ).toBe(VIDEO_ID)
        expect(extractYoutubeVideoId(`https://youtu.be/${VIDEO_ID}?t=42&si=xYz`)).toBe(VIDEO_ID)
    })

    it("tolerates missing protocol and surrounding whitespace", () => {
        expect(extractYoutubeVideoId(`  youtu.be/${VIDEO_ID}  `)).toBe(VIDEO_ID)
        expect(extractYoutubeVideoId(`www.youtube.com/watch?v=${VIDEO_ID}`)).toBe(VIDEO_ID)
    })

    it.each([
        "",
        "   ",
        "not a url",
        "https://vimeo.com/123456789",
        "https://www.youtube.com/",
        "https://www.youtube.com/watch?v=tooshort",
        "https://www.youtube.com/channel/UCabcdefghijk",
        `javascript:alert(1)//youtu.be/${VIDEO_ID}`,
    ])("rejects %p", (input) => {
        expect(extractYoutubeVideoId(input)).toBeNull()
    })

    it("rejects nullish input", () => {
        expect(extractYoutubeVideoId(null)).toBeNull()
        expect(extractYoutubeVideoId(undefined)).toBeNull()
    })
})

describe("normalizeYoutubeUrl", () => {
    it("reduces every supported form to the canonical watch url", () => {
        expect(normalizeYoutubeUrl(`https://youtu.be/${VIDEO_ID}?t=9`)).toBe(
            `https://www.youtube.com/watch?v=${VIDEO_ID}`,
        )
    })

    it("returns null for unsupported input", () => {
        expect(normalizeYoutubeUrl("https://example.com/video")).toBeNull()
    })
})

describe("buildYoutubeEmbedUrl", () => {
    it("uses the nocookie host and omits autoplay by default", () => {
        const url = buildYoutubeEmbedUrl(VIDEO_ID)

        expect(url.startsWith(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?`)).toBe(true)
        expect(url).not.toContain("autoplay")
    })

    it("adds autoplay when requested", () => {
        expect(buildYoutubeEmbedUrl(VIDEO_ID, { autoplay: true })).toContain("autoplay=1")
    })
})

describe("buildYoutubeThumbnailUrl", () => {
    it("points at the always-available hqdefault frame", () => {
        expect(buildYoutubeThumbnailUrl(VIDEO_ID)).toBe(
            `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
        )
    })
})
