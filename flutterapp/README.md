# Dhaka Bus Route Flutter App

Mobile version of the Dhaka Bus Route Finder.

## Run

```bash
flutter pub get
flutter run
```

The app fetches live route data from:

```text
https://dhakabusroute.vercel.app/api/bus-route
```

The source-to-destination search mirrors the existing web app ranking:

- exact stop matches first
- prefix stop matches next
- partial stop matches next
- shorter stop distance ranks higher
- results are capped at 24
