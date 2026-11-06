#!/usr/bin/env python3
"""Populate the Pebble emulator with *synthetic* agenda/forecast for store screenshots.
No personal calendar data or weather services are contacted.
"""
import argparse
import datetime as dt
import json
from pathlib import Path
import re
import struct
import subprocess
import zlib
import zipfile


def get_keys():
    # The SDK generates the app's actual numeric AppMessage keys when it builds.
    for p in Path("build").rglob("*message*key*"):
        if not p.is_file():
            continue
        data = p.read_text(errors="ignore")
        pairs = re.findall(r"MESSAGE_KEY_([A-Za-z0-9_]+)\s*(?:=|\s)\s*(0x[0-9a-fA-F]+|\d+)", data)
        keys = {k: int(v, 0) for k, v in pairs}
        if {"TOTAL_EVENTS", "EVENT_DATA", "SYNC_CHECKSUM", "WEATHER_FORECAST"}.issubset(keys):
            return keys
    # PBW metadata fallback (some SDK builds put the numeric dictionary there).
    with zipfile.ZipFile("3day-agenda.pbw") as archive:
        for filename in archive.namelist():
            if filename.endswith("appinfo.json"):
                info = json.loads(archive.read(filename))
                values = info.get("messageKeys", {})
                if isinstance(values, dict):
                    keys = {k: int(v) for k, v in values.items()}
                    if "TOTAL_EVENTS" in keys:
                        return keys
    raise RuntimeError("SDK message keys not found. Check generated build header.")


def pack_event(start, end, title, color=1, all_day=False):
    name = title.encode("utf-8")[:55]
    return struct.pack("<II56sB", int(start.timestamp()), int(end.timestamp()),
                       name, color | (0x80 if all_day else 0))


def send(platform, args):
    command = ["pebble", "send-app-message", "--emulator", platform, "--vnc",
               "--app-uuid", "2a5c0d64-e4e5-4fe8-9e91-6e11b9f124cd"] + args
    subprocess.run(command, check=True, timeout=35)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--platform", required=True)
    args = parser.parse_args()
    keys = get_keys()
    print("AppMessage key ids:", {k: keys[k] for k in
          ["TOTAL_EVENTS", "CHUNK_INDEX", "EVENT_DATA", "SYNC_ID",
           "SYNC_CHECKSUM", "WEATHER_FORECAST"]}, flush=True)

    tz = dt.timezone.utc
    today = dt.datetime.now(tz).date()
    at = lambda d, h, m=0: dt.datetime.combine(today + dt.timedelta(days=d),
                            dt.time(hour=h, minute=m), tzinfo=tz)
    entries = [
        pack_event(at(0, 22), at(0, 23), "Design Review", 1),
        pack_event(at(1, 0), at(2, 0), "School Event", 4, all_day=True),
        pack_event(at(1, 14), at(1, 15), "Project Meeting", 3),
        pack_event(at(2, 9), at(2, 10), "Weekend Plans", 2),
    ]
    # If today's captured clock has passed 22:00, move the first appointment
    # to the next date rather than displaying an expired demo event.
    now = dt.datetime.now(tz)
    if at(0, 22) <= now:
        entries[0] = pack_event(now + dt.timedelta(hours=1),
                                now + dt.timedelta(hours=2), "Design Review", 1)
    packets = [b"".join(entries[0:2]), b"".join(entries[2:4])]
    checksum = zlib.adler32(b"".join(packets)) & 0xffffffff
    for chunk, data in enumerate(packets):
        path = Path("/tmp/agenda-demo-" + str(chunk) + ".bin")
        path.write_bytes(data)
        send(args.platform, [
            "--int", f"{keys['TOTAL_EVENTS']}=4",
            f"{keys['CHUNK_INDEX']}={chunk}",
            "--uint", f"{keys['SYNC_ID']}=493007",
            f"{keys['SYNC_CHECKSUM']}={checksum}",
            "--bytes-file", f"{keys['EVENT_DATA']}={path}",
        ])
    forecast = bytearray()
    for index, (high, low, icon) in enumerate([(71, 59, 4), (60, 46, 1), (65, 48, 2)]):
        noon = at(index, 12)
        forecast.extend(struct.pack("<IbbB", int(noon.timestamp()), high, low, icon))
    path = Path("/tmp/agenda-demo-weather.bin")
    path.write_bytes(forecast)
    send(args.platform, ["--bytes-file", f"{keys['WEATHER_FORECAST']}={path}"])
    print("Synthetic event list and three daily forecasts transferred", flush=True)


if __name__ == "__main__":
    main()
