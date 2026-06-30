# Raspberry Pi Button Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Raspberry Pi GPIO button controller that toggles one fixed passenger between takeoff and landing by calling the existing Sleep Airline APIs.

**Architecture:** Keep the web app, Vercel API, Notion, and OpenAI flows intact. Add a standalone Python controller under `raspberry-pi/` with testable pure logic, a small HTTP client, and a GPIO runner that imports `gpiozero` only at runtime on the Raspberry Pi.

**Tech Stack:** Python 3.9+, standard library `urllib`, optional `python-dotenv`, optional Raspberry Pi `gpiozero`, existing Sleep Airline HTTP API.

---

## File Structure

- Create `raspberry-pi/button_controller.py`: main controller module. Owns config parsing, API calls, flight-state decision, and GPIO runtime loop.
- Create `raspberry-pi/.env.example`: sample Raspberry Pi runtime configuration.
- Create `raspberry-pi/README.md`: setup, wiring, install, run, and optional systemd service instructions.
- Create `tests/raspberry_pi_button_controller.test.mjs`: Node-based source checks for the Python controller. This avoids requiring a Raspberry Pi in local CI while still checking the generated controller contract.
- Modify nothing in the existing browser UI or server API unless implementation discovers a hard incompatibility.

---

### Task 1: Controller Skeleton And Configuration

**Files:**
- Create: `raspberry-pi/button_controller.py`
- Create: `raspberry-pi/.env.example`
- Test: `tests/raspberry_pi_button_controller.test.mjs`

- [ ] **Step 1: Write the failing source-contract test**

Create `tests/raspberry_pi_button_controller.test.mjs` with:

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync(
  new URL('../raspberry-pi/button_controller.py', import.meta.url),
  'utf8'
);

assert.match(source, /class Config/, 'controller should define a Config class');
assert.match(source, /def load_config/, 'controller should load config from env');
assert.match(source, /SERVER_URL/, 'controller should require SERVER_URL');
assert.match(source, /PASSENGER_ID/, 'controller should require PASSENGER_ID');
assert.match(source, /PASSENGER_NAME/, 'controller should require PASSENGER_NAME');
assert.match(source, /GROUP_ID/, 'controller should require GROUP_ID');
assert.match(source, /GPIO_PIN/, 'controller should require GPIO_PIN');
assert.match(source, /ROUTE_DIRECTION/, 'controller should support optional ROUTE_DIRECTION');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: FAIL because `raspberry-pi/button_controller.py` does not exist yet.

- [ ] **Step 3: Write minimal controller config skeleton**

Create `raspberry-pi/button_controller.py` with:

```python
#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
import json
import os
import sys
import time
from typing import Any, Callable
from urllib import error, request


@dataclass(frozen=True)
class Config:
    server_url: str
    passenger_id: str
    passenger_name: str
    group_id: str
    gpio_pin: int
    route_direction: str = "auto"
    debounce_seconds: float = 1.0


def load_dotenv_file(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as file:
        for raw_line in file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def load_config() -> Config:
    load_dotenv_file()
    try:
        gpio_pin = int(require_env("GPIO_PIN"))
    except ValueError as exc:
        if "GPIO_PIN" in str(exc):
            raise
        raise ValueError("GPIO_PIN must be a BCM GPIO pin number, such as 17") from exc

    return Config(
        server_url=require_env("SERVER_URL").rstrip("/"),
        passenger_id=require_env("PASSENGER_ID"),
        passenger_name=require_env("PASSENGER_NAME"),
        group_id=require_env("GROUP_ID"),
        gpio_pin=gpio_pin,
        route_direction=os.environ.get("ROUTE_DIRECTION", "auto").strip() or "auto",
        debounce_seconds=float(os.environ.get("DEBOUNCE_SECONDS", "1.0")),
    )
```

Create `raspberry-pi/.env.example` with:

```dotenv
SERVER_URL=https://your-project.vercel.app
PASSENGER_ID=p_001
PASSENGER_NAME=你的名字
GROUP_ID=group_01
GPIO_PIN=17
ROUTE_DIRECTION=auto
DEBOUNCE_SECONDS=1.0
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raspberry-pi/button_controller.py raspberry-pi/.env.example tests/raspberry_pi_button_controller.test.mjs
git commit -m "Add Raspberry Pi controller config"
```

---

### Task 2: API Client And Toggle Decision

**Files:**
- Modify: `raspberry-pi/button_controller.py`
- Test: `tests/raspberry_pi_button_controller.test.mjs`

- [ ] **Step 1: Extend failing source-contract test**

Append these assertions to `tests/raspberry_pi_button_controller.test.mjs`:

```js
assert.match(source, /class SleepAirlineClient/, 'controller should define a SleepAirlineClient');
assert.match(source, /def post_json/, 'client should post JSON to Sleep Airline API');
assert.match(source, /def register_passenger/, 'client should register or load the passenger');
assert.match(source, /def takeoff/, 'client should call takeoff API');
assert.match(source, /def land/, 'client should call landing API');
assert.match(source, /def decide_next_action/, 'controller should decide takeoff or landing from passenger state');
assert.match(source, /not_started.*takeoff/s, 'not_started should map to takeoff');
assert.match(source, /landed.*takeoff/s, 'landed should map to takeoff');
assert.match(source, /in_flight.*land/s, 'in_flight should map to land');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: FAIL because API client and decision functions do not exist yet.

- [ ] **Step 3: Implement API client and decision logic**

Append this code to `raspberry-pi/button_controller.py`:

```python
class SleepAirlineClient:
    def __init__(self, config: Config):
        self.config = config

    def post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.config.server_url}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(req, timeout=120) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(body)
                message = parsed.get("message") or parsed.get("error") or body
            except json.JSONDecodeError:
                message = body
            raise RuntimeError(f"API error {exc.code}: {message}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Cannot reach Sleep Airline server: {exc.reason}") from exc

        return json.loads(body) if body else {}

    def register_passenger(self) -> dict[str, Any]:
        return self.post_json("/api/passenger", {
            "passengerId": self.config.passenger_id,
            "name": self.config.passenger_name,
            "groupId": self.config.group_id,
        })

    def takeoff(self) -> dict[str, Any]:
        return self.post_json("/api/flight/takeoff", {
            "passengerId": self.config.passenger_id,
            "name": self.config.passenger_name,
            "groupId": self.config.group_id,
            "routeDirection": self.config.route_direction,
        })

    def land(self) -> dict[str, Any]:
        return self.post_json("/api/flight/land", {
            "passengerId": self.config.passenger_id,
            "name": self.config.passenger_name,
            "groupId": self.config.group_id,
        })


def decide_next_action(passenger: dict[str, Any]) -> str:
    status = passenger.get("status")
    if status == "in_flight":
        return "land"
    if status in ("not_started", "landed", None):
        return "takeoff"
    return "takeoff"
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raspberry-pi/button_controller.py tests/raspberry_pi_button_controller.test.mjs
git commit -m "Add Raspberry Pi API toggle logic"
```

---

### Task 3: GPIO Runtime Loop

**Files:**
- Modify: `raspberry-pi/button_controller.py`
- Test: `tests/raspberry_pi_button_controller.test.mjs`

- [ ] **Step 1: Extend failing source-contract test**

Append these assertions to `tests/raspberry_pi_button_controller.test.mjs`:

```js
assert.match(source, /def handle_button_press/, 'controller should handle a button press');
assert.match(source, /busy/, 'controller should ignore presses while busy');
assert.match(source, /def run_gpio_loop/, 'controller should define GPIO loop');
assert.match(source, /from gpiozero import Button/, 'GPIO dependency should be imported only inside runtime function');
assert.match(source, /pull_up=True/, 'button should use Raspberry Pi internal pull-up resistor');
assert.match(source, /button\.when_pressed/, 'GPIO button should call handler on press');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: FAIL because GPIO runtime functions do not exist yet.

- [ ] **Step 3: Implement button handler and GPIO loop**

Append this code to `raspberry-pi/button_controller.py`:

```python
class ButtonController:
    def __init__(self, client: SleepAirlineClient):
        self.client = client
        self.busy = False
        self.last_press_at = 0.0
        self.passenger: dict[str, Any] | None = None

    def refresh_passenger(self) -> dict[str, Any]:
        data = self.client.register_passenger()
        passenger = data.get("passenger")
        if not isinstance(passenger, dict):
            raise RuntimeError("Server response did not include passenger data")
        self.passenger = passenger
        return passenger

    def handle_button_press(self) -> None:
        now = time.monotonic()
        if self.busy:
            print("Button ignored: request already running")
            return
        if now - self.last_press_at < self.client.config.debounce_seconds:
            print("Button ignored: debounce")
            return

        self.busy = True
        self.last_press_at = now
        try:
            passenger = self.passenger or self.refresh_passenger()
            action = decide_next_action(passenger)
            if action == "land":
                print("Landing...")
                data = self.client.land()
                self.passenger = data.get("flight", passenger) | {"status": "landed"}
                print("Landed")
            else:
                print("Taking off...")
                data = self.client.takeoff()
                self.passenger = data.get("flight", passenger) | {"status": "in_flight"}
                print("Took off")
        except Exception as exc:
            print(f"Button action failed: {exc}", file=sys.stderr)
            try:
                self.refresh_passenger()
            except Exception as refresh_exc:
                print(f"Refresh failed: {refresh_exc}", file=sys.stderr)
        finally:
            self.busy = False


def run_gpio_loop(config: Config) -> None:
    try:
        from gpiozero import Button
        from signal import pause
    except ImportError as exc:
        raise RuntimeError(
            "gpiozero is required on Raspberry Pi. Install with: sudo apt install python3-gpiozero"
        ) from exc

    client = SleepAirlineClient(config)
    controller = ButtonController(client)
    passenger = controller.refresh_passenger()
    print(f"Ready: {passenger.get('name', config.passenger_name)} status={passenger.get('status')}")

    button = Button(config.gpio_pin, pull_up=True, bounce_time=config.debounce_seconds)
    button.when_pressed = controller.handle_button_press
    print(f"Listening on BCM GPIO {config.gpio_pin}. Press Ctrl+C to exit.")
    pause()


def main() -> int:
    try:
        config = load_config()
        run_gpio_loop(config)
        return 0
    except KeyboardInterrupt:
        print("Stopped")
        return 0
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raspberry-pi/button_controller.py tests/raspberry_pi_button_controller.test.mjs
git commit -m "Add Raspberry Pi GPIO button loop"
```

---

### Task 4: Raspberry Pi Usage Documentation

**Files:**
- Create: `raspberry-pi/README.md`
- Modify: `tests/raspberry_pi_button_controller.test.mjs`

- [ ] **Step 1: Extend failing documentation test**

Append these assertions to `tests/raspberry_pi_button_controller.test.mjs`:

```js
const readme = readFileSync(
  new URL('../raspberry-pi/README.md', import.meta.url),
  'utf8'
);

assert.match(readme, /GPIO17/, 'README should include example GPIO17 wiring');
assert.match(readme, /GND/, 'README should mention wiring the button to ground');
assert.match(readme, /python3 button_controller\.py/, 'README should show how to run the controller');
assert.match(readme, /systemd/, 'README should include optional systemd startup instructions');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: FAIL because `raspberry-pi/README.md` does not exist yet.

- [ ] **Step 3: Write Raspberry Pi instructions**

Create `raspberry-pi/README.md` with:

```markdown
# Sleep Airline Raspberry Pi Button

This runs one physical GPIO button as the controller for one fixed Sleep Airline passenger.

## Wiring

Example wiring uses BCM `GPIO17`.

- Button leg 1: Raspberry Pi `GPIO17`
- Button leg 2: Raspberry Pi `GND`

The script uses `pull_up=True`, so no external resistor is required for a basic button.

## Install

On the Raspberry Pi:

```bash
sudo apt update
sudo apt install -y python3-gpiozero
cd /path/to/SleepAirlineS2-main/raspberry-pi
cp .env.example .env
```

Edit `.env`:

```dotenv
SERVER_URL=https://your-project.vercel.app
PASSENGER_ID=p_001
PASSENGER_NAME=你的名字
GROUP_ID=group_01
GPIO_PIN=17
ROUTE_DIRECTION=auto
DEBOUNCE_SECONDS=1.0
```

## Run

```bash
python3 button_controller.py
```

Press the button once to take off. Press it again to land.

## Optional systemd Service

Create `/etc/systemd/system/sleep-airline-button.service`:

```ini
[Unit]
Description=Sleep Airline Raspberry Pi Button
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=/path/to/SleepAirlineS2-main/raspberry-pi
ExecStart=/usr/bin/python3 /path/to/SleepAirlineS2-main/raspberry-pi/button_controller.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sleep-airline-button.service
sudo systemctl status sleep-airline-button.service
```

View logs:

```bash
journalctl -u sleep-airline-button.service -f
```
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add raspberry-pi/README.md tests/raspberry_pi_button_controller.test.mjs
git commit -m "Document Raspberry Pi button setup"
```

---

### Task 5: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run Raspberry Pi controller source test**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/raspberry_pi_button_controller.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run existing lightweight tests**

Run:

```bash
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/theme-css.test.mjs
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/scenery-link-hidden.test.mjs
/Users/lushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --no-warnings tests/scenery-prompt-variety.test.mjs
```

Expected: all PASS.

- [ ] **Step 3: Confirm git state**

Run:

```bash
git status --short --branch
```

Expected: branch is ahead by the new commits and no uncommitted changes remain.

- [ ] **Step 4: Manual Raspberry Pi verification**

On the Raspberry Pi:

```bash
cd /path/to/SleepAirlineS2-main/raspberry-pi
python3 button_controller.py
```

Expected:

- Startup prints `Ready`.
- First button press prints `Taking off...` then `Took off`.
- Second button press prints `Landing...` then `Landed`.
- The web app and Notion show the same passenger's flight changes.

---

## Self-Review

- Spec coverage: fixed passenger, GPIO button, one-button toggle, existing API reuse, simple text-only implementation, debounce, and error handling are covered.
- Placeholder scan: no unresolved placeholder language is present.
- Type consistency: `Config`, `SleepAirlineClient`, `ButtonController`, and env variable names are used consistently across tasks.
