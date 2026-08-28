"use client"

import { useCallback, useReducer } from "react"
import { toast } from "sonner"
import type {
    OptimizedRouteResult,
    RoutePickingTarget,
    RoutePoint,
    RouteStop,
} from "@/features/customerLocations/routePlanning/types"

export const ROUTE_PLANNER_MAX_STOPS = 25

export type RoutePlannerState = {
    active: boolean
    origin: RoutePoint | null
    destination: RoutePoint | null
    stops: RouteStop[]
    pickingTarget: RoutePickingTarget
    result: OptimizedRouteResult | null
}

export type RoutePlannerAction =
    | { type: "TOGGLE_ACTIVE" }
    | { type: "SET_PICKING_TARGET"; target: RoutePickingTarget }
    | { type: "SET_ORIGIN"; point: RoutePoint }
    | { type: "SET_DESTINATION"; point: RoutePoint }
    | { type: "MARKER_CLICKED"; point: RoutePoint }
    | { type: "REMOVE_STOP"; refId: string }
    | { type: "SET_RESULT"; result: OptimizedRouteResult }
    | { type: "CLEAR_RESULT" }
    | { type: "RESET" }

export const initialRoutePlannerState: RoutePlannerState = {
    active: false,
    origin: null,
    destination: null,
    stops: [],
    pickingTarget: null,
    result: null,
}

export function routePlannerReducer(state: RoutePlannerState, action: RoutePlannerAction): RoutePlannerState {
    switch (action.type) {
        case "TOGGLE_ACTIVE":
            return state.active ? initialRoutePlannerState : { ...initialRoutePlannerState, active: true }

        case "SET_PICKING_TARGET":
            return { ...state, pickingTarget: action.target }

        case "SET_ORIGIN":
            return { ...state, origin: action.point, pickingTarget: null, result: null }

        case "SET_DESTINATION":
            return { ...state, destination: action.point, pickingTarget: null, result: null }

        case "MARKER_CLICKED": {
            if (state.pickingTarget === "origin") {
                return { ...state, origin: action.point, pickingTarget: null, result: null }
            }
            if (state.pickingTarget === "destination") {
                return { ...state, destination: action.point, pickingTarget: null, result: null }
            }

            const alreadySelected = state.stops.some((stop) => stop.refId === action.point.refId)
            const stops = alreadySelected
                ? state.stops.filter((stop) => stop.refId !== action.point.refId)
                : [...state.stops, action.point]

            return { ...state, stops, result: null }
        }

        case "REMOVE_STOP":
            return {
                ...state,
                stops: state.stops.filter((stop) => stop.refId !== action.refId),
                result: null,
            }

        case "SET_RESULT":
            return { ...state, result: action.result }

        case "CLEAR_RESULT":
            return { ...state, result: null }

        case "RESET":
            return { ...initialRoutePlannerState, active: state.active }

        default:
            return state
    }
}

export function useRoutePlanner() {
    const [state, dispatch] = useReducer(routePlannerReducer, initialRoutePlannerState)

    const toggleActive = useCallback(() => dispatch({ type: "TOGGLE_ACTIVE" }), [])
    const armPicking = useCallback((target: RoutePickingTarget) => dispatch({ type: "SET_PICKING_TARGET", target }), [])
    const disarmPicking = useCallback(() => dispatch({ type: "SET_PICKING_TARGET", target: null }), [])
    const setOrigin = useCallback((point: RoutePoint) => dispatch({ type: "SET_ORIGIN", point }), [])
    const setDestination = useCallback((point: RoutePoint) => dispatch({ type: "SET_DESTINATION", point }), [])
    const removeStop = useCallback((refId: string) => dispatch({ type: "REMOVE_STOP", refId }), [])
    const setResult = useCallback((result: OptimizedRouteResult) => dispatch({ type: "SET_RESULT", result }), [])
    const clearResult = useCallback(() => dispatch({ type: "CLEAR_RESULT" }), [])
    const reset = useCallback(() => dispatch({ type: "RESET" }), [])

    const handleMarkerClick = useCallback((point: RoutePoint) => {
        const addingNewStop = !state.pickingTarget
            && !state.stops.some((stop) => stop.refId === point.refId)
        if (addingNewStop && state.stops.length >= ROUTE_PLANNER_MAX_STOPS) {
            toast.error(`Bir rotaya en fazla ${ROUTE_PLANNER_MAX_STOPS} durak eklenebilir.`)
            return
        }
        dispatch({ type: "MARKER_CLICKED", point })
    }, [state.pickingTarget, state.stops])

    return {
        state,
        toggleActive,
        armPicking,
        disarmPicking,
        setOrigin,
        setDestination,
        removeStop,
        setResult,
        clearResult,
        reset,
        handleMarkerClick,
    }
}
