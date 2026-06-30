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
