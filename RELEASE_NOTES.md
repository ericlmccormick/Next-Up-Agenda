# Next Up Agenda 1.0.0

First public release of Next Up Agenda for Pebble watches.

## Features

- Automatically displays appointments from the native Pebble Calendar plugin, with no external ICS feed or API key required
- Optional Pebble Weather plugin daily forecast glyphs, high/low temperatures, and sunrise/sunset-based automatic theme
- Calendar-specific colors, compact scrolling event rows, adjustable font size and 12/24-hour time
- Proper all-day event handling, including local dates and daylight-saving transitions
- Event details with start/end times and location when provided by the plugin
- AppGlance next-event summary, offline cache, manual Force Sync and configurable appearance
- Verified/retried Bluetooth synchronization, with recovery from stale subscriptions, malformed data and interrupted transfers
- Retains recurring meetings even when they share a title; removes only matching appointments

## Requirements and compatibility

Requires the Pebble mobile app with the Calendar plugin enabled and calendar access granted. The Weather plugin is optional. The current native Calendar plugin provides up to 10 upcoming appointments within seven days; there is no fixed 72-hour cutoff.

Supports Aplite, Basalt, Chalk, Diorite and Emery (Pebble/Steel, Time/Time Steel, Time Round, Pebble 2 and Pebble Time 2).

## Support

https://ko-fi.com/ericmccormick

Source: https://github.com/ericlmccormick/Next-Up-Agenda
