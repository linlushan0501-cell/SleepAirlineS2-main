# Raspberry Pi Button Control Design

## Goal

Create a Raspberry Pi version of Sleep Airline where a single GPIO hardware button controls one fixed passenger's flight state.

The web app remains available for display and administration, but day-to-day takeoff and landing control should happen from the Raspberry Pi.

## User Decisions

- Control hardware: Raspberry Pi GPIO physical button.
- Passenger mode: one fixed passenger configured on the Raspberry Pi.
- Interaction model: one button toggles between takeoff and landing.
- Token/visual preference: keep the design and implementation simple, without visual companion work.

## Recommended Approach

Add a small Raspberry Pi controller under `raspberry-pi/`.

The controller will run as a Python script on the Raspberry Pi. It will watch a configured GPIO pin, debounce button presses, and call the existing Sleep Airline HTTP APIs.

This keeps the existing Vercel, Notion, OpenAI, and browser UI behavior intact.

## Runtime Configuration

The Raspberry Pi script will read configuration from an `.env` file or environment variables:

- `SERVER_URL`: deployed Sleep Airline server URL, such as `https://example.vercel.app`.
- `PASSENGER_ID`: fixed passenger ID.
- `PASSENGER_NAME`: fixed passenger display name.
- `GROUP_ID`: fixed group ID.
- `GPIO_PIN`: BCM GPIO pin number for the physical button.
- `ROUTE_DIRECTION`: optional, defaults to `auto`.

## Button Behavior

On startup, the controller registers or loads the passenger through `POST /api/passenger`.

On each valid button press:

1. If the passenger is not currently in flight, call `POST /api/flight/takeoff`.
2. If the passenger is currently in flight, call `POST /api/flight/land`.
3. Print a concise status line to the terminal after success or failure.

The controller should debounce presses and ignore extra presses while a network request is already running.

## Error Handling

- If the server is unreachable, print the error and keep listening.
- If passenger configuration is missing, exit with a clear message.
- If takeoff or landing API returns an error, print the API message and keep listening.
- If GPIO setup fails, show wiring/setup guidance and exit.

## Testing

Use focused tests for code that can run off the Raspberry Pi:

- Configuration parsing.
- Flight-state decision logic.
- API client request shape.

GPIO hardware behavior will be verified manually on the Raspberry Pi.

## Out Of Scope

- Moving the whole web server onto the Raspberry Pi.
- Multi-passenger switching.
- Replacing the existing web UI.
- Offline mode without Vercel, Notion, or OpenAI.
