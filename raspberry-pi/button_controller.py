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
