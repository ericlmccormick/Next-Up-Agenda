# Next Up Agenda

A quick-glance calendar and daily weather agenda for Pebble watches. Calendar events come **exclusively** from the native Pebble Calendar plugin; there are no external feeds, API keys, or ICS URLs to configure.

## Features

- Native Calendar plugin: upcoming appointments from calendars enabled in the Pebble mobile app, sorted by date
- Native Weather plugin: weather glyph and high/low temperatures in the agenda's date headers
- Automatic light/dark theme based on today's sunrise and sunset; 7 AM–7 PM fallback if solar data is unavailable
- Color choices for each discovered calendar and a default calendar color
- All-day event support, duplicate-event filtering that preserves recurring appointments, 12/24-hour time, compact event rows and adjustable text size
- Scrollable appointment details with start/end times and location when provided by the Calendar plugin
- AppGlance next-event summary, last successful synchronization, Force Sync, and optional filtering of completed cached events
- Offline cached events and weather, with acknowledged/retried AppMessage transfers
- Starts at the first visible appointment whenever the watch app opens

## Setup

1. Install [next-up-agenda.pbw](https://github.com/ericlmccormick/Next-Up-Agenda/releases/download/v1.0.0/next-up-agenda.pbw) and enable the **Calendar** plugin in the Pebble mobile app.
2. Allow calendar access and choose which device calendars the plugin can read.
3. Enable the **Weather** plugin if you want daily high/low temperatures, condition icons, or sunrise/sunset theme switching.
4. Open the app's phone settings to choose default/per-calendar colors and display preferences. Long-press Select on the watch for Force Sync and watch-side settings.

Without Calendar plugin data, the watch preserves its last valid agenda instead of erasing it on an unavailable-source error. Badly shaped plugin responses also cannot erase valid cached events. A valid empty Calendar response clears out old events. Without the Weather plugin the calendar works normally, without daily forecasts, and Auto appearance uses the fallback times.

## Calendar window and source limits

The native Calendar plugin currently returns **up to 10 upcoming events** within seven days; the amount of calendar time represented depends on event density. Its current fields are event title, start/end time, all-day status, location and calendar name; it does not currently provide descriptions or organizer information. The agenda follows the native plugin output rather than enforcing a fixed number of hours or days. No additional calendar events are fetched from other sources.

The app removes only matching appointments with the same calendar, normalized title, start/end timestamps and location. Recurring meetings on different days, or distinct simultaneous meetings, remain visible. The Calendar plugin's own event limit still applies.

## Supported platforms

Builds target all five Pebble SDK platforms: Aplite (Pebble and Steel), Basalt (Time and Time Steel), Chalk (Time Round), Diorite (Pebble 2), and Emery (Time 2). Pebble SDK 4.44 builds the PBW from the same sources.

## Automated builds and screenshots

The GitHub Actions workflow runs JavaScript regression tests and compiles a direct-download PBW for all five platforms. Emulator screenshots for all five platforms are published as separate PNG assets in the same [v1.0.0 release](https://github.com/ericlmccormick/Next-Up-Agenda/releases/tag/v1.0.0). Screenshot fixtures use synthetic events and weather, never personal calendar contents.

## Privacy and support

The app receives calendar and weather information from the Pebble phone app's plugins. It does not contact an external ICS proxy and does not require the app's Internet permission.

Support the developer: https://ko-fi.com/ericmccormick

Original ICS-only app (separate project): https://github.com/ericlmccormick/Pebble_7_day_ICS_Calendar
