#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
import json
import os
import subprocess
import sys
import tempfile
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
    broadcast_style: str = "formal_captain"
    audio_player: str = "mpg123"
    audio_enabled: bool = True


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


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name, "").strip().lower()
    if not value:
        return default
    return value in ("1", "true", "yes", "on")


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
        broadcast_style=os.environ.get("BROADCAST_STYLE", "formal_captain").strip() or "formal_captain",
        audio_player=os.environ.get("AUDIO_PLAYER", "mpg123").strip() or "mpg123",
        audio_enabled=env_bool("AUDIO_ENABLED", True),
    )


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

    def post_audio(self, path: str, payload: dict[str, Any]) -> bytes:
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
                content_type = response.headers.get("Content-Type", "")
                body = response.read()
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Speech API error {exc.code}: {body}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Cannot reach Sleep Airline speech server: {exc.reason}") from exc

        if not body or not content_type.startswith("audio/"):
            raise RuntimeError("Speech API did not return audio")
        return body

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
            "broadcastStyle": self.config.broadcast_style,
        })

    def land(self) -> dict[str, Any]:
        return self.post_json("/api/flight/land", {
            "passengerId": self.config.passenger_id,
            "name": self.config.passenger_name,
            "groupId": self.config.group_id,
            "broadcastStyle": self.config.broadcast_style,
        })

    def speech(self, text: str) -> bytes:
        return self.post_audio("/api/broadcast/speech", {
            "text": text,
            "style": self.config.broadcast_style,
        })


def decide_next_action(passenger: dict[str, Any]) -> str:
    status = passenger.get("status")
    if status == "in_flight":
        return "land"
    if status in ("not_started", "landed", None):
        return "takeoff"
    return "takeoff"


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

    def play_broadcast_audio(self, text: str) -> None:
        if not self.client.config.audio_enabled or not text.strip():
            return

        audio_path = ""
        try:
            print("Playing broadcast audio...")
            audio = self.client.speech(text)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as file:
                file.write(audio)
                audio_path = file.name

            subprocess.run(
                [self.client.config.audio_player, "-q", audio_path],
                check=True,
            )
        except Exception as exc:
            print(f"Audio playback failed: {exc}", file=sys.stderr)
        finally:
            if audio_path:
                try:
                    os.unlink(audio_path)
                except OSError:
                    pass

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
                flight = data.get("flight", {})
                if isinstance(flight, dict):
                    self.play_broadcast_audio(str(flight.get("captainBroadcast", "")))
                print("Landed")
            else:
                print("Taking off...")
                data = self.client.takeoff()
                self.passenger = data.get("flight", passenger) | {"status": "in_flight"}
                flight = data.get("flight", {})
                if isinstance(flight, dict):
                    self.play_broadcast_audio(str(flight.get("takeoffBroadcast", "")))
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
