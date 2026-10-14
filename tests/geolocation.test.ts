import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { currentLocation, locationErrorMessage } from "../lib/geolocation";
import { nearestStop, stopCoordinate } from "../lib/stop-coordinates";
import { stops } from "../lib/routes";
import { GET } from "../app/api/search/route";

const point = (accuracy = 30): GeolocationPosition =>
  ({
    coords: { latitude: 23.7958, longitude: 90.3532, accuracy },
    timestamp: Date.now(),
  }) as GeolocationPosition;
const provider = () => ({
  getCurrentPosition: vi.fn<Geolocation["getCurrentPosition"]>(),
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("device location requests", () => {
  it("uses a fast location to select the nearest existing stop around Mirpur 1", async () => {
    const gps = provider();
    gps.getCurrentPosition.mockImplementationOnce((success) =>
      success(point()),
    );
    const position = await currentLocation(gps);
    expect(
      nearestStop(position.coords.latitude, position.coords.longitude, stops)
        ?.id,
    ).toBe("mirpur-1");
    expect(gps.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(gps.getCurrentPosition.mock.calls[0][2]).toMatchObject({
      enableHighAccuracy: false,
      maximumAge: 30_000,
    });
  });
  it.each([2, 3])(
    "tries once more after an unavailable/timed out location (%s)",
    async (code) => {
      const gps = provider();
      gps.getCurrentPosition.mockImplementationOnce((_s, error) =>
        error!({ code } as GeolocationPositionError),
      );
      gps.getCurrentPosition.mockImplementationOnce((success) =>
        success(point()),
      );
      await expect(currentLocation(gps)).resolves.toMatchObject({
        coords: { accuracy: 30 },
      });
      expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2);
      expect(gps.getCurrentPosition.mock.calls[1][2]).toMatchObject({
        enableHighAccuracy: true,
        maximumAge: 0,
      });
    },
  );
  it("does not retry permission denial, even when the browser has no global GeolocationPositionError", async () => {
    vi.stubGlobal("GeolocationPositionError", undefined);
    const gps = provider();
    const denied = { code: 1 };
    gps.getCurrentPosition.mockImplementationOnce((_s, error) =>
      error!(denied as GeolocationPositionError),
    );
    await expect(currentLocation(gps)).rejects.toEqual(denied);
    expect(gps.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(locationErrorMessage(denied)).toContain("permission denied");
  });
  it("stops after two failures and explains unavailable device location", async () => {
    const gps = provider();
    gps.getCurrentPosition.mockImplementation((_s, error) =>
      error!({ code: 2 } as GeolocationPositionError),
    );
    await expect(currentLocation(gps)).rejects.toMatchObject({ code: 2 });
    expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(locationErrorMessage({ code: 2 })).toContain(
      "Wi-Fi and Location Services",
    );
  });
  it("refines a city-level estimate before selecting a stop", async () => {
    const gps = provider();
    gps.getCurrentPosition.mockImplementationOnce((success) =>
      success(point(50_000)),
    );
    gps.getCurrentPosition.mockImplementationOnce((success) =>
      success(point(25)),
    );
    await expect(currentLocation(gps)).resolves.toMatchObject({
      coords: { accuracy: 25 },
    });
    expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2);
  });
  it("does not pretend a very imprecise location identifies a nearby stop", async () => {
    const gps = provider();
    gps.getCurrentPosition.mockImplementation((success) =>
      success(point(50_000)),
    );
    await expect(currentLocation(gps)).rejects.toThrow("too approximate");
  });
  it("recovers even when the underlying provider never calls back", async () => {
    vi.useFakeTimers();
    const gps = provider();
    const outcome = expect(currentLocation(gps)).rejects.toMatchObject({
      code: 3,
    });
    await vi.advanceTimersByTimeAsync(22_000);
    await outcome;
    expect(gps.getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("nearest listed stop API", () => {
  it("has coordinates for all listed stops", () => {
    for (const stop of stops)
      expect(
        stopCoordinate(stop.name) ?? stopCoordinate(stop.id),
      ).not.toBeNull();
  });
  it("returns an existing stop that can be used directly as the origin", async () => {
    const response = GET(
      new NextRequest(
        "https://www.dhakabusroutes.com/api/search?kind=nearest&lat=23.7958&lng=90.3532",
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.stop).toEqual({ id: "mirpur-1", name: "Mirpur 1" });
    expect(body.meters).toBeLessThan(50);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const routes = GET(
      new NextRequest(
        `https://www.dhakabusroutes.com/api/search?from=${body.stop.name}&to=Farmgate`,
      ),
    );
    expect(routes.status).toBe(200);
    expect((await routes.json()).total).toBeGreaterThan(0);
  });
  it.each([
    "",
    "&lat=23.8",
    "&lat=&lng=90.3",
    "&lat=nope&lng=90.3",
    "&lat=91&lng=90.3",
    "&lat=23.8&lng=181",
  ])("rejects missing/invalid coordinates %s", (query) => {
    expect(
      GET(
        new NextRequest(
          `https://www.dhakabusroutes.com/api/search?kind=nearest${query}`,
        ),
      ).status,
    ).toBe(400);
  });
  it("does not select a distant Dhaka stop when the user is outside coverage", () => {
    expect(nearestStop(40.7, -74, stops)).toBeNull();
  });
  it("supports mapped route endpoints beyond the old hard-coded longitude box", () => {
    expect(nearestStop(23.8645, 90.0045, stops)?.id).toBe("manikganj");
  });
});
