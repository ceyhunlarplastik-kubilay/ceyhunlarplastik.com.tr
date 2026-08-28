import { describe, expect, it } from "vitest"
import {
    initialRoutePlannerState,
    routePlannerReducer,
    type RoutePlannerState,
} from "@/features/customerLocations/routePlanning/useRoutePlanner"
import type { RoutePoint } from "@/features/customerLocations/routePlanning/types"

const point = (refId: string): RoutePoint => ({
    refId,
    lat: 41,
    lng: 29,
    label: refId,
    source: "CUSTOMER_PIN",
})

describe("routePlannerReducer", () => {
    it("toggles active on and resets everything when turned back off", () => {
        const activated = routePlannerReducer(initialRoutePlannerState, { type: "TOGGLE_ACTIVE" })
        expect(activated.active).toBe(true)

        const withStop = routePlannerReducer(activated, { type: "MARKER_CLICKED", point: point("a") })
        expect(withStop.stops).toHaveLength(1)

        const deactivated = routePlannerReducer(withStop, { type: "TOGGLE_ACTIVE" })
        expect(deactivated).toEqual(initialRoutePlannerState)
    })

    it("routes a marker click to the armed picking target instead of stop toggling", () => {
        const armed: RoutePlannerState = { ...initialRoutePlannerState, active: true, pickingTarget: "origin" }
        const next = routePlannerReducer(armed, { type: "MARKER_CLICKED", point: point("a") })

        expect(next.origin?.refId).toBe("a")
        expect(next.pickingTarget).toBeNull()
        expect(next.stops).toHaveLength(0)
    })

    it("toggles a stop on then off by refId when not picking an endpoint", () => {
        const active: RoutePlannerState = { ...initialRoutePlannerState, active: true }
        const added = routePlannerReducer(active, { type: "MARKER_CLICKED", point: point("a") })
        expect(added.stops.map((stop) => stop.refId)).toEqual(["a"])

        const removed = routePlannerReducer(added, { type: "MARKER_CLICKED", point: point("a") })
        expect(removed.stops).toHaveLength(0)
    })

    it("clears a stale result whenever origin, destination, or stops change", () => {
        const withResult: RoutePlannerState = {
            ...initialRoutePlannerState,
            active: true,
            result: {
                orderedStops: [],
                finalLegDistanceMeters: 0,
                finalLegDurationSeconds: 0,
                totalDistanceMeters: 0,
                totalDurationSeconds: 0,
                encodedPolyline: "x",
            },
        }

        expect(routePlannerReducer(withResult, { type: "SET_ORIGIN", point: point("a") }).result).toBeNull()
        expect(routePlannerReducer(withResult, { type: "REMOVE_STOP", refId: "a" }).result).toBeNull()
    })

    it("keeps active flag but clears selections on RESET", () => {
        const busy: RoutePlannerState = {
            ...initialRoutePlannerState,
            active: true,
            origin: point("origin"),
            stops: [point("a")],
        }

        expect(routePlannerReducer(busy, { type: "RESET" })).toEqual({ ...initialRoutePlannerState, active: true })
    })
})
