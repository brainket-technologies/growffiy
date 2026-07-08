import os
import sys
import json
import time
import random
import datetime
import threading
import logging
from kiteconnect import KiteConnect, KiteTicker
import gspread
from google.oauth2.service_account import Credentials

import urllib.request
import csv
import io
import socket
import requests

# Set default timeout for all socket connections to prevent hanging on flaky networks
socket.setdefaulttimeout(20)

# Force IPv4 only to avoid macOS IPv6 connection/DNS resolution hangs (system TCP fallback timeout is ~75s)
_original_getaddrinfo = socket.getaddrinfo
def _patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _patched_getaddrinfo

# Monkeypatch requests to always use a timeout of 20 seconds if none is specified
_original_request = requests.Session.request
def _patched_request(self, method, url, *args, **kwargs):
    if 'timeout' not in kwargs or kwargs['timeout'] is None:
        kwargs['timeout'] = 20
    return _original_request(self, method, url, *args, **kwargs)
requests.Session.request = _patched_request

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("kite_gspread_streamer")

CONFIG_FILE = "config.json"
CACHE_FILE = "indicators_cache.json"

import psycopg2

def load_config():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Try local stock-scanner/.env first
    env_path = os.path.abspath(os.path.join(script_dir, "../.env"))
    if not os.path.exists(env_path):
        # Fallback to root .env
        env_path = os.path.abspath(os.path.join(script_dir, "../../.env"))
        
    config = {}
    if os.path.exists(env_path):
        try:
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        os.environ[key] = val
                        os.environ[key.upper()] = val
                        config[key] = val
        except Exception as e:
            logger.error(f"Error loading env file: {e}")
            
    # Try loading local config.json as fallback if present
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config.update(json.load(f))
        except Exception:
            pass
            
    return config

def load_db_url():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Try local stock-scanner/.env first
    env_path = os.path.abspath(os.path.join(script_dir, "../.env"))
    if not os.path.exists(env_path):
        # Fallback to root .env
        env_path = os.path.abspath(os.path.join(script_dir, "../../.env"))
    
    if os.path.exists(env_path):
        try:
            with open(env_path, "r") as f:
                for line in f:
                    if line.strip().startswith("DATABASE_URL="):
                        val = line.split("=", 1)[1].strip()
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        return val
        except Exception:
            pass
    # Try reading from environment variable directly
    if "DATABASE_URL" in os.environ:
        return os.environ["DATABASE_URL"]
    return "postgresql://neondb_owner:npg_Qtok2RmWK4uT@ep-purple-frost-aimotyfv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

def load_google_settings_from_db():
    db_url = load_db_url()
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('google_sheet_url', 'google_credentials_json')")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        settings = {}
        for row in rows:
            settings[row[0]] = row[1]
        return settings
    except Exception as e:
        logger.error(f"Failed to fetch Google Sheets settings from Neon database: {e}")
        return {}

def load_kite_credentials_from_db():
    db_url = load_db_url()
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("SELECT zerodha_api_key, zerodha_api_secret, zerodha_client_id, zerodha_password, zerodha_totp_secret FROM clients LIMIT 1")
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return {
                "kite_api_key": row[0],
                "kite_api_secret": row[1],
                "kite_client_id": row[2],
                "kite_password": row[3],
                "kite_totp_secret": row[4]
            }
    except Exception as e:
        logger.error(f"Failed to fetch Kite credentials from DB: {e}")
    return {}

def load_stream_status_from_db():
    db_url = load_db_url()
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("SELECT setting_value FROM app_settings WHERE setting_key = 'sheet_stream_status'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row[0] if row else "inactive"
    except Exception:
        return "inactive"

def get_config_value(config, key, default=None):
    env_key = key.upper()
    if env_key in os.environ:
        return os.environ[env_key]
    if key in os.environ:
        return os.environ[key]
    return config.get(key, default)

def fetch_nse_instruments():
    """Fetch and parse all NSE instruments dynamically from Zerodha Kite's public API."""
    logger.info("Downloading NSE instrument list from Zerodha...")
    url = "https://api.kite.trade/instruments"
    try:
        response = urllib.request.urlopen(url, timeout=15)
        csv_data = response.read().decode('utf-8')
        f = io.StringIO(csv_data)
        reader = csv.DictReader(f)
        
        mapping = {}
        for row in reader:
            if row.get("exchange") == "NSE":
                symbol = row.get("tradingsymbol")
                token = row.get("instrument_token")
                if symbol and token:
                    mapping[symbol.upper()] = int(token)
        logger.info(f"Loaded {len(mapping)} NSE instrument tokens.")
        return mapping
    except Exception as e:
        logger.error(f"Failed to fetch instrument tokens: {e}")
        sys.exit(1)

def get_candle_pattern(open_val, high_val, low_val, close_val):
    """Helper to classify the candlestick pattern of a completed candle."""
    if not open_val or not close_val or not high_val or not low_val:
        return ""
    
    body = abs(close_val - open_val)
    candle_range = high_val - low_val
    if candle_range == 0:
        return "Doji"
        
    body_ratio = body / candle_range
    is_bullish = close_val >= open_val
    
    if body_ratio < 0.1:
        return "Doji"
        
    if body_ratio > 0.85:
        return "Bull Marub" if is_bullish else "Bear Marub"
        
    upper_shadow = high_val - max(open_val, close_val)
    lower_shadow = min(open_val, close_val) - low_val
    
    if body_ratio < 0.4 and upper_shadow > body and lower_shadow > body:
        return "Spin Top"
        
    if lower_shadow > 2 * body and upper_shadow < 0.1 * candle_range:
        return "Bullish" if is_bullish else "Hang Man"
        
    if upper_shadow > 2 * body and lower_shadow < 0.1 * candle_range:
        return "Bearish"
        
    if body_ratio > 0.6:
        return "Str Bull" if is_bullish else "Str Bear"
        
    return "Bullish" if is_bullish else "Bearish"

# Global variables for price caching, candle tracking, and thread safety
latest_prices = {}
active_candles = {}  # symbol -> {interval_start, open, high, low, close}
historical_candle_returns = {}  # symbol -> {time_str: return_pct}
last_completed_patterns = {}  # symbol -> pattern_str
price_lock = threading.Lock()

def run_streamer():
    config = load_config()
    db_kite_creds = load_kite_credentials_from_db()
    
    api_key = db_kite_creds.get("kite_api_key") or get_config_value(config, "kite_api_key")
    api_secret = db_kite_creds.get("kite_api_secret") or get_config_value(config, "kite_api_secret")
    spreadsheet_id = get_config_value(config, "spreadsheet_id")
    
    nse_instruments = fetch_nse_instruments()

    logger.info("Initializing Google Sheets API connection...")
    try:
        scope = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]
        
        # Load sheets config from Neon DB first, fallback to config.json
        db_settings = load_google_settings_from_db()
        creds_json = db_settings.get("google_credentials_json") or get_config_value(config, "google_credentials_json")
        sheet_target = db_settings.get("google_sheet_url") or get_config_value(config, "spreadsheet_id")

        if creds_json:
            creds_info = json.loads(creds_json)
            creds = Credentials.from_service_account_info(creds_info, scopes=scope)
            logger.info("Using Google credentials from Neon Database (or environment variable).")
        else:
            creds_file = get_config_value(config, "google_credentials_file", "credentials.json")
            creds = Credentials.from_service_account_file(creds_file, scopes=scope)
            logger.info(f"Using Google credentials from file: {creds_file}")
            
        def get_sheets_connection():
            logger.info("Authorizing gspread client...")
            gc_local = gspread.authorize(creds)
            logger.info("Opening Google Spreadsheet...")
            if sheet_target.startswith("http://") or sheet_target.startswith("https://"):
                spreadsheet_local = gc_local.open_by_url(sheet_target)
            else:
                spreadsheet_local = gc_local.open_by_key(sheet_target)
            logger.info("Fetching Worksheet 1 (index 0)...")
            ws1 = spreadsheet_local.get_worksheet(0)
            logger.info("Fetching Worksheet 2 (index 1)...")
            ws2 = spreadsheet_local.get_worksheet(1)
            return gc_local, spreadsheet_local, ws1, ws2

        # Diagnostic watchdog thread to print traceback if Google connection hangs
        import traceback
        watchdog_active = True
        def watchdog_loop():
            time.sleep(15)
            if watchdog_active:
                logger.warning("!!! Google Connection is taking more than 15 seconds. Traceback of the hang: !!!")
                for thread_id, stack in sys._current_frames().items():
                    if thread_id == threading.main_thread().ident:
                        traceback.print_stack(stack)
                        sys.stderr.flush()
        
        threading.Thread(target=watchdog_loop, daemon=True).start()

        gc, spreadsheet, worksheet1, worksheet2 = get_sheets_connection()
        watchdog_active = False
        logger.info(f"Connected to Google Sheet: '{spreadsheet.title}' with sheets '{worksheet1.title}' and '{worksheet2.title}'")
    except Exception as e:
        logger.exception("Failed to authenticate with Google Sheets API")
        sys.exit(1)

    def col_idx_to_letter(idx):
        temp = ""
        while idx > 0:
            idx, remainder = divmod(idx - 1, 26)
            temp = chr(65 + remainder) + temp
        return temp

    # Scan Layout for Sheet1
    logger.info("Scanning Sheet1 layout to locate stock rows...")
    try:
        all_rows1 = worksheet1.get_all_values()
        headers1 = [h.strip().upper() for h in all_rows1[0]]
        
        if "SYMBOL" not in headers1:
            logger.error("Could not find 'SYMBOL' column header in Sheet1 row 1.")
            sys.exit(1)
            
        symbol_col_idx1 = headers1.index("SYMBOL") + 1
        sheet1_cols = {h: col_idx_to_letter(idx + 1) for idx, h in enumerate(headers1)}
        
        col_mappings1 = {}
        for name in ["CMP", "LTP"]:
            if name in headers1:
                col_mappings1["LTP"] = sheet1_cols[name]
                break
        if "OPEN" in headers1:
            col_mappings1["OPEN"] = sheet1_cols["OPEN"]
        for name in ["HIGH", "DAY HIGH"]:
            if name in headers1:
                col_mappings1["HIGH"] = sheet1_cols[name]
                break
        for name in ["LOW", "DAY LOW"]:
            if name in headers1:
                col_mappings1["LOW"] = sheet1_cols[name]
                break
        for name in ["CHG %", "% CHG", "INTRA %", "CHANGE"]:
            if name in headers1:
                col_mappings1["CHANGE"] = sheet1_cols[name]
                break

        symbol_to_row1 = {}
        for r_idx, row in enumerate(all_rows1[1:], start=2):
            if len(row) > symbol_col_idx1 - 1:
                sym = row[symbol_col_idx1 - 1].strip().upper()
                if sym:
                    symbol_to_row1[sym] = r_idx
        logger.info(f"Mapped {len(symbol_to_row1)} symbols from Sheet1.")
    except Exception as e:
        logger.error(f"Error mapping Sheet1 structure: {e}")
        sys.exit(1)

    # Scan Layout for Sheet2
    logger.info("Scanning Sheet2 layout to locate stock rows...")
    try:
        all_rows2 = worksheet2.get_all_values()
        headers2 = [h.strip().upper() for h in all_rows2[0]]
        
        if "SYMBOL" not in headers2:
            logger.error("Could not find 'SYMBOL' column header in Sheet2 row 1.")
            sys.exit(1)
            
        symbol_col_idx2 = headers2.index("SYMBOL") + 1
        sheet2_cols = {h: col_idx_to_letter(idx + 1) for idx, h in enumerate(headers2)}
        
        col_mappings2 = {}
        for name in ["LTP", "CMP"]:
            if name in headers2:
                col_mappings2["LTP"] = sheet2_cols[name]
                break
        for name in ["DAY HIGH", "HIGH"]:
            if name in headers2:
                col_mappings2["HIGH"] = sheet2_cols[name]
                break
        for name in ["DAY LOW", "LOW"]:
            if name in headers2:
                col_mappings2["LOW"] = sheet2_cols[name]
                break
        for name in ["% CHG", "CHG %"]:
            if name in headers2:
                col_mappings2["CHANGE"] = sheet2_cols[name]
                break

        symbol_to_row2 = {}
        for r_idx, row in enumerate(all_rows2[1:], start=2):
            if len(row) > symbol_col_idx2 - 1:
                sym = row[symbol_col_idx2 - 1].strip().upper()
                if sym:
                    symbol_to_row2[sym] = r_idx
        logger.info(f"Mapped {len(symbol_to_row2)} symbols from Sheet2.")
    except Exception as e:
        logger.error(f"Error mapping Sheet2 structure: {e}")
        sys.exit(1)

    all_symbols = set(symbol_to_row1.keys()).union(set(symbol_to_row2.keys()))
    
    stocks_mapping = {}
    for sym in all_symbols:
        token = nse_instruments.get(sym)
        if token:
            stocks_mapping[sym] = token
        else:
            logger.warning(f"Stock symbol '{sym}' not found in Kite NSE instruments list.")

    if not stocks_mapping:
        logger.error("None of the symbols in your Google Sheet could be mapped to Kite instrument tokens.")
        sys.exit(1)

    token_to_symbol = {v: k for k, v in stocks_mapping.items()}
    instrument_tokens = list(stocks_mapping.values())
    logger.info(f"Successfully resolved {len(instrument_tokens)} stock tokens to stream.")

    # Initialize Kite Connect Session & Auto-Login
    logger.info("Initializing Zerodha Kite session (Auto-Login)...")
    try:
        import pyotp
        import requests
        import urllib.parse

        client_id = db_kite_creds.get("kite_client_id") or get_config_value(config, "kite_client_id")
        password = db_kite_creds.get("kite_password") or get_config_value(config, "kite_password")
        totp_secret = db_kite_creds.get("kite_totp_secret") or get_config_value(config, "kite_totp_secret")

        session = requests.Session()
        r_login = session.post("https://kite.zerodha.com/api/login", data={
            "user_id": client_id,
            "password": password
        })
        login_res = r_login.json()
        if login_res.get("status") != "success":
            raise Exception(f"Login failed: {login_res.get('message')}")
            
        request_id = login_res["data"]["request_id"]
        
        totp_code = pyotp.TOTP(totp_secret).now()
        r_2fa = session.post("https://kite.zerodha.com/api/twofa", data={
            "user_id": client_id,
            "request_id": request_id,
            "twofa_value": totp_code,
            "twofa_type": "totp"
        })
        twofa_res = r_2fa.json()
        if twofa_res.get("status") != "success":
            raise Exception(f"2FA authentication failed: {twofa_res.get('message')}")
            
        auth_url = f"https://kite.zerodha.com/connect/login?api_key={api_key}&v=3"
        r_auth = session.get(auth_url, allow_redirects=True)
        all_urls = [r.headers.get("Location") or r.url for r in r_auth.history] + [r_auth.url]
        
        location = None
        for url in all_urls:
            if "request_token" in url:
                location = url
                break
            
        if not location:
            raise Exception("Could not find any URL containing request_token in the redirection chain.")
            
        parsed_url = urllib.parse.urlparse(location)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        resolved_request_token = query_params["request_token"][0]

        kite = KiteConnect(api_key=api_key)
        session_data = kite.generate_session(resolved_request_token, api_secret=api_secret)
        access_token = session_data["access_token"]
        kite.set_access_token(access_token)
        logger.info("Kite Session generated successfully!")

        # Load caching logic for daily indicators
        today_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        today_str = today_ist.strftime("%Y-%m-%d")
        
        stock_indicators = {}
        historical_candle_returns = {}
        last_completed_patterns = {}
        cache_loaded = False
        candles_up_to_date = False

        # Calculate last completed 15-minute candle time string
        now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
        current_active_interval = now_ist.replace(minute=(now_ist.minute // 15) * 15, second=0, microsecond=0)
        last_completed_time_str = None
        if now_ist.hour >= 9:
            check_time = current_active_interval - datetime.timedelta(minutes=15)
            if check_time.hour >= 9 and not (check_time.hour == 9 and check_time.minute < 30):
                last_completed_time_str = check_time.strftime("%I:%M %p").lstrip('0')

        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r") as cf:
                    cache_data = json.load(cf)
                    if cache_data.get("date") == today_str:
                        stock_indicators = cache_data.get("indicators", {})
                        cached_returns = cache_data.get("historical_candle_returns", {})
                        cached_patterns = cache_data.get("last_completed_patterns", {})
                        cache_loaded = True
                        logger.info(f"Loaded daily indicators for {len(stock_indicators)} stocks from local cache.")
                        
                        # Verify if the cached 15-minute candles are up-to-date
                        first_stock = list(stocks_mapping.keys())[0] if stocks_mapping else None
                        if first_stock and first_stock in cached_returns:
                            if last_completed_time_str is None or last_completed_time_str in cached_returns[first_stock]:
                                historical_candle_returns = cached_returns
                                last_completed_patterns = cached_patterns
                                candles_up_to_date = True
                                logger.info("Cached 15-minute candles are up-to-date. Skipping Zerodha historical API sync!")
            except Exception as cache_err:
                logger.warning(f"Error reading indicator cache: {cache_err}")

        # Fetch initial quotes from Kite Connect HTTP API
        logger.info("Fetching initial quotes from Kite HTTP API...")
        instruments_to_query = [f"NSE:{sym}" for sym in stocks_mapping.keys()]
        
        for i in range(0, len(instruments_to_query), 500):
            batch = instruments_to_query[i:i+500]
            quotes = kite.quote(batch)
            with price_lock:
                for symbol_key, quote in quotes.items():
                    token = quote.get("instrument_token")
                    if token:
                        close_price = quote.get("ohlc", {}).get("close", 0)
                        last_price = quote.get("last_price", 0)
                        change = 0.0
                        if close_price > 0:
                            change = ((last_price - close_price) / close_price) * 100
                        
                        latest_prices[token] = {
                            "instrument_token": token,
                            "last_price": last_price,
                            "ohlc": quote.get("ohlc", {}),
                            "change": change,
                            "volume": quote.get("volume", 0)
                        }

        # Fetch / Calculate daily indicators and 15-minute candles
        if not candles_up_to_date:
            start_time_15m = datetime.datetime(today_ist.year, today_ist.month, today_ist.day, 9, 15, tzinfo=today_ist.tzinfo)
            end_time_15m = datetime.datetime(today_ist.year, today_ist.month, today_ist.day, 15, 30, tzinfo=today_ist.tzinfo)
            
            logger.info("Syncing indicators and 15-minute candles from Kite API...")
            sync_count = 0
            total_stocks = len(stocks_mapping)
            for sym, token in stocks_mapping.items():
                sync_count += 1
                if sync_count % 50 == 0 or sync_count == total_stocks:
                    logger.info(f"Synced indicators & candles for {sync_count}/{total_stocks} stocks...")
                historical_candle_returns[sym] = {}
                active_candles[sym] = None
                
                # Step 1: Fetch Daily Indicators if not cached
                if not cache_loaded or sym not in stock_indicators:
                    try:
                        # Fetch last 350 days to calculate 200 DMA
                        start_daily = today_ist - datetime.timedelta(days=350)
                        daily_records = kite.historical_data(token, start_daily, today_ist, "day")
                        
                        if len(daily_records) >= 20:
                            # Extract closes and volumes
                            closes = [float(r["close"]) for r in daily_records]
                            volumes = [float(r["volume"]) for r in daily_records]
                            
                            # Exclude today's partial candle
                            if daily_records[-1]["date"].strftime("%Y-%m-%d") == today_str:
                                daily_records = daily_records[:-1]
                                closes = closes[:-1]
                                volumes = volumes[:-1]
                                
                            if len(daily_records) >= 20:
                                last_r = daily_records[-1]
                                high_yest = float(last_r["high"])
                                low_yest = float(last_r["low"])
                                close_yest = float(last_r["close"])
                                volume_yest = float(last_r["volume"])
                                
                                dma5 = sum(closes[-5:]) / 5.0
                                dma13 = sum(closes[-13:]) / 13.0
                                avg_vol_20 = sum(volumes[-20:]) / 20.0
                                
                                dma200 = None
                                if len(closes) >= 200:
                                    dma200 = sum(closes[-200:]) / 200.0
                                    
                                pivot = (high_yest + low_yest + close_yest) / 3
                                bc = (high_yest + low_yest) / 2
                                tc = (pivot - bc) + pivot
                                
                                r1 = 2 * pivot - low_yest
                                s1 = 2 * pivot - high_yest
                                r2 = pivot + (high_yest - low_yest)
                                s2 = pivot - (high_yest - low_yest)
                                
                                stock_indicators[sym] = {
                                    "high_yest": high_yest,
                                    "low_yest": low_yest,
                                    "close_yest": close_yest,
                                    "volume_yest": volume_yest,
                                    "avg_vol_20": avg_vol_20,
                                    "dma5": dma5,
                                    "dma13": dma13,
                                    "dma200": dma200,
                                    "pivot": pivot,
                                    "bc": bc,
                                    "tc": tc,
                                    "r1": r1,
                                    "s1": s1,
                                    "r2": r2,
                                    "s2": s2
                                }
                    except Exception as daily_err:
                        logger.warning(f"Error fetching daily historical data for {sym}: {daily_err}")
                    
                # Step 2: Fetch 15-minute candles
                try:
                    records_15m = kite.historical_data(token, start_time_15m, end_time_15m, "15minute")
                    if records_15m:
                        current_active_interval = today_ist.replace(minute=(today_ist.minute // 15) * 15, second=0, microsecond=0)
                        
                        for r in records_15m:
                            r_date = r['date']
                            if r_date.tzinfo is None:
                                r_date = r_date.replace(tzinfo=today_ist.tzinfo)
                            else:
                                r_date = r_date.astimezone(today_ist.tzinfo)
                                
                            time_str = r_date.strftime("%I:%M %p").lstrip('0')
                            
                            r_open = float(r['open'])
                            r_high = float(r['high'])
                            r_low = float(r['low'])
                            r_close = float(r['close'])
                            
                            if r_date < current_active_interval:
                                if r_open > 0:
                                    ret = ((r_close - r_open) / r_open) * 100
                                    historical_candle_returns[sym][time_str] = ret
                            else:
                                active_candles[sym] = {
                                    "interval_start": r_date,
                                    "open": r_open,
                                    "high": r_high,
                                    "low": r_low,
                                    "close": r_close
                                }
                        
                        completed_candles = [r for r in records_15m if r['date'].replace(tzinfo=today_ist.tzinfo) < current_active_interval]
                        if completed_candles:
                            last_c = completed_candles[-1]
                            last_pattern = get_candle_pattern(float(last_c['open']), float(last_c['high']), float(last_c['low']), float(last_c['close']))
                            last_completed_patterns[sym] = last_pattern
                except Exception as hist_err:
                    logger.warning(f"Could not load 15-min candles for {sym}: {hist_err}")
                    
                # Respect Kite API rate limit (3 requests per second)
                time.sleep(0.35)

            # Save indicators and candles to Cache
            try:
                with open(CACHE_FILE, "w") as cf:
                    json.dump({
                        "date": today_str,
                        "indicators": stock_indicators,
                        "historical_candle_returns": historical_candle_returns,
                        "last_completed_patterns": last_completed_patterns
                    }, cf)
                logger.info("Saved fresh daily indicators and candle returns to local cache.")
            except Exception as cache_err:
                logger.warning(f"Error saving indicators cache: {cache_err}")
        else:
            # If loaded from cache, initialize active_candles to None for all symbols
            for sym in stocks_mapping.keys():
                active_candles[sym] = None

    except Exception as e:
        logger.error(f"Failed during Zerodha Auto-Login or Kite connection: {e}")
        sys.exit(1)

    # Background sheet updater thread loop
    def sheet_updater_loop():
        nonlocal worksheet1, worksheet2
        simulate_real_time = get_config_value(config, "simulation_mode", False)
        
        def format_percent(val):
            if val is None:
                return ""
            prefix = "+" if val > 0 else ""
            return f"{prefix}{val:.2f}%"

        def update_sheet_with_retry(worksheet_num, updates):
            nonlocal worksheet1, worksheet2
            retries = 5
            backoff = 2
            for attempt in range(retries):
                try:
                    ws = worksheet1 if worksheet_num == 1 else worksheet2
                    ws.batch_update(updates)
                    return True
                except Exception as e:
                    logger.warning(f"Attempt {attempt + 1}/{retries} failed to update Sheet{worksheet_num}: {e}")
                    if attempt < retries - 1:
                        time.sleep(backoff)
                        backoff *= 2
                    else:
                        logger.error(f"Failed to update Sheet{worksheet_num} after {retries} attempts. Re-authorizing Sheets connection...")
                        try:
                            _, _, new_ws1, new_ws2 = get_sheets_connection()
                            worksheet1, worksheet2 = new_ws1, new_ws2
                            logger.info("Successfully re-authorized Google Sheets API connection.")
                            # Final attempt with the new connection
                            ws = worksheet1 if worksheet_num == 1 else worksheet2
                            ws.batch_update(updates)
                            return True
                        except Exception as auth_err:
                            logger.error(f"Re-authorization or final update failed: {auth_err}")
            return False

        while True:
            time.sleep(2.0)
            
            updates1 = []
            updates2 = []
            
            with price_lock:
                current_cache = dict(latest_prices)
                
            now_ist = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))
            active_interval = now_ist.replace(minute=(now_ist.minute // 15) * 15, second=0, microsecond=0)
            active_time_str = active_interval.strftime("%I:%M %p").lstrip('0')
            should_save_cache = False
            
            for token, tick in current_cache.items():
                symbol = token_to_symbol.get(token)
                if not symbol:
                    continue
                    
                ltp = tick.get("last_price")
                if ltp is None:
                    continue
                    
                if simulate_real_time:
                    fluctuation = random.uniform(-0.0005, 0.0005)
                    ltp = round(ltp * (1 + fluctuation), 2)
                    tick["last_price"] = ltp
                
                ohlc = tick.get("ohlc", {})
                open_val = ohlc.get("open")
                high_val = ohlc.get("high")
                low_val = ohlc.get("low")
                close_val = ohlc.get("close")
                
                if simulate_real_time:
                    if high_val is not None and ltp > high_val:
                        high_val = ltp
                        ohlc["high"] = high_val
                    if low_val is not None and ltp < low_val:
                        low_val = ltp
                        ohlc["low"] = low_val
                        
                change_val = tick.get("change", 0.0)
                if close_val and close_val > 0:
                    change_val = ((ltp - close_val) / close_val) * 100
                    tick["change"] = change_val

                indicators = stock_indicators.get(symbol, {})
                close_yest = indicators.get("close_yest", close_val)

                if symbol not in active_candles or active_candles[symbol] is None or active_candles[symbol]["interval_start"] != active_interval:
                    prev_c = active_candles.get(symbol)
                    if prev_c is not None:
                        pat = get_candle_pattern(prev_c["open"], prev_c["high"], prev_c["low"], prev_c["close"])
                        last_completed_patterns[symbol] = pat
                        prev_time_str = prev_c["interval_start"].strftime("%I:%M %p").lstrip('0')
                        if prev_c["open"] > 0:
                            historical_candle_returns.setdefault(symbol, {})[prev_time_str] = ((prev_c["close"] - prev_c["open"]) / prev_c["open"]) * 100
                            should_save_cache = True
                    
                    active_candles[symbol] = {
                        "interval_start": active_interval,
                        "open": ltp,
                        "high": ltp,
                        "low": ltp,
                        "close": ltp
                    }
                else:
                    active_candles[symbol]["high"] = max(active_candles[symbol]["high"], ltp)
                    active_candles[symbol]["low"] = min(active_candles[symbol]["low"], ltp)
                    active_candles[symbol]["close"] = ltp

                active_ret = 0.0
                active_c = active_candles[symbol]
                if active_c["open"] > 0:
                    active_ret = ((active_c["close"] - active_c["open"]) / active_c["open"]) * 100

                # ------------------- PREPARE SHEET 1 UPDATES -------------------
                if symbol in symbol_to_row1:
                    row1 = symbol_to_row1[symbol]
                    
                    if "LTP" in col_mappings1:
                        updates1.append({"range": f"{col_mappings1['LTP']}{row1}", "values": [[ltp]]})
                    if "OPEN" in col_mappings1 and open_val is not None:
                        updates1.append({"range": f"{col_mappings1['OPEN']}{row1}", "values": [[open_val]]})
                    if "HIGH" in col_mappings1 and high_val is not None:
                        updates1.append({"range": f"{col_mappings1['HIGH']}{row1}", "values": [[high_val]]})
                    if "LOW" in col_mappings1 and low_val is not None:
                        updates1.append({"range": f"{col_mappings1['LOW']}{row1}", "values": [[low_val]]})
                    if "CHANGE" in col_mappings1 and change_val is not None:
                        updates1.append({"range": f"{col_mappings1['CHANGE']}{row1}", "values": [[format_percent(change_val)]]})
                        
                    if "INTRA %" in headers1 and open_val and open_val > 0:
                        intra_val = ((ltp - open_val) / open_val) * 100
                        updates1.append({"range": f"{sheet1_cols['INTRA %']}{row1}", "values": [[format_percent(intra_val)]]})
                        
                    if "LTP YEST" in headers1 and close_yest:
                        yest_col = sheet1_cols["LTP YEST"]
                        updates1.append({"range": f"{yest_col}{row1}", "values": [[close_yest]]})

                    if "GAP %" in sheet1_cols and open_val is not None and close_yest:
                        gap_pct = (open_val - close_yest) / close_yest
                        updates1.append({"range": f"{sheet1_cols['GAP %']}{row1}", "values": [[format_percent(gap_pct * 100)]]})
                        
                        if "GAP FILL" in sheet1_cols:
                            gap_fill = ""
                            if gap_pct > 0:
                                gap_fill = "FILLED" if ltp <= close_yest else "DOWN"
                            elif gap_pct < 0:
                                gap_fill = "FILLED" if ltp >= close_yest else "UP"
                            updates1.append({"range": f"{sheet1_cols['GAP FILL']}{row1}", "values": [[gap_fill]]})

                    volume_today = tick.get("volume", 0)
                    avg_vol_20 = indicators.get("avg_vol_20")
                    if avg_vol_20 and avg_vol_20 > 0:
                        if "VOL %" in sheet1_cols:
                            vol_pct = (volume_today / avg_vol_20) * 100
                            updates1.append({"range": f"{sheet1_cols['VOL %']}{row1}", "values": [[format_percent(vol_pct)]]})
                        if "PRE VOL%" in sheet1_cols:
                            volume_yest = indicators.get("volume_yest", 0)
                            pre_vol_pct = (volume_yest / avg_vol_20) * 100
                            updates1.append({"range": f"{sheet1_cols['PRE VOL%']}{row1}", "values": [[format_percent(pre_vol_pct)]]})

                    # CPR & Pivots
                    tc = indicators.get("tc")
                    bc = indicators.get("bc")
                    if "CPR" in sheet1_cols and tc is not None and bc is not None:
                        cpr_min = min(tc, bc)
                        cpr_max = max(tc, bc)
                        cpr_val = "> CPR" if ltp > cpr_max else ("< CPR" if ltp < cpr_min else "= CPR")
                        updates1.append({"range": f"{sheet1_cols['CPR']}{row1}", "values": [[cpr_val]]})

                    pivot = indicators.get("pivot")
                    s1 = indicators.get("s1")
                    s2 = indicators.get("s2")
                    r1 = indicators.get("r1")
                    r2 = indicators.get("r2")

                    if "PIVOT" in sheet1_cols and pivot is not None:
                        pivot_val = "ABOVE" if ltp > pivot else "BELOW"
                        updates1.append({"range": f"{sheet1_cols['PIVOT']}{row1}", "values": [[pivot_val]]})
                    if "S1" in sheet1_cols and s1 is not None:
                        updates1.append({"range": f"{sheet1_cols['S1']}{row1}", "values": [["BELOW S1" if ltp < s1 else ""]]})
                    if "S2" in sheet1_cols and s2 is not None:
                        updates1.append({"range": f"{sheet1_cols['S2']}{row1}", "values": [["BELOW S2" if ltp < s2 else ""]]})
                    if "R1" in sheet1_cols and r1 is not None:
                        updates1.append({"range": f"{sheet1_cols['R1']}{row1}", "values": [["ABOVE R1" if ltp > r1 else ""]]})
                    if "R2" in sheet1_cols and r2 is not None:
                        updates1.append({"range": f"{sheet1_cols['R2']}{row1}", "values": [["ABOVE R2" if ltp > r2 else ""]]})

                    high_yest = indicators.get("high_yest")
                    low_yest = indicators.get("low_yest")
                    if "NEW H/L" in sheet1_cols and high_yest is not None and low_yest is not None:
                        new_hl = "NEW H" if (high_val is not None and high_val > high_yest) else ("NEW L" if (low_val is not None and low_val < low_yest) else "")
                        updates1.append({"range": f"{sheet1_cols['NEW H/L']}{row1}", "values": [[new_hl]]})

                    if "NEAR" in sheet1_cols and high_val is not None and low_val is not None:
                        near_val = "HIGH" if (high_val - ltp <= 0.01 * ltp) else ("LOW" if (ltp - low_val <= 0.01 * ltp) else "")
                        updates1.append({"range": f"{sheet1_cols['NEAR']}{row1}", "values": [[near_val]]})

                    dma5 = indicators.get("dma5")
                    dma13 = indicators.get("dma13")
                    if "DMA 5/13" in sheet1_cols and dma5 is not None and dma13 is not None:
                        updates1.append({"range": f"{sheet1_cols['DMA 5/13']}{row1}", "values": [["UP" if dma5 > dma13 else "DOWN"]]})

                    dma200 = indicators.get("dma200")
                    if dma200:
                        if "200 DMA" in sheet1_cols:
                            updates1.append({"range": f"{sheet1_cols['200 DMA']}{row1}", "values": [[round(dma200, 2)]]})
                        if "200 DMA%" in sheet1_cols:
                            updates1.append({"range": f"{sheet1_cols['200 DMA%']}{row1}", "values": [[format_percent(((ltp - dma200) / dma200) * 100)]]})

                    if "OPEN =" in sheet1_cols and open_val is not None and high_val is not None and low_val is not None:
                        open_eq = "OPEN HIGH" if abs(open_val - high_val) < 0.0001 else ("OPEN LOW" if abs(open_val - low_val) < 0.0001 else "")
                        updates1.append({"range": f"{sheet1_cols['OPEN =']}{row1}", "values": [[open_eq]]})

                # ------------------- PREPARE SHEET 2 UPDATES -------------------
                if symbol in symbol_to_row2:
                    row2 = symbol_to_row2[symbol]
                    
                    if "LTP" in col_mappings2:
                        updates2.append({"range": f"{col_mappings2['LTP']}{row2}", "values": [[ltp]]})
                    if "HIGH" in col_mappings2 and high_val is not None:
                        updates2.append({"range": f"{col_mappings2['HIGH']}{row2}", "values": [[high_val]]})
                    if "LOW" in col_mappings2 and low_val is not None:
                        updates2.append({"range": f"{col_mappings2['LOW']}{row2}", "values": [[low_val]]})
                    if "CHANGE" in col_mappings2 and change_val is not None:
                        updates2.append({"range": f"{col_mappings2['CHANGE']}{row2}", "values": [[format_percent(change_val)]]})
                        
                    if "INTRA %" in sheet2_cols and open_val and open_val > 0:
                        intra_val = ((ltp - open_val) / open_val) * 100
                        updates2.append({"range": f"{sheet2_cols['INTRA %']}{row2}", "values": [[format_percent(intra_val)]]})

                    if "GAP %" in sheet2_cols and open_val is not None and close_yest:
                        gap_pct = (open_val - close_yest) / close_yest
                        updates2.append({"range": f"{sheet2_cols['GAP %']}{row2}", "values": [[format_percent(gap_pct * 100)]]})

                    if "OPEN =" in sheet2_cols and open_val is not None and high_val is not None and low_val is not None:
                        open_eq = "OPEN HIGH" if abs(open_val - high_val) < 0.0001 else ("OPEN LOW" if abs(open_val - low_val) < 0.0001 else "")
                        updates2.append({"range": f"{sheet2_cols['OPEN =']}{row2}", "values": [[open_eq]]})

                    if "LAST TYPE" in sheet2_cols:
                        pat = last_completed_patterns.get(symbol, "")
                        updates2.append({"range": f"{sheet2_cols['LAST TYPE']}{row2}", "values": [[pat]]})

                    # Define time headers list
                    TIME_HEADERS = [
                        "9:15 AM", "9:30 AM", "9:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
                        "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM", "12:00 PM", "12:15 PM", "12:30 PM",
                        "12:45 PM", "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM", "2:00 PM", "2:15 PM",
                        "2:30 PM", "2:45 PM", "3:00 PM", "3:15 PM"
                    ]
                    
                    def parse_time_str(t_str):
                        try:
                            return datetime.datetime.strptime(t_str, "%I:%M %p").time()
                        except Exception:
                            return None

                    active_time_obj = active_interval.time()
                    for h_time in TIME_HEADERS:
                        if h_time in sheet2_cols:
                            h_time_obj = parse_time_str(h_time)
                            if h_time_obj is not None:
                                if h_time_obj > active_time_obj:
                                    # Future candle: show 0.00%
                                    updates2.append({"range": f"{sheet2_cols[h_time]}{row2}", "values": [["0.00%"]]})
                                elif h_time_obj == active_time_obj:
                                    # Active candle: show live return
                                    updates2.append({"range": f"{sheet2_cols[h_time]}{row2}", "values": [[format_percent(active_ret)]]})
                                else:
                                    # Completed/Past candle: show historical return if present, otherwise 0.00%
                                    h_ret = historical_candle_returns.get(symbol, {}).get(h_time)
                                    val = format_percent(h_ret) if h_ret is not None else "0.00%"
                                    updates2.append({"range": f"{sheet2_cols[h_time]}{row2}", "values": [[val]]})


            if updates1:
                logger.info(f"Streaming {len(updates1)} updates to Sheet1...")
                update_sheet_with_retry(1, updates1)
                    
            if updates2:
                logger.info(f"Streaming {len(updates2)} updates to Sheet2...")
                update_sheet_with_retry(2, updates2)
                    
                if should_save_cache:
                    try:
                        with open(CACHE_FILE, "w") as cf:
                            json.dump({
                                "date": today_str,
                                "indicators": stock_indicators,
                                "historical_candle_returns": historical_candle_returns,
                                "last_completed_patterns": last_completed_patterns
                            }, cf)
                        logger.info("Saved updated candles & patterns to local cache.")
                    except Exception as cache_err:
                        logger.warning(f"Error saving cache inside loop: {cache_err}")

    updater_thread = threading.Thread(target=sheet_updater_loop, daemon=True)
    updater_thread.start()

    logger.info("Connecting to Zerodha Kite WebSocket Ticker...")
    kws = KiteTicker(api_key, access_token, reconnect=True)

    def on_ticks(ws, ticks):
        with price_lock:
            for tick in ticks:
                token = tick.get("instrument_token")
                if token and token in latest_prices:
                    if tick.get("last_price"):
                        latest_prices[token]["last_price"] = tick["last_price"]
                    if tick.get("ohlc"):
                        latest_prices[token]["ohlc"] = tick["ohlc"]
                    if tick.get("change") is not None:
                        latest_prices[token]["change"] = tick["change"]
                    if tick.get("volume") is not None:
                        latest_prices[token]["volume"] = tick["volume"]

    def on_connect(ws, response):
        logger.info("Kite WebSocket connected! Subscribing to stock tokens...")
        ws.subscribe(instrument_tokens)
        ws.set_mode(ws.MODE_QUOTE, instrument_tokens)

    def on_close(ws, code, reason):
        logger.warning(f"Kite WebSocket closed: {code} - {reason}")

    def on_error(ws, code, reason):
        logger.error(f"Kite WebSocket error: {code} - {reason}")

    kws.on_ticks = on_ticks
    kws.on_connect = on_connect
    kws.on_close = on_close
    kws.on_error = on_error

    # Connect in a background thread so the main thread can monitor time and flags
    kws.connect(threaded=True)
    logger.info("Kite WebSocket ticker started in background thread.")

    # Streaming session control loop
    while True:
        time.sleep(5)
        now_ist = get_now_ist()
        is_market_hours = now_ist.weekday() < 5 and (datetime.time(9, 0) <= now_ist.time() <= datetime.time(15, 30))
        
        # Check if the Web UI requested a stop (either via file flag or Neon DB status)
        db_status = load_stream_status_from_db()
        if os.path.exists("force_stop.flag") or db_status == "inactive":
            if os.path.exists("force_stop.flag"):
                try:
                    os.remove("force_stop.flag")
                except Exception:
                    pass
            logger.info("Manual force stop (file flag or DB status) requested. Terminating streaming session...")
            break
            
        if not is_market_hours:
            logger.info("Market hours ended. Closing streaming session...")
            break

    # Clean shutdown
    logger.info("Stopping WebSocket connection...")
    try:
        kws.close()
    except Exception:
        pass

STATUS_FILE = "streamer_status.json"

def get_now_ist():
    return datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30)))

def write_status(status_str, error_str=""):
    try:
        with open(STATUS_FILE, "w") as sf:
            json.dump({
                "status": status_str,
                "last_update": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "error": error_str
            }, sf)
    except Exception:
        pass

def main():
    logger.info("Starting Auto-Scheduler Daemon...")
    last_login_date = None
    
    # Write initial status
    write_status("Idle / Waiting for Market Hours")
    
    while True:
        try:
            now_ist = get_now_ist()
            is_weekday = now_ist.weekday() < 5
            
            # Run daily login and update credentials at 8:00 AM IST (or when daemon starts past 8:00 AM)
            today_str = now_ist.strftime("%Y-%m-%d")
            
            # Check Neon DB stream status (active = force run, inactive = force stop)
            db_status = load_stream_status_from_db()
            
            # Start streaming if we are within market hours (9:00 AM - 3:30 PM IST)
            is_market_hours = is_weekday and (datetime.time(9, 0) <= now_ist.time() <= datetime.time(15, 30))
            
            # Force status based on Neon DB state key
            if db_status == "active":
                is_market_hours = True
            elif db_status == "inactive":
                is_market_hours = False
            
            # Check for local file force flags
            if os.path.exists("force_run.flag"):
                try:
                    os.remove("force_run.flag")
                except Exception:
                    pass
                logger.info("Force Run flag detected! Starting streaming session immediately...")
                is_market_hours = True
                
            if is_market_hours:
                logger.info("Starting streaming session...")
                write_status("Streaming Active")
                run_streamer()
                logger.info("Streaming session finished.")
                write_status("Idle / Market Closed")
            else:
                # Log idle status
                write_status("Idle / Waiting for Market Hours")
                
        except Exception as e:
            logger.exception("Error in Scheduler Daemon loop")
            write_status("Error", str(e))
            
        time.sleep(10)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Kite streamer shutdown requested by user.")
