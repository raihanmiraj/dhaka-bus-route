/** A stop cannot be selected reliably from a city-level location estimate. */
export const MAX_LOCATION_ACCURACY_METERS = 1000;

type LocationProvider = Pick<Geolocation, "getCurrentPosition">;

function errorCode(error: unknown): number | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "number"
  )
    return error.code;
}

function position(provider: LocationProvider, highAccuracy: boolean) {
  const timeout = highAccuracy ? 12_000 : 8_000;
  return new Promise<GeolocationPosition>((resolve, reject) => {
    // Also recover if a browser's location provider never calls either callback.
    const timer = setTimeout(() => reject({ code: 3 }), timeout + 1000);
    try {
      provider.getCurrentPosition(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge: highAccuracy ? 0 : 30_000,
        },
      );
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

function usable(value: GeolocationPosition) {
  const { latitude, longitude, accuracy } = value.coords;
  return (
    Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180 &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= MAX_LOCATION_ACCURACY_METERS
  );
}

/** One fast request, and at most one fresh precise request when necessary. */
export async function currentLocation(
  provider: LocationProvider,
): Promise<GeolocationPosition> {
  try {
    const first = await position(provider, false);
    if (usable(first)) return first;
  } catch (error) {
    // Permission denial and unsupported/security failures must not prompt a retry.
    if (errorCode(error) !== 2 && errorCode(error) !== 3) throw error;
  }
  const precise = await position(provider, true);
  if (!usable(precise))
    throw new Error(
      "Your location is too approximate to select a nearby stop. Try again with Wi-Fi and Location Services enabled, or choose your origin manually.",
    );
  return precise;
}

export function locationErrorMessage(error: unknown) {
  switch (errorCode(error)) {
    case 1:
      return "Location permission denied. Allow location for this site in your browser and enable Location Services on your device, or choose your origin manually.";
    case 2:
      return "Your device could not determine your location. Enable Wi-Fi and Location Services, then try again or choose your origin manually.";
    case 3:
      return "Finding your location timed out. Try again, or choose your origin manually.";
    default:
      return error instanceof Error
        ? error.message
        : "Could not use current location. Choose your origin manually.";
  }
}
