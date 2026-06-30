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
assert.match(source, /def handle_button_press/, 'controller should handle a button press');
assert.match(source, /busy/, 'controller should ignore presses while busy');
assert.match(source, /def run_gpio_loop/, 'controller should define GPIO loop');
assert.match(source, /from gpiozero import Button/, 'GPIO dependency should be imported only inside runtime function');
assert.match(source, /pull_up=True/, 'button should use Raspberry Pi internal pull-up resistor');
assert.match(source, /button\.when_pressed/, 'GPIO button should call handler on press');
assert.match(source, /AUDIO_PLAYER/, 'controller should support configurable audio player');
assert.match(source, /BROADCAST_STYLE/, 'controller should support broadcast style for speech');
assert.match(source, /def post_audio/, 'client should request speech audio from the server');
assert.match(source, /\/api\/broadcast\/speech/, 'client should use the existing Vercel speech endpoint');
assert.match(source, /def play_broadcast_audio/, 'controller should play broadcast audio locally');
assert.match(source, /mpg123/, 'controller should default to mpg123 for mp3 playback');
assert.match(source, /takeoffBroadcast/, 'controller should speak the takeoff broadcast');
assert.match(source, /captainBroadcast/, 'controller should speak the landing broadcast');

const readme = readFileSync(
  new URL('../raspberry-pi/README.md', import.meta.url),
  'utf8'
);

assert.match(readme, /GPIO17/, 'README should include example GPIO17 wiring');
assert.match(readme, /GND/, 'README should mention wiring the button to ground');
assert.match(readme, /python3 button_controller\.py/, 'README should show how to run the controller');
assert.match(readme, /systemd/, 'README should include optional systemd startup instructions');
assert.match(readme, /mpg123/, 'README should explain mp3 playback setup');
assert.match(readme, /\/api\/broadcast\/speech/, 'README should mention the Vercel speech endpoint');
