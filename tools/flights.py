"""Выгрузка Flighty (CSV) -> assets/flights.js для глобуса (window.FLIGHTS).

В файл попадают только маршруты (пары аэропортов), их координаты и страны —
без дат, номеров рейсов, PNR и мест. Сам CSV в репозиторий не кладём.

Запуск:
    python3 tools/flights.py ~/Downloads/FlightyExport-2026-10-30.csv
    python3 tools/flights.py export.csv --months 0   # все перелёты, без фильтра по дате

Справочники (координаты аэропортов OurAirports и коды стран ISO 3166) скачиваются
один раз в .cache/.
"""

import argparse
import csv
import datetime as dt
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache"
OUT = ROOT / "assets" / "flights.js"

AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"
COUNTRIES_URL = "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv"


def cached(url, name):
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(exist_ok=True)
        urllib.request.urlretrieve(url, path)
    return path


def load_airports():
    """IATA -> (lon, lat, страна alpha-2)."""
    airports = {}
    with open(cached(AIRPORTS_URL, "airports.csv"), encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["iata_code"]:
                airports[row["iata_code"]] = (
                    round(float(row["longitude_deg"]), 3),
                    round(float(row["latitude_deg"]), 3),
                    row["iso_country"],
                )
    return airports


def load_country_ids():
    """alpha-2 -> числовой код ISO 3166 (так страны называются в world-atlas: «764» — Таиланд)."""
    with open(cached(COUNTRIES_URL, "countries.csv"), encoding="utf-8") as f:
        return {row["alpha-2"]: row["country-code"] for row in csv.DictReader(f)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv", type=pathlib.Path, help="выгрузка Flighty")
    parser.add_argument("--months", type=int, default=12, help="за сколько последних месяцев; 0 — за всё время")
    args = parser.parse_args()

    since = dt.date.today() - dt.timedelta(days=round(args.months * 30.44)) if args.months else dt.date.min
    airports = load_airports()
    country_ids = load_country_ids()

    routes = set()
    with open(args.csv, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if row["Canceled"] == "true" or dt.date.fromisoformat(row["Date"]) < since:
                continue
            arrival = row["Diverted To"] or row["To"]
            routes.add(tuple(sorted((row["From"], arrival))))  # туда и обратно — одна дуга

    used = sorted({code for route in routes for code in route})
    missing = [code for code in used if code not in airports]
    if missing:
        raise SystemExit(f"Нет координат для аэропортов: {', '.join(missing)}")

    data = {
        "airports": {code: airports[code][:2] for code in used},
        "routes": sorted(routes),
        "countries": sorted({country_ids[airports[code][2]] for code in used}),
    }
    # JS, а не JSON: обычным <script> файл грузится и при открытии страницы через file://
    OUT.write_text(f"window.FLIGHTS = {json.dumps(data, separators=(',', ':'))};\n", encoding="utf-8")
    print(f"{len(routes)} маршрутов, {len(used)} аэропортов, {len(data['countries'])} стран -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
