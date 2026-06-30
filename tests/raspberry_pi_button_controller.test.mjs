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
assert.match(source, /class SleepAirlineClient/, 'controller should define a SleepAirlineClient');
assert.match(source, /def post_json/, 'client should post JSON to Sleep Airline API');
assert.match(source, /def register_passenger/, 'client should register or load the passenger');
assert.match(source, /def takeoff/, 'client should call takeoff API');
assert.match(source, /def land/, 'client should call landing API');
assert.match(source, /def decide_next_action/, 'controller should decide takeoff or landing from passenger state');
assert.match(source, /not_started.*takeoff/s, 'not_started should map to takeoff');
assert.match(source, /landed.*takeoff/s, 'landed should map to takeoff');
assert.match(source, /in_flight.*land/s, 'in_flight should map to land');
