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
