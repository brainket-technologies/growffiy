--
-- PostgreSQL database dump
--

\restrict VkXzTyjJgLC0U5uaCELZw8OPqSrMVst7dH34GhHvT45VtfPCO1aRPvQUdCmXbWa

-- Dumped from database version 18.4 (eaf151e)
-- Dumped by pg_dump version 18.4 (Homebrew)

-- Started on 2026-07-07 07:43:56 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16523)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 16658)
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id text NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 16673)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    admin_id text NOT NULL,
    action text NOT NULL,
    old_value text,
    new_value text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 16558)
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    user_id text NOT NULL,
    zerodha_client_id text,
    access_token text,
    capital numeric(12,2) NOT NULL,
    strategy_id text,
    trading_status text DEFAULT 'inactive'::text NOT NULL,
    subscription_status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    zerodha_api_key text,
    zerodha_api_secret text,
    zerodha_session text,
    zerodha_password text,
    zerodha_totp_secret text,
    aadhaar_number text,
    dob text,
    kyc_status text DEFAULT 'pending'::text NOT NULL,
    pan_number text,
    product_type_id text
);


--
-- TOC entry 226 (class 1259 OID 16642)
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    razorpay_order_id text NOT NULL,
    razorpay_payment_id text,
    status text NOT NULL,
    payment_date timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 196608)
-- Name: product_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_types (
    id text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 16577)
-- Name: strategies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategies (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    config_json text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 81954)
-- Name: strategy_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_assignments (
    id text NOT NULL,
    client_id text NOT NULL,
    strategy_id text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 81996)
-- Name: strategy_backtests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_backtests (
    id text NOT NULL,
    strategy_id text NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    pnl numeric(12,2) NOT NULL,
    win_rate numeric(5,2) NOT NULL,
    total_trades integer NOT NULL,
    config_json text,
    status text DEFAULT 'completed'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 81938)
-- Name: strategy_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_conditions (
    id text NOT NULL,
    strategy_id text NOT NULL,
    logical text DEFAULT 'AND'::text NOT NULL,
    indicator text NOT NULL,
    operator text NOT NULL,
    value text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 81982)
-- Name: strategy_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_logs (
    id text NOT NULL,
    strategy_id text NOT NULL,
    message text NOT NULL,
    "logType" text DEFAULT 'info'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 81969)
-- Name: strategy_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.strategy_templates (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    config_json text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 16609)
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    duration_days integer NOT NULL,
    features text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    product_type_id text
);


--
-- TOC entry 225 (class 1259 OID 16625)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    user_id text NOT NULL,
    plan_id text NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 16685)
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id text NOT NULL,
    user_id text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    category text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    reply text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 16591)
-- Name: trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trades (
    id text NOT NULL,
    client_id text NOT NULL,
    strategy_id text NOT NULL,
    symbol text NOT NULL,
    order_type text NOT NULL,
    entry_price numeric(12,2),
    exit_price numeric(12,2),
    quantity integer NOT NULL,
    stop_loss numeric(12,2),
    target numeric(12,2),
    pnl numeric(12,2),
    status text DEFAULT 'open'::text NOT NULL,
    entry_time timestamp(3) without time zone,
    exit_time timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    kite_response jsonb,
    entry_order_id text,
    exit_reason text,
    sl_order_id text,
    sl_trigger_price numeric(12,2),
    target_order_id text,
    original_entry_price numeric(12,2),
    original_stop_loss numeric(12,2),
    original_target numeric(12,2),
    entry_order_status text,
    sl_order_status text,
    target_order_status text,
    sl_kite_response jsonb,
    target_kite_response jsonb,
    direction text,
    dual_leg_group_id text,
    leg_name text,
    leg_timeframe text
);


--
-- TOC entry 220 (class 1259 OID 16539)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    mobile text,
    user_id text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'client'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- TOC entry 3570 (class 0 OID 16523)
-- Dependencies: 219
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d2e0d5f9-210d-431e-9c5d-839e3201ec74	96c1174b6c686dc3f3e906078b26f73e2bf0ce975b032fee27dbf423efa8320c	2026-06-13 05:14:51.767549+00	20260613051443_init	\N	\N	2026-06-13 05:14:45.087697+00	1
\.


--
-- TOC entry 3578 (class 0 OID 16658)
-- Dependencies: 227
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, setting_key, setting_value, type, created_at, updated_at) FROM stdin;
bef3c6ef-c44d-459b-8839-42576ff76bcb	razorpay_test_key_secret	cg1a00OrYs4Wn7gD7YE93jXD	string	2026-06-13 12:52:47.676	2026-06-24 17:58:03.308
d28caef2-bc4e-42ba-86fc-dd372c428a1e	razorpay_live_key_id	rzp_live_T17esLJpmNRSmQ	string	2026-06-13 12:52:47.681	2026-06-24 17:58:03.556
0d00bda1-6285-4563-8fbc-28322287a1ce	razorpay_live_key_secret	YOURSMiQx7v4pQadX5a5LAeQ	string	2026-06-13 12:52:47.686	2026-06-24 17:58:03.804
957fdeec-3225-4c12-930d-47abacdc487e	razorpay_mode	test	string	2026-06-13 12:52:47.691	2026-06-24 17:58:04.05
94676b3d-a2bf-441b-ae4e-c10fb477d072	smtp_host		string	2026-06-13 12:52:47.696	2026-06-24 17:58:04.298
470fcd65-4ca6-4829-beca-45650c3bbb32	smtp_port	587	string	2026-06-13 12:52:47.701	2026-06-24 17:58:04.547
a81be59b-d350-4807-81e7-b88fc0d760d8	smtp_user		string	2026-06-13 12:52:47.706	2026-06-24 17:58:04.793
8ce76109-33d0-46cf-9256-f23fb4a1c1c3	smtp_password		string	2026-06-13 12:52:47.71	2026-06-24 17:58:05.041
e6c7bda0-716e-48da-9c8a-73b8dd4f856c	smtp_sender_name	Growffiy	string	2026-06-13 12:52:47.715	2026-06-24 17:58:05.289
3813bc5c-1170-4b6c-b7eb-6b27c9947c84	isTradingActive	true	boolean	2026-06-16 18:48:33.683	2026-06-24 18:28:23.459
ce09fff2-8901-4ed1-930c-9c29373a16ec	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-06-30	locked	lock	2026-06-30 04:44:24.955	2026-06-30 04:44:24.955
e5e97532-d392-455e-abc5-a65945bfb21a	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-07-01	locked	lock	2026-07-01 03:50:38.123	2026-07-01 03:50:38.123
fb7389af-5ccc-4a77-b5ad-fab664011633	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-07-02	locked	lock	2026-07-02 03:50:42.344	2026-07-02 03:50:42.344
2eb3fc15-3e89-4d13-91e4-842417c3810e	smtp_encryption	tls	string	2026-06-13 12:52:47.72	2026-06-24 17:57:57.346
87594b21-70bb-44d5-85df-ca3042dd30e8	smtp_status	false	string	2026-06-13 13:17:05.476	2026-06-24 17:57:57.595
3c7d6b7f-c7f1-4026-9695-c35e01b9cdb8	support_email	support@growffiy.com	string	2026-06-14 06:42:01.144	2026-06-24 17:57:57.843
31244e8c-378c-4b9e-b94a-fabd7e1e94e2	algo_entry_time	09:20:30	string	2026-06-18 16:21:46.118	2026-06-24 17:57:58.091
000cbf6f-4f56-4478-bac4-4dc41385d23b	support_phone	+91 9026663052	string	2026-06-14 06:42:01.152	2026-06-24 17:57:58.339
9895f66a-2049-4d51-85f3-2dd78e358c57	algo_check_interval_sec	60	string	2026-06-18 16:21:46.61	2026-06-24 17:57:58.587
08dd1962-7f47-4a38-bc25-bec4783249b7	support_timings	Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)	string	2026-06-14 06:42:01.156	2026-06-24 17:57:59.083
b40894b6-d50f-4d89-9096-e8f5c2888dfd	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-07-03	locked	lock	2026-07-03 03:50:38.596	2026-07-03 03:50:38.596
4b9fe07a-a46a-4ba3-b1ee-4635ac483e75	PRE_OPEN_QUOTES_DATA	{"quotes":[]}	json	2026-06-15 06:34:12.135	2026-06-24 17:57:59.331
da2a7128-b9d3-4083-ab10-fc86227f748a	algo_preopen_fetch_time	09:08	string	2026-06-18 16:21:45.869	2026-06-24 17:57:59.58
b044cde0-d7f8-4c2a-bc99-a209f8296cda	algo_token_refresh_time	08:00	string	2026-06-18 16:21:46.363	2026-06-24 17:57:59.826
16ded507-6030-478a-8ca6-de6f76348a2a	auto_trade_enabled	true	string	2026-06-19 20:14:24.681	2026-06-24 17:58:00.074
c81ddaab-b729-4732-ad24-bd42e50d0ede	trading_days	["Mon","Tue","Wed","Thu","Fri"]	string	2026-06-19 20:14:27.514	2026-06-24 17:58:00.322
f8cceaea-59a0-47c2-8a77-cf91f569f463	special_market_days	[]	string	2026-06-19 20:14:27.852	2026-06-24 17:58:00.572
915db754-9bfd-45ec-a780-776834c8d681	market_holidays	[{"date":"2026-06-26","name":"Muharram"}]	string	2026-06-19 20:14:28.223	2026-06-24 17:58:00.818
3cd6d731-646b-41e0-9b02-eb7d238cea4e	app_name	Growffi	string	2026-06-21 21:46:32.369	2026-06-24 17:58:01.068
0daab40f-3239-432d-8d3c-0388fd7062f4	app_title	Growffiy — 	string	2026-06-21 21:46:32.698	2026-06-24 17:58:01.317
248a11d6-03e0-4982-81e9-6ba91f59ba6c	app_favicon		string	2026-06-21 21:46:33.005	2026-06-24 17:58:01.565
2e8ea13a-bd1b-4439-b744-aa4fa56091c0	app_logo		string	2026-06-21 21:46:33.246	2026-06-24 17:58:01.813
bbf12f03-e575-42a6-ac18-f398aa63c110	meta_description	afldhf	string	2026-06-21 21:46:33.486	2026-06-24 17:58:02.06
0b353118-0eec-4cdc-ab32-1a401169a7cf	meta_keywords	dfla	string	2026-06-21 21:46:33.725	2026-06-24 17:58:02.316
7cfe80b5-de1e-4248-86ee-5c1c5159fa75	footer_text	fdflahf	string	2026-06-21 21:46:33.968	2026-06-24 17:58:02.565
d0c1cd6c-43b0-4e00-8564-e273e339d67b	google_analytics_id	fdajf	string	2026-06-21 21:46:34.209	2026-06-24 17:58:02.812
7e370e4c-da09-4f58-983f-5787ada81590	razorpay_test_key_id	rzp_test_T17dGCGWmqwnLG	string	2026-06-13 12:52:47.666	2026-06-24 17:58:03.06
3e9c65c1-17d6-4c02-92eb-39b2144cb059	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-07-06	locked	lock	2026-07-06 04:42:33.287	2026-07-06 04:42:33.287
24debe63-cb3a-4d7e-b8d9-981b1f083fb4	trade_lock_b364d72f-e2e2-4dbc-bbef-3286c75e1875_c7bafa89-3403-44c3-bcd0-199602c878e1_2026-07-05	locked	lock	2026-07-06 05:25:45.979	2026-07-06 05:25:45.979
\.


--
-- TOC entry 3579 (class 0 OID 16673)
-- Dependencies: 228
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, admin_id, action, old_value, new_value, created_at) FROM stdin;
90eb57d6-a462-40ab-8919-56548969c404	dd7cb114-8fd4-457c-a963-9318188a1e8e	Auto Trading Stopped	\N	Algorithmic terminal engine powered off | Endpoint: POST /api/trading/toggle | Payload: {"active":false} | Response: {"success":true,"isTradingActive":false}	2026-06-24 18:28:20.838
c4d65714-6193-4486-9ace-4b3f18dc42c1	dd7cb114-8fd4-457c-a963-9318188a1e8e	Auto Trading Started	\N	Algorithmic terminal engine powered on | Endpoint: POST /api/trading/toggle | Payload: {"active":true} | Response: {"success":true,"isTradingActive":true}	2026-06-24 18:28:25.438
58e47dbd-ed29-4ae1-8e66-6170c248ff30	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Disconnected	\N	Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:28:55.617Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":3,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}	2026-06-24 18:28:57.374
f0378bdb-37e2-4740-9c32-0eb0233bff1f	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Disconnected	\N	Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:29:08.679Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T17:57:54.840Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":3,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}	2026-06-24 18:29:10.399
39a7b80f-0330-4160-9fd8-91807733e529	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-24 18:29:21.606
6bb744c4-27b3-4a86-b30e-9317a79dfe2f	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-24 18:29:44.315
dc0030a4-d984-4e96-b595-57b8b06c8a67	dd7cb114-8fd4-457c-a963-9318188a1e8e	Trading Status Changed	\N	Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":500000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"500000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T18:32:00.106Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T18:31:59.648Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":3,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}	2026-06-24 18:32:01.728
076177d1-e0ad-40e4-904f-f8246a780232	dd7cb114-8fd4-457c-a963-9318188a1e8e	Trading Status Changed	\N	Trading status of client Vikash sharma changed to ACTIVE | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"name":"Vikash sharma","email":"vikash@gmail.com","userId":"vikashsharma162","password":"grw_QyWf8D2n","zerodhaClientId":"RZJ500","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","capital":100000,"tradingStatus":"active","panNumber":"","aadhaarNumber":"","dob":"","kycStatus":"verified","productTypeId":"prod-algo"} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq","capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T19:11:36.479Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":"{\\"user_type\\":\\"individual/ind_with_nom\\",\\"email\\":\\"js9650141@gmail.com\\",\\"user_name\\":\\"Janvi Sharma\\",\\"user_shortname\\":\\"Janvi\\",\\"broker\\":\\"ZERODHA\\",\\"exchanges\\":[\\"BSE\\",\\"MF\\",\\"NSE\\"],\\"products\\":[\\"CNC\\",\\"NRML\\",\\"MIS\\",\\"BO\\",\\"CO\\"],\\"order_types\\":[\\"MARKET\\",\\"LIMIT\\",\\"SL\\",\\"SL-M\\"],\\"avatar_url\\":null,\\"user_id\\":\\"RZJ500\\",\\"api_key\\":\\"4y7j026qyv9lkacw\\",\\"access_token\\":\\"nKDLbxnRhHFcvp6BCqqFkwvwcIlTAzyq\\",\\"public_token\\":\\"6vd1MIvPV93tQc2BTiSUDCE0QVhD0v8S\\",\\"refresh_token\\":\\"\\",\\"enctoken\\":\\"pdb3OZcx9DKlh88jowK1JTrQABr+XbtmGyoS4z8ProrgaOJ85ANrrRxC/WyILqQyUjsc/c0h0UBulJP1EGj++ZCeiONQ8HvAq0b+obEiQ+ZLshFTx4ZPoxgGJ+3DLeo=\\",\\"login_time\\":\\"2026-06-24 10:31:07\\",\\"meta\\":{\\"demat_consent\\":\\"consent\\"}}","zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":3,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}	2026-06-24 19:11:38.216
52cd7a79-bff3-4168-9012-147758f28fd1	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Disconnected	\N	Disconnected active Kite session token for Vikash sharma | Endpoint: PUT /api/clients/b364d72f-e2e2-4dbc-bbef-3286c75e1875 | Payload: {"accessToken":null} | Response: {"id":"b364d72f-e2e2-4dbc-bbef-3286c75e1875","userId":"846d4c97-be94-4a06-a72c-c048daf71e3c","zerodhaClientId":"RZJ500","accessToken":null,"capital":"100000","strategyId":"c7bafa89-3403-44c3-bcd0-199602c878e1","tradingStatus":"active","subscriptionStatus":"active","createdAt":"2026-06-13T07:58:14.215Z","updatedAt":"2026-06-24T20:09:55.187Z","zerodhaApiKey":"4y7j026qyv9lkacw","zerodhaApiSecret":"xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9","zerodhaSession":null,"zerodhaPassword":"987654321","zerodhaTotpSecret":"JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ","aadhaarNumber":"","dob":"","kycStatus":"verified","panNumber":"","productTypeId":"prod-algo","user":{"id":"846d4c97-be94-4a06-a72c-c048daf71e3c","name":"Vikash sharma","email":"vikash@gmail.com","mobile":null,"userId":"vikashsharma162","password":"grw_QyWf8D2n","role":"client","status":"active","createdAt":"2026-06-13T07:58:14.195Z","updatedAt":"2026-06-24T19:11:35.982Z"},"strategy":{"id":"c7bafa89-3403-44c3-bcd0-199602c878e1","name":"Pre-Open Momentum Breakout","description":"Pre-Open Momentum Breakout Strategy","status":"active","configJson":"{\\"basicInfo\\":{\\"name\\":\\"Pre-Open Momentum Breakout\\",\\"status\\":\\"active\\",\\"segment\\":\\"NSE F&O\\",\\"exchange\\":\\"NSE\\",\\"entryTime\\":\\"09:20:30\\",\\"preSelectTime\\":\\"09:15:30\\",\\"selectPosition\\":1,\\"tradeType\\":\\"Intraday\\",\\"timeframe\\":\\"5m\\",\\"checkIntervalSec\\":60,\\"description\\":\\"Pre-Open Momentum Breakout Strategy\\",\\"exitTime\\":\\"15:24:00\\"},\\"stoploss\\":{\\"type\\":\\"Trailing SL\\",\\"orderType\\":\\"Market\\",\\"fixedPercent\\":1,\\"fixedPoints\\":10,\\"trailingSL\\":-1,\\"riskPercent\\":1},\\"target\\":{\\"type\\":\\"Trailing Target\\",\\"profitPercent\\":2,\\"riskRewardRatio\\":2,\\"partialExit\\":100,\\"trailingTarget\\":-1},\\"tradeAction\\":{\\"action\\":\\"Long\\",\\"orderType\\":\\"SL-Market\\",\\"bufferPercent\\":0.1,\\"candlePriceType\\":\\"high\\"},\\"riskManagement\\":{\\"riskPerTrade\\":3,\\"killSwitch\\":false,\\"maxOpenPositions\\":3,\\"maxDailyLoss\\":-1,\\"maxDailyProfit\\":-1,\\"capitalAllocation\\":-1,\\"misMarginRate\\":-1},\\"conditions\\":[]}","createdAt":"2026-06-16T12:59:09.893Z","updatedAt":"2026-06-24T17:57:55.343Z"},"productType":{"id":"prod-algo","name":"Algo","createdAt":"2026-06-22T01:06:32.766Z","updatedAt":"2026-06-24T17:57:53.522Z"}}	2026-06-24 20:09:56.981
ca7d5eea-cd18-47bf-9824-d8bc3d6393c8	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-25 02:30:46.166
254c0a7a-0702-4f28-866f-1fde62b409cb	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-25 02:31:03.841
d3f1e743-f744-4986-81c7-79de55b138c9	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-25 03:50:12.706
165a378a-5c2f-4ba6-b218-ccfdfe74bb5b	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-25 23:36:06.393
dee05d81-bc55-4be8-9063-4af50aa94ea9	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-26 01:04:49.105
26413362-628c-4128-8f9a-559392ce4395	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-26 02:30:37.497
7b74d3b2-f9db-47f9-a948-a5413d78520a	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-27 03:32:36.576
544eda35-f5a3-4999-86d7-ae5b700ff2bc	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-27 23:43:39.283
51853ed2-d640-47dd-98ee-be8a1862af83	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-28 02:16:05.497
2e1b679c-ae0a-4e27-8cb2-ba3a62dc84b9	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-28 02:30:05.931
5e9f02e1-2b9f-4187-af5b-176be2948ebb	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-29 02:54:00.443
33ed6dfe-3a08-4dd1-9150-abc637c87391	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-29 03:50:12.58
3b47572d-eb73-475c-b007-16515391033a	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: PERSISTENT | Qty: 7 | Entry: 4496.50	2026-06-29 03:51:15.351
c526ece4-17a4-41cc-8ff6-2fafa6b15fe8	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: 8b3cea71-f549-45d2-8bbf-323a7c1034b3	Failed exit for Vikash sharma (PERSISTENT) | Error: Your order could not be converted to a After Market Order (AMO).	2026-06-29 17:38:01.828
18643cd3-5aec-4be9-b480-e60525f4cafc	dd7cb114-8fd4-457c-a963-9318188a1e8e	UPDATE_STRATEGY	\N	Updated strategy Pre-Open Momentum Breakout	2026-06-29 17:50:20.836
0afb4172-42d4-4d1d-bb08-9f8fa60d15b8	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 01:53:11.685
6b023ad9-f04b-4a30-9f6c-0d4acf5a66dd	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 02:30:12.061
d7b2444b-e956-4dcc-b987-666f039b20b6	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 04:24:58.736
a6902003-f249-4a7b-83f6-529b9dc03f0c	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 04:24:59.246
7968dd28-e58e-4275-ba6a-c13fb4bfd19e	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: BHARATFORG | Qty: 4 | Entry: 2123.90	2026-06-30 04:26:01.84
a64a5ac5-1c11-4949-a7b0-6a77c64355f0	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: BHARATFORG | Qty: 4 | Entry: 2123.90	2026-06-30 04:26:02.343
e9cee798-59a4-42e3-bbba-59838e9e4476	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 04:36:17.102
3d2116c8-6227-4c37-bbc6-7a20e2de0c3d	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-06-30 04:36:17.566
e8235b67-906e-4200-873b-3221bb5d6dfd	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: BHARATFORG | Qty: 4 | Entry: 2124.10	2026-06-30 04:37:00.083
3f7a057e-dee5-42fe-adbf-e56ff24411e9	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: BHARATFORG | Qty: 4 | Entry: 2124.10	2026-06-30 04:37:00.48
2bea1615-5c19-40c0-ad97-d57f2168d577	dd7cb114-8fd4-457c-a963-9318188a1e8e	SL ORDER REJECTED	Trade ID: 805ed493-ed8e-4e0e-af8e-379b09848d34	Kite rejected SL order for BHARATFORG. Reason: Invalid `product`.	2026-06-30 04:44:26.404
53f0df55-38f6-4d17-bef0-8ce23f7844de	dd7cb114-8fd4-457c-a963-9318188a1e8e	TARGET ORDER REJECTED	Trade ID: 805ed493-ed8e-4e0e-af8e-379b09848d34	Kite rejected Target order for BHARATFORG. Reason: Invalid `product`.	2026-06-30 04:44:27.179
ebdffade-d328-4e46-861c-b50fa83d79f3	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: 805ed493-ed8e-4e0e-af8e-379b09848d34	Failed exit for Vikash sharma (BHARATFORG) | Error: Invalid `product`.	2026-06-30 05:42:01.204
ec9cfa07-80b4-4fa9-bc7d-0e2718ee67e8	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-01 00:50:36.601
3375a5f0-483d-4e00-a4f5-ff257e971e36	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-01 02:30:19.913
4e59c210-822b-409d-bdfc-5d1f2bee8944	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-01 03:50:39.822
3d167b16-74ec-4dce-a61b-37d42525a4f5	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: KPITTECH | Qty: 15 | Entry: 605.00	2026-07-01 03:51:43.558
41391ee8-a875-4c40-baa1-f98f7ac9d443	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-02 01:11:35.384
b5ed10a4-f57a-444a-afad-6d7d89c5f6d7	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-02 03:50:44.036
4d48071d-01c5-4263-8c6f-26b8379851a0	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE INITIATED	\N	Client: Vikash sharma | Strategy: Pre-Open Momentum Breakout | Stock: BAJFINANCE | Qty: 9 | Entry: 1012.70	2026-07-02 03:51:47.452
d5404688-7571-4f0b-80a5-8dbed7599ac8	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE CLOSED	Trade ID: a1b3763d-23e5-4640-8213-7568416fa570	Sold 9 BAJFINANCE @ ₹1012.80 | Market Close (15:15:00) | P&L: ₹0.00	2026-07-02 09:46:09.517
9302fcce-a225-44f2-91d7-fd683af387b8	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-03 01:05:13.635
07a16703-661b-40b9-8bd7-c82c03fc0c6b	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-03 03:50:40.309
efb0e0f2-0800-45e1-beec-2c46c63f10d0	dd7cb114-8fd4-457c-a963-9318188a1e8e	UPDATE_STRATEGY	\N	Updated strategy Pre-Open Momentum Breakout	2026-07-03 19:49:05.47
fe220243-63cd-4858-a5fb-bd7b6eb178a1	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-1	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:27:49.022
cd569ea0-5777-48f0-adee-c51a179d7ab4	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-2	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:27:49.021
e7bdc890-c65d-4084-9b57-4aaba0bee111	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-1	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:28:24.711
8e186cd6-1f33-4a5b-9248-ba0d685d48a1	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-2	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:28:26.9
79e3cdf3-2311-49f6-a4db-b9220c3b6e3c	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-1	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:29:39.508
1133a2d3-2471-47d5-8a4f-23ef47d99ece	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-trade-2	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:29:39.537
87e9e3d7-0811-4f04-8bc8-19c87225e2ac	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg1-long	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:37:18.256
cee708a2-0ac1-4a2e-a618-0c74f982bed1	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg2-short	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:37:18.262
13d0850c-6126-4a53-a3fb-badf128a0470	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg1-long	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:37:20.455
3453da5f-f98d-4c25-8b24-1b7124d349ca	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg2-short	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:37:18.224
f46eb42c-e6fb-47b0-be04-9b6f2871f3f8	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg1-long	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:38:27.262
726d5e1c-5176-409a-90c1-ef3eaa89ccaf	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg2-short	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-03 20:38:27.285
2469d3a0-fd41-4da5-af1b-59c0ba0071ef	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg2-short	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:38:27.974
b97d4659-0516-46b8-8873-d68067e6fc89	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: dummy-leg1-long	Failed exit for Vikash sharma (RELIANCE) | Error: IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	2026-07-03 20:38:27.993
e4a689ea-ae77-42c1-a5df-f8633f4d5b03	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-04 03:45:43.978
4538c3b9-4a92-4554-9454-636bf37b2570	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: demo-l2-filled	Failed exit for Vikash sharma (TCS) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-04 09:46:07.464
e746b4b0-d106-44a1-b32d-fdf2d2ae6563	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: demo-l1-pending	Failed exit for Vikash sharma (HDFCBANK) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-04 09:46:07.469
8468b898-cd74-493c-842b-8af76b93c76e	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: demo-l1-filled	Failed exit for Vikash sharma (RELIANCE) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-04 09:46:07.469
9e3fe697-050b-44e0-85f6-859d2f266933	dd7cb114-8fd4-457c-a963-9318188a1e8e	AUTO TRADE EXIT FAILED	Trade ID: demo-l2-pending	Failed exit for Vikash sharma (HDFCBANK) | Error: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	2026-07-04 09:46:08.432
da7b6725-4bf9-456a-9b09-6d971c633a4e	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-04 23:55:34.624
e30baafb-4638-4b9d-b56d-c8cb5df91a97	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-05 01:24:51.318
38e85beb-cf3b-4e23-89ae-54e8f6becc3b	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-05 02:30:54.918
69442329-e732-403d-995f-2715dc011961	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-05 23:27:58.34
8559dab6-b129-400f-9fd5-41ecbb1f0e83	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 01:20:19.455
7dfe4d0b-50dc-4436-8f5c-b0bc80dbcda8	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:20.825
5e425c1f-aa66-4031-b606-9841c7bfba6d	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:22.055
960a5e22-b812-4744-a8e7-60c542897c4d	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:36.447
30fd8150-d17d-4abe-a067-51191e247886	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:36.44
2c66e626-9e58-44a3-96ba-95e9c8661128	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:42.582
1f7fda97-f61d-4444-ba37-ea4c79b92a5c	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 02:30:46.875
1d74cd4a-3580-4f4e-9854-f979fa4384b6	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 04:42:34.967
de1a0c05-7c94-45f6-81fb-753ae5ba7f04	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-06 23:17:05.119
73f99153-e947-444d-844f-59b163c426d0	dd7cb114-8fd4-457c-a963-9318188a1e8e	Kite Token Auto-Refreshed	\N	Token refreshed for Vikash sharma	2026-07-07 01:15:38.375
\.


--
-- TOC entry 3572 (class 0 OID 16558)
-- Dependencies: 221
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, user_id, zerodha_client_id, access_token, capital, strategy_id, trading_status, subscription_status, created_at, updated_at, zerodha_api_key, zerodha_api_secret, zerodha_session, zerodha_password, zerodha_totp_secret, aadhaar_number, dob, kyc_status, pan_number, product_type_id) FROM stdin;
b364d72f-e2e2-4dbc-bbef-3286c75e1875	846d4c97-be94-4a06-a72c-c048daf71e3c	RZJ500	IkAi2W4cqxdEcz3LX7RfD6o89KibtDyx	100000.00	c7bafa89-3403-44c3-bcd0-199602c878e1	active	active	2026-06-13 07:58:14.215	2026-07-07 01:15:37.881	4y7j026qyv9lkacw	xr2qwbkkn0kj8gbuzuwyn19ggxlxgye9	{"user_type":"individual/ind_with_nom","email":"js9650141@gmail.com","user_name":"Janvi Sharma","user_shortname":"Janvi","broker":"ZERODHA","exchanges":["BSE","MF","NSE"],"products":["CNC","NRML","MIS","BO","CO"],"order_types":["MARKET","LIMIT","SL","SL-M"],"avatar_url":null,"user_id":"RZJ500","api_key":"4y7j026qyv9lkacw","access_token":"IkAi2W4cqxdEcz3LX7RfD6o89KibtDyx","public_token":"bpkrMAD33wx58tfXpKCJO7M0mPn4RtJP","refresh_token":"","enctoken":"LuIeH7t4W6yoKAqqPpPa7XvTVDz62SzyNh/wjhkPXKcKkm3UKGmuH+FYQq6V1whK36QSeNsEqZdSoExQWHdz4fo6bQOjtgK4cdYmck7Sg8kapYBGszuDedvQZ+fwYKo=","login_time":"2026-07-07 06:45:37","meta":{"demat_consent":"consent"}}	987654321	JT5PXX4UOZZYNHTV7X525T6QSA4QNQDQ			verified		prod-algo
\.


--
-- TOC entry 3577 (class 0 OID 16642)
-- Dependencies: 226
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, user_id, plan_id, amount, razorpay_order_id, razorpay_payment_id, status, payment_date, created_at, updated_at) FROM stdin;
5bfc219b-d1ce-45f6-b5f4-91fa3f5096bd	846d4c97-be94-4a06-a72c-c048daf71e3c	73a18efe-9128-49dc-b658-6147133698b9	4999.00	order_T4SRKLgGO23GOz	pay_T4SRY7IpT4xup4	success	2026-06-21 23:11:06.353	2026-06-21 23:10:27.717	2026-06-24 17:58:05.796
\.


--
-- TOC entry 3586 (class 0 OID 196608)
-- Dependencies: 235
-- Data for Name: product_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_types (id, name, created_at, updated_at) FROM stdin;
prod-algo	Algo	2026-06-22 01:06:32.766	2026-07-03 19:31:43.945
prod-scanner	Scanner	2026-06-22 01:06:35.812	2026-07-03 19:31:46.696
\.


--
-- TOC entry 3573 (class 0 OID 16577)
-- Dependencies: 222
-- Data for Name: strategies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategies (id, name, description, status, config_json, created_at, updated_at) FROM stdin;
c7bafa89-3403-44c3-bcd0-199602c878e1	Pre-Open Momentum Breakout	Pre-Open Momentum Breakout Strategy	active	{"basicInfo":{"name":"Pre-Open Momentum Breakout","status":"active","segment":"NSE F&O","exchange":"NSE","preSelectTime":"09:15:30","selectPosition":1,"tradeType":"Intraday","checkIntervalSec":60,"description":"Pre-Open Momentum Breakout Strategy","exitTime":"15:15:00"},"stoploss":{"type":"Fixed %","orderType":"Market","fixedPercent":1,"fixedPoints":10,"trailingSL":-1,"riskPercent":1},"target":{"type":"Trailing Target","profitPercent":2,"riskRewardRatio":2,"partialExit":100,"trailingTarget":-1},"riskManagement":{"riskPerTrade":1,"killSwitch":false,"maxOpenPositions":3,"maxDailyLoss":-1,"maxDailyProfit":-1,"capitalAllocation":-1,"misMarginRate":-1},"conditions":[{"value":"-10","logical":"AND","operator":">","indicator":"Pre Open Change %"}],"legs":[{"name":"Leg 1","enabled":true,"entryTime":"09:20:30","timeframe":"5m","tradeAction":{"action":"Long","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"high"}},{"name":"Leg 2","enabled":true,"entryTime":"09:30:00","timeframe":"15m","tradeAction":{"action":"Short","orderType":"SL-Market","bufferPercent":0.1,"candlePriceType":"low"}}]}	2026-06-16 12:59:09.893	2026-07-03 19:49:04.436
\.


--
-- TOC entry 3582 (class 0 OID 81954)
-- Dependencies: 231
-- Data for Name: strategy_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategy_assignments (id, client_id, strategy_id, status, created_at, updated_at) FROM stdin;
6b5595d6-7181-4b8d-9d88-f61563603bb6	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	active	2026-06-13 07:58:14.215	2026-06-24 17:58:06.298
81977e6e-88cb-4f5a-a0cc-96fb67673a25	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	active	2026-06-21 20:39:30.248	2026-06-24 17:58:06.548
efbd6895-f105-41c1-81f2-6cd1f06f557a	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	active	2026-06-21 20:39:31.317	2026-06-24 17:58:06.801
\.


--
-- TOC entry 3585 (class 0 OID 81996)
-- Dependencies: 234
-- Data for Name: strategy_backtests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategy_backtests (id, strategy_id, start_date, end_date, pnl, win_rate, total_trades, config_json, status, created_at) FROM stdin;
\.


--
-- TOC entry 3581 (class 0 OID 81938)
-- Dependencies: 230
-- Data for Name: strategy_conditions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategy_conditions (id, strategy_id, logical, indicator, operator, value, created_at) FROM stdin;
a71c5a26-6f89-43ef-a188-1036708fb385	c7bafa89-3403-44c3-bcd0-199602c878e1	AND	Pre Open Change %	>	-10	2026-07-03 19:49:04.796
\.


--
-- TOC entry 3584 (class 0 OID 81982)
-- Dependencies: 233
-- Data for Name: strategy_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategy_logs (id, strategy_id, message, "logType", created_at) FROM stdin;
008ee260-460b-4d60-88d4-f495e8f4ef1e	c7bafa89-3403-44c3-bcd0-199602c878e1	Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.	info	2026-06-16 18:20:15.192
988b766f-06b3-43dc-8c81-3a2823d66e17	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.	error	2026-06-16 18:39:19.598
481c5d9a-edff-4043-abbc-150652efdec1	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.	error	2026-06-16 18:48:33.941
c330337b-2647-40ef-9113-a700ea565bfc	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Zerodha API returned error status. Trade aborted.	error	2026-06-16 19:46:36.841
7ebf171e-4f99-45b2-be88-f5625d0b41da	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (3.86.244.195) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-16 19:56:23.22
8b6628ab-5cb7-40b0-aa38-4dc495a8c573	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (100.26.48.193) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-16 19:57:36.308
43f15089-10fb-4939-9836-50e84193b980	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (44.192.70.209) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-16 19:59:03.339
529b6384-6f29-444f-949b-e38ad86475cf	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (100.58.222.232) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 19:41:35.122
6c723938-8fc0-4387-a4c3-bc1ebcbb425f	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (32.192.52.0) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 19:44:30.1
f8653bb3-b34c-4a84-8353-13521ae1282a	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (23.20.22.105) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 20:02:42.736
3559e1dd-45fb-4327-9f3e-26ffd58ad39f	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (44.203.201.11) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 20:07:14.338
c209a0bb-77c6-4316-be1d-ab073e974d42	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (54.209.77.35) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 20:13:44.201
04800d18-3f4f-45de-9cf9-1bf5ef0b01ec	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:29:25.094
0a5f7ce8-1924-41db-912c-66ca728c6878	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:36:07.261
1dc986a7-adfd-46b2-b4ab-efe1f4d6657b	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:41:59.316
4960f39f-c821-49fc-bd70-9dd67f122b6f	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:45:26.815
4eac0c0e-69d0-4cd7-b172-1ae3578ea496	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:46:06.198
305ebca1-49f0-41cf-bfc6-0935ddb000b4	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Market orders without market protection are not allowed via API. Please set market protection or use a Limit order.	error	2026-06-17 20:48:11.575
59c5e527-453d-4ee3-99f3-bf0d098e9efd	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Your order could not be converted to a After Market Order (AMO).	error	2026-06-17 21:01:51.354
94a603f1-8e84-4d8f-b764-dc557ee6cc21	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 21:04:58.59
f4aa2e90-160e-45f2-b69b-c35068eb5de1	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: IP (2405:201:6011:f874:1968:4b6e:d659:3398) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip	error	2026-06-17 21:12:43.318
30babe18-dc8e-422a-a366-e051dd3b6cf5	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.	error	2026-06-17 21:21:36.563
5203d466-3beb-4374-bfc5-8cfd65dad5cc	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Incorrect `api_key` or `access_token`.	error	2026-06-18 03:45:45.229
7e99e852-830a-4a6e-9d84-67248c5ebccf	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-18 19:12:35.991
cdfdec00-963b-4162-babb-9f0f81b92d7d	c7bafa89-3403-44c3-bcd0-199602c878e1	Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.	info	2026-06-16 18:20:03.11
e1c62193-bd8d-4f66-9f61-90353acbc3d0	c7bafa89-3403-44c3-bcd0-199602c878e1	Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.	info	2026-06-16 18:20:10.582
3f77afcb-3964-483a-a9a3-32d79538aade	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 02:19:04.457
12c48757-969a-434f-acea-021e3bbca268	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-16 14:10:57.437
5da24d33-dc1d-4a08-a9b9-8de062b513f6	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 1 shares of VAML at entry price ₹471.11 using config from DB strategy "Pre Open Momentum Breakout". Capital allocated (1%): ₹500.00. Target: ₹478.18 (1.5%), Stop Loss: ₹468.75 (0.5%).	trade	2026-06-16 18:31:47.437
5e1b3e4d-f779-435f-82e5-18c4d2697bc4	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-18 19:13:00.811
7939411b-056c-4843-ac8e-752a6a1ec784	c7bafa89-3403-44c3-bcd0-199602c878e1	Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24).	info	2026-06-19 03:50:43.412
e13d818c-ee07-4ed0-a295-c2c5869ba736	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-19 16:19:08.859
30a009c0-0609-41f6-a52e-dbe70dc53c65	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-19 18:17:21.512
ec6dcb76-db19-4b38-bf7b-3dd3b0a5875a	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-19 20:17:46.863
c8c7ab31-8109-4c93-b026-babc7e924574	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 06:47:11.276
3d169060-38ee-4751-bcb3-085acba50c9d	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 07:01:22.5
98d19fdc-9237-49a4-a0cd-6645cc469314	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script	error	2026-06-22 07:04:23.857
e9f35025-a9fd-4db9-801d-a330ec314b87	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 14:47:13.37
b1a71d09-308a-46e4-a36f-0cf8475aaacf	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 14:47:31.275
555c620c-89f4-4861-a344-c3a949d1f27c	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 14:48:15.991
dc88069c-2ba1-425e-9be8-ac5cc7be7436	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-22 14:48:33.605
0d0f9615-b2ae-43bb-8ca7-aea559e2330f	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-23 07:32:15.475
1276bbd1-b6b7-4ae2-a35e-fe12f99bdfe0	c7bafa89-3403-44c3-bcd0-199602c878e1	Kite order failed for Vikash sharma: Trigger price for stoploss buy orders cannot be above the upper circuit price. Please try placing the order with trigger price below 336.40. [Read more.](https://support.zerodha.com/category/trading-and-markets/margin-leverage-and-product-and-order-types/articles/what-are-stop-loss-orders-and-how-to-use-them)	error	2026-06-23 08:44:07.628
0cabfaa8-baea-40ac-8004-ad0180fb6e60	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-23 08:45:23.335
68662a34-83ec-4921-bf8a-ad2d21191e6d	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-23 08:58:50.389
4a5d342d-4ab3-4cdf-aaa6-4ffe5c0cf122	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-23 09:03:20.232
9c9c9c9b-4b7d-47bc-9434-d8fd5f9fbb29	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-23 09:08:33.191
427ff935-9d5e-4093-945b-1e29a67a76d9	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672769, SL Order: N/A, Target Order: N/A	trade	2026-06-23 09:09:15.314
caf91697-3ab4-46a1-aa21-e76565d4a887	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672869, SL Order: N/A, Target Order: N/A	trade	2026-06-23 09:09:17.07
e67e27e7-7c76-4ff8-8e6f-a2f1810adae2	c7bafa89-3403-44c3-bcd0-199602c878e1	Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.	info	2026-06-21 20:39:30.483
16519ddd-3431-49c9-aa87-c082da7b5ba2	c7bafa89-3403-44c3-bcd0-199602c878e1	Client b364d72f-e2e2-4dbc-bbef-3286c75e1875 assigned to strategy.	info	2026-06-21 20:39:31.551
dd8f9f92-6ca8-489a-8453-8bbd336c4228	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 119 shares of VEDL at entry price ₹294.80 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹353.75. Target: ₹300.69 (2%), Stop Loss: ₹291.85 (1%). Entry Order: 260623171672934, SL Order: N/A, Target Order: N/A	trade	2026-06-23 09:09:17.415
0bc50890-e986-4336-a00c-6d5fcf689967	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:11.25
bc1d1728-aec4-4302-ac3e-cbf6350d7dd8	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:16.387
10a0ad89-33c5-4d8b-8bd7-130855909661	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:16.402
66680a83-bfd7-407e-b498-c4eb466c341f	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:22.083
3be527b2-e2e7-460d-ae06-4ded5f3003b0	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:30.527
46746aca-47ee-4af9-a50f-ddba3beca77b	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:55:49.593
610c4d0d-7f38-4436-b896-3c108db8d5fe	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:02.038
0b1ab2a0-eda9-43f1-846c-d7a87a7cde5a	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:03.651
a7f9a00a-71d3-4d13-ba0a-f595162fbf5b	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:21.399
af880a44-cd06-4f36-8f12-af45dbd997cc	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:26.386
9dce9d5d-d484-406d-b0cb-a34f4a278f3a	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:26.4
66093efa-9bdb-4e07-b209-803e23aef027	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:32.1
019367f2-3bed-458a-9964-9213cda18e90	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:40.456
f4828ede-185e-4e25-946e-80ad578342b7	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:56:59.554
d406ee8b-6bb0-4636-86ff-ec5ebd249587	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:05.04
290402ee-a8c7-49b9-8162-dd987fe6b34a	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:12.88
bdbca56c-8714-4549-8d1b-278ee9c5f7c6	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:21.441
b7c8aa30-7f73-42ed-ab37-a8a405febf78	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:26.629
13efbf5f-8950-417e-8cbd-54f379f1fdf7	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:32.064
cd509e41-5882-480b-a8aa-ab76811d54ab	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:37.357
ce038153-e48d-46c4-9be6-e05a9b49b31f	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:57:59.604
9e5b7591-8080-498f-9960-5c3eda9f9ed2	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:58:21.582
cf684c68-a332-45c5-b6a1-cf2c444a3bd1	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:58:27.623
637b2031-ad55-4749-a045-22221be2cf11	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:58:31.434
3e7b8a15-8f2d-4e7a-be69-8d200d8f7e7d	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:59:09.572
82ea2270-05f4-414a-8581-946803af65b3	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:59:31.551
9bead5c8-1b65-41c0-9aa0-432dd83fc84f	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 09:59:41.217
c70be312-1f7a-478b-a380-18857f2ec60d	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:00:09.585
898aa4e9-2627-435a-9358-72ea0ed9984b	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:00:31.602
2e963c1d-25dd-4b4b-a32f-d9543bf52d57	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:00:51.221
68f9b0af-c2ba-4c8b-a478-10740759c8a4	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:01:09.633
95f45563-fcac-4ca5-a56f-1a5606b1e9a1	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:01:41.588
f43e677a-1276-4c80-82a8-bbe30cefbc21	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:02:01.198
7d863fb9-6953-413a-bc9d-bb159a685a38	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:02:19.599
c9b2a4e7-5e04-4509-bcc4-d6869ce09dba	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:03:11.198
f301572c-ce31-4487-87ba-2d5fe55fc5d7	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:03:29.659
ca1cffe4-6ff7-4d00-9042-5c34ec3bc835	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:02:51.588
c9967113-7cf3-4a2b-8fbf-1916e0dc0f8f	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:03:51.585
a2f17088-1071-4a94-a06e-932ee30d114c	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:04:11.219
d13e7045-ccfc-4cea-aa00-a39c539f2ce0	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:04:29.623
70cf65c4-d724-416b-ac8c-8efcbbb4ef62	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:04:51.614
c84e6e46-ad3b-425f-9068-4b90e0592388	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:05:11.261
4bfc9a9d-4113-426f-b744-f2ddbf49b73f	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:05:39.629
49381307-f181-4650-9e45-97528575ed2a	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:05:52.408
e2faf52b-c669-4f36-99f6-90f3768c5358	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:06:11.598
84a4213d-1e02-40da-8c35-6790dece4655	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:06:39.6
bb617afc-0941-4fa0-8cd0-2d8c5dd1ce07	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:07:01.613
c93a6b8c-d50e-4d65-b7d5-ae22aaa8e566	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:07:21.198
46435496-d4c9-4c23-b35c-3a73034bd785	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:07:39.621
c7bd4535-2542-4cf2-8c28-ebb78bbce582	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:08:17.483
1718a158-632a-4b86-aa26-9eed5c38d316	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:09:26.289
6c0c6f03-a37a-408c-babf-58a9246b0b8b	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:10:36.258
177ec6ce-63b6-42a6-9fef-5d30fe77d008	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:11:46.275
f1b0c3e7-7110-43d7-93d3-74845a422c75	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:12:46.301
cca0d114-d5f8-410e-ae72-f95a1e62d3bc	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:13:46.33
24355323-6c02-4f1a-ace9-41b31b0a6878	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:14:56.999
301871f5-2e02-4e04-9e0b-29f3487f1540	c7bafa89-3403-44c3-bcd0-199602c878e1	Failed to place exit order for Vikash sharma (VEDL): Intraday orders (MIS) are allowed only till 3.25 PM. Try placing a CNC order.	error	2026-06-23 10:16:06.543
c985b98d-f5d5-4a2b-b4ce-3ae501e38604	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 05:00:35.122
023c9484-4fb4-4310-ab7e-751ac2702b80	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 05:25:32.165
170e27c4-2b91-4abe-b750-13c8f3d5ab16	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 05:25:59.396
16f78f1b-67d2-4dbd-a240-5a4f53951ce6	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 05:30:23.959
76cb34dd-d6ad-4f7e-9065-8bb25eefa16f	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 05:49:53.446
5f57d1d3-cd2b-4b5a-9e4b-806ca367ab8a	c7bafa89-3403-44c3-bcd0-199602c878e1	Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).	error	2026-06-24 07:20:42.551
6f16ee84-45e0-41de-a2ab-cd8210549c5f	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-24 07:21:30.556
ac5df839-95ba-44d4-ac2c-6246ca31b038	c7bafa89-3403-44c3-bcd0-199602c878e1	Skipped trade execution for Vikash sharma: Kite session could not be established (auto-login failed or manual login required).	error	2026-06-24 07:31:59.41
bff08933-0d44-4377-b43a-293e26f8f533	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 7 shares of PERSISTENT at entry price ₹4496.50 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹338.75. Target: ₹4586.42 (2%), Stop Loss: ₹4451.53 (1%). Entry Order: 260629170102587, SL Order: N/A, Target Order: N/A	trade	2026-06-29 03:51:15.15
924ebbfb-0326-4aa8-822e-a0b603384c21	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (PERSISTENT): Your order could not be converted to a After Market Order (AMO).. Trade marked FAILED.	error	2026-06-29 17:38:01.332
56e1b5b6-b45f-4106-a4d8-ee77619d7dac	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-06-29 17:50:21.088
f219649f-c241-4ee8-88e5-362fa2300efc	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 4 shares of BHARATFORG at entry price ₹2123.90 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹96.53. Target: ₹2166.40 (2%), Stop Loss: ₹2102.68 (1%). Entry Order: 260630170388561, SL Order: N/A, Target Order: N/A	trade	2026-06-30 04:26:01.584
044b8662-593b-4377-b38c-a620b6f56486	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 4 shares of BHARATFORG at entry price ₹2123.90 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹96.53. Target: ₹2166.40 (2%), Stop Loss: ₹2102.68 (1%). Entry Order: 260630170388597, SL Order: N/A, Target Order: N/A	trade	2026-06-30 04:26:02.104
c5e42a8b-6697-46af-8acd-ca7a465af752	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 4 shares of BHARATFORG at entry price ₹2124.10 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹96.53. Target: ₹2166.40 (2%), Stop Loss: ₹2102.68 (1%). Entry Order: 260630170456026, SL Order: 260630170460212, Target Order: 260630170460213	trade	2026-06-30 04:36:59.846
ae46813b-e4c2-439f-a780-d04c0b686abf	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 4 shares of BHARATFORG at entry price ₹2124.10 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹96.53. Target: ₹2166.40 (2%), Stop Loss: ₹2102.68 (1%). Entry Order: 260630170456082, SL Order: 260630170460259, Target Order: 260630170460261	trade	2026-06-30 04:37:00.238
aa39c7d6-b21d-44d7-aaaf-4579ad06dccb	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (BHARATFORG): Invalid `product`.. Trade marked FAILED.	error	2026-06-30 05:42:00.704
64826a57-16cb-4700-83b9-3e493542f881	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 15 shares of KPITTECH at entry price ₹605.00 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹95.88. Target: ₹617.10 (2%), Stop Loss: ₹598.95 (1%). Entry Order: 260701170105404, SL Order: N/A, Target Order: N/A	trade	2026-07-01 03:51:43.309
02735b8f-d20f-43c0-b991-8170d29b168a	c7bafa89-3403-44c3-bcd0-199602c878e1	Intraday Trade Initiated for Vikash sharma: Bought 9 shares of BAJFINANCE at entry price ₹1012.70 using config from DB strategy "Pre-Open Momentum Breakout". Capital at risk: ₹95.88. Target: ₹1032.97 (2%), Stop Loss: ₹1002.58 (1%). Entry Order: 260702170122871, SL Order: N/A, Target Order: N/A	trade	2026-07-02 03:51:47.201
11e8af20-9f47-43ea-b3be-b0f6e12d1758	c7bafa89-3403-44c3-bcd0-199602c878e1	Trade Closed for Vikash sharma: Sold 9 BAJFINANCE @ ₹1012.80 (Market Close (15:15:00)). P&L: ₹0.00	trade	2026-07-02 09:46:08.941
051f8e53-c0a9-4bdc-afa6-0c22db666fbc	c7bafa89-3403-44c3-bcd0-199602c878e1	Skipped: Calculated quantity is 0 (capitalAtRisk ₹96.32 / slPoints ₹321.17 = 0).	info	2026-07-03 03:50:40.878
c644c7c4-7523-411c-a16e-d41e5f125cd8	c7bafa89-3403-44c3-bcd0-199602c878e1	Strategy configuration updated.	info	2026-07-03 19:49:05.869
cdf35342-81c2-4c87-8742-bc4781356854	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:27:48.523
fbb1efc3-c0ef-4085-8c0d-7e10880baa3a	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:27:48.526
619d3852-dd69-4180-b598-56df20ff1352	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:28:24.029
fd7fb60e-ad66-4e94-adb0-ad338c16c076	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:28:26.255
5f380968-ba1d-4a03-9d04-8615989da756	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:29:39.011
a69e2277-c42b-4fc9-aaaa-640b7d4e9455	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:29:39.037
dba3904a-c2ba-4117-a0ba-992a8176a53e	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:37:17.583
af4eac60-4dd3-4547-8cc5-12b83f756b69	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:37:17.767
a8f3411e-e949-4848-a349-bda516c32eb9	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:37:17.769
85a6ee0d-7181-48d3-88e4-93adfe0a80c8	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:37:19.815
3351158d-6eb6-4208-8d7d-59bafd33aaec	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:38:26.762
a2b888c5-66e1-4ff5-80dd-b3ed9372008b	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-03 20:38:26.784
5207285f-7dfa-43ac-8999-5d465913d167	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:38:27.323
7d5e14c0-52f6-4e72-8ae6-612a8662687a	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): IP (2402:3a80:1f8f:8a6d:f5c0:17ac:4286:768c) is not allowed to place orders for this app. Update allowed IPs on the Kite developer console. Learn more - https://support.zerodha.com/category/trading-and-markets/general-kite/kite-api/articles/static-ip. Trade marked FAILED.	error	2026-07-03 20:38:27.34
1593c0fc-7faf-4342-820b-848c8be6e1fe	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (TCS): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-04 09:46:06.967
2755146a-ff31-49e2-9d65-3514e4dd5904	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (HDFCBANK): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-04 09:46:06.966
ba527fd6-529c-4db1-b6fe-8ac1ab05fb58	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (RELIANCE): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-04 09:46:06.968
d5a502c6-70ab-437d-b116-46e24c2b4e51	c7bafa89-3403-44c3-bcd0-199602c878e1	Exit failed for Vikash sharma (HDFCBANK): MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.. Trade marked FAILED.	error	2026-07-04 09:46:07.945
4b324ed8-10dd-4f31-b4f0-c8de5a018c3a	c7bafa89-3403-44c3-bcd0-199602c878e1	Skipped: Calculated quantity is 0 (capitalAtRisk ₹0.00 / slPoints ₹3.83 = 0).	info	2026-07-06 04:42:35.491
\.


--
-- TOC entry 3583 (class 0 OID 81969)
-- Dependencies: 232
-- Data for Name: strategy_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.strategy_templates (id, name, description, config_json, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3575 (class 0 OID 16609)
-- Dependencies: 224
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, price, duration_days, features, status, created_at, updated_at, product_type_id) FROM stdin;
73a18efe-9128-49dc-b658-6147133698b9	Algo Monthly Plan	4999.00	30	["Pre-Open Momentum Strategy","1% Capital Risk Guard","Zerodha Kite API Integration","Live Performance Dashboard","Email Support (48hr SLA)"]	active	2026-06-21 18:54:24.941	2026-06-24 17:57:55.854	prod-algo
5520ea32-3f93-4577-8e9a-8e77d0a72ffa	Algo Quarterly Plan	12999.00	90	["Everything in Monthly","Telegram Trade Alerts","Priority API Setup Assistance","1:3 Risk-Reward Configuration","Priority Support (12hr SLA)"]	active	2026-06-21 18:54:25.434	2026-06-24 17:57:56.102	prod-algo
bdf048df-ef68-4118-a9df-90b5eb974b8a	Algo Yearly Plan	39999.00	365	["Everything in Quarterly","Dedicated Account Manager","Custom Strategy Parameters","Emergency Kill Switch Access","24/7 Phone Support"]	active	2026-06-21 18:54:25.921	2026-06-24 17:57:56.351	prod-algo
867bcedb-6cfa-4f6c-b08b-283f1d8087e5	Scanner Monthly Plan	1999.00	30	["Live Momentum Scanners","Multi-Indicator Alerts","Custom Watchlist Scans","Email Support (48hr SLA)"]	active	2026-06-21 18:54:26.402	2026-06-24 17:57:56.602	prod-scanner
6e547451-dcb7-4abe-ad50-320d7a09978b	Scanner Quarterly Plan	4999.00	90	["Everything in Monthly","Telegram Alert Webhooks","Unlimited Scans Per Day","Priority Support (12hr SLA)"]	active	2026-06-21 18:54:26.899	2026-06-24 17:57:56.849	prod-scanner
bac29e96-8de1-4d0b-8e80-7e3f750d8b1d	Scanner Yearly Plan	14999.00	365	["Everything in Quarterly","Custom Scanner Python API","24/7 Phone Support"]	active	2026-06-21 18:54:27.388	2026-06-24 17:57:57.098	prod-scanner
\.


--
-- TOC entry 3576 (class 0 OID 16625)
-- Dependencies: 225
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, plan_id, start_date, end_date, status, created_at, updated_at) FROM stdin;
c3f8dbc4-b90b-49c3-99da-ab6a2bd1c5a4	846d4c97-be94-4a06-a72c-c048daf71e3c	73a18efe-9128-49dc-b658-6147133698b9	2026-06-21 23:11:06.603	2026-07-21 23:11:06.603	active	2026-06-21 23:11:06.606	2026-06-24 17:58:05.543
\.


--
-- TOC entry 3580 (class 0 OID 16685)
-- Dependencies: 229
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, user_id, subject, message, category, status, reply, created_at, updated_at) FROM stdin;
514dff3f-be17-4fec-9b32-b288988fb105	846d4c97-be94-4a06-a72c-c048daf71e3c	hfkh	dfaldhf	General	resolved	\N	2026-06-21 22:34:49.707	2026-06-24 17:58:06.049
\.


--
-- TOC entry 3574 (class 0 OID 16591)
-- Dependencies: 223
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trades (id, client_id, strategy_id, symbol, order_type, entry_price, exit_price, quantity, stop_loss, target, pnl, status, entry_time, exit_time, created_at, updated_at, kite_response, entry_order_id, exit_reason, sl_order_id, sl_trigger_price, target_order_id, original_entry_price, original_stop_loss, original_target, entry_order_status, sl_order_status, target_order_status, sl_kite_response, target_kite_response, direction, dual_leg_group_id, leg_name, leg_timeframe) FROM stdin;
4668adcc-92c7-4efb-80b4-b79c1c16c2ab	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	IRFC	MIS	143.29	\N	0	\N	\N	\N	FAILED	2026-06-24 07:31:59.083	\N	2026-06-24 07:31:59.092	2026-06-24 07:31:59.092	{"message": "Skipped: Kite session could not be established (auto-login failed or manual login required)."}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
61f91710-6cb2-4856-9799-0e0733f1fd5d	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	INFY	MIS	1142.90	\N	87	1137.19	1160.04	\N	FAILED	2026-06-18 03:45:44.954	\N	2026-06-18 03:45:44.966	2026-06-24 17:58:16.445	{"data": null, "status": "error", "message": "Incorrect `api_key` or `access_token`.", "error_type": "TokenException"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0e8b0e14-0687-4612-bc70-8c2b2f28e5df	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	MPHASIS	MIS	3040.24	\N	0	\N	\N	\N	FAILED	2026-06-19 03:50:43.15	\N	2026-06-19 03:50:43.154	2026-06-24 17:58:16.695	{"message": "Skipped: Calculated quantity is 0 (Allocated amount ₹854.90 is less than entry price ₹3040.24)."}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c6d9cc9b-fecf-4c8d-97bc-cfaec2224daf	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	CUMMINSIND	MIS	5769.76	\N	6	5712.07	5885.16	\N	FAILED	2026-06-22 07:04:23.542	\N	2026-06-22 07:04:23.546	2026-06-22 07:04:23.546	{"data": null, "status": "error", "message": "Tick size for this script is 0.50. Kindly enter trigger price in the multiple of tick size for this script", "error_type": "InputException"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ebd6e813-126d-4451-8c7a-95a018b3dcad	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	TATASTEEL	MIS	198.00	\N	7	197.01	200.97	\N	FAILED	2026-06-17 21:21:36.316	\N	2026-06-17 21:21:36.319	2026-06-24 17:58:16.945	{"data": null, "status": "error", "message": "Our order management system is under scheduled maintenance. Try placing your AMO order after 5.30 AM.", "error_type": "InputException"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f95d49c8-1912-435f-997d-9eeab8c1714e	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	VEDL	MIS	294.80	\N	119	291.85	300.70	\N	FAILED	2026-06-23 09:09:15.069	2026-06-23 10:35:40.393	2026-06-23 09:09:15.072	2026-06-23 09:09:15.072	{"note": "Market close exit rejected by Kite"}	260623171672769	Exit failed: MIS not allowed after 3:20 PM	\N	291.85	\N	294.79	291.85	300.69	\N	\N	\N	\N	\N	\N	\N	\N	\N
997a08f8-123b-4ca9-9d88-5e954d1ed054	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	KPITTECH	MIS	605.00	\N	15	598.95	617.10	\N	FAILED	2026-07-01 03:51:43.062	\N	2026-07-01 03:50:40.99	2026-07-01 15:15:00.822	{"data": {"order_id": "260701170105404"}, "status": "success"}	260701170105404	\N	\N	598.95	\N	605.00	598.95	617.10	CANCELLED	\N	\N	\N	\N	\N	\N	\N	\N
955f3f5d-d7c8-47f2-a496-023c204898f8	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	POWERINDIA	MIS	32117.09	\N	0	\N	\N	\N	FAILED	2026-07-03 03:50:40.622	\N	2026-07-03 03:50:40.625	2026-07-03 03:50:40.625	{"message": "Skipped: Calculated quantity is 0 (capitalAtRisk ₹96.32 / slPoints ₹321.17 = 0)."}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
da033718-fbdc-41bc-ade4-a00e67fe2240	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	HINDZINC	SL-M	531.65	\N	66	526.33	542.28	\N	FAILED	2026-06-25 03:50:00	\N	2026-06-25 05:04:26.906	2026-06-29 05:24:18.805	{"error": "Order cancelled on Zerodha (manually updated)"}	260625170115615	CANCELLED manually	\N	\N	\N	531.65	526.33	542.28	\N	\N	\N	\N	\N	\N	\N	\N	\N
a1b3763d-23e5-4640-8213-7568416fa570	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	BAJFINANCE	MIS	1012.80	1012.80	9	1002.60	1033.00	0.00	closed	2026-07-02 03:51:46.946	2026-07-02 09:46:08.653	2026-07-02 03:50:45.385	2026-07-02 09:46:08.684	{"data": {"order_id": "260702171630764"}, "status": "success"}	260702170122871	Market Close (15:15:00)	260702170286265	1002.60	260702170286296	1012.71	1002.58	1032.97	COMPLETE	TRIGGER PENDING	OPEN	{"data": {"order_id": "260702170286265"}, "status": "success"}	{"data": {"order_id": "260702170286296"}, "status": "success"}	\N	\N	\N	\N
8b3cea71-f549-45d2-8bbf-323a7c1034b3	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	PERSISTENT	MIS	4497.00	\N	7	4451.50	4586.50	\N	FAILED	2026-06-29 03:51:14.956	2026-06-29 17:38:01.076	2026-06-29 03:50:13.659	2026-06-29 17:38:01.079	{"data": {"hints": ["switch_to_amo"]}, "status": "error", "message": "Your order could not be converted to a After Market Order (AMO).", "error_type": "InputException"}	260629170102587	Exit failed: Your order could not be converted to a After Market Order (AMO).	REJECTED	4451.50	260629170624955	4496.49	4451.53	4586.42	COMPLETE	REJECTED	CANCELLED	\N	\N	\N	\N	\N	\N
805ed493-ed8e-4e0e-af8e-379b09848d34	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	BHARATFORG	SL-Market	2124.10	2102.70	4	2102.70	2166.40	-85.60	sl_hit	2026-06-30 04:36:58	2026-06-30 05:42:00.45	2026-06-30 04:44:24.193	2026-07-01 14:47:36.804	{"data": null, "status": "error", "message": "Invalid `product`.", "error_type": "InputException"}	260630170456082	SL Hit	260630170460259	2102.90	260630170460261	\N	2102.86	2166.40	COMPLETE	COMPLETE	CANCELLED	{"data": null, "status": "error", "message": "Invalid `product`.", "error_type": "InputException"}	{"data": null, "status": "error", "message": "Invalid `product`.", "error_type": "InputException"}	\N	\N	\N	\N
demo-l2-cancelled	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	RELIANCE	MARKET	2848.00	\N	75	2862.50	2810.00	\N	cancelled	2026-07-04 04:00:00	\N	2026-07-03 20:55:48.295	2026-07-03 20:55:48.295	\N	KITE-ENTRY-L2-001	\N	\N	\N	\N	\N	\N	\N	cancelled	cancelled	cancelled	\N	\N	SHORT	demo-oco-001	Leg 2	15min
demo-l1-cancelled	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	TCS	MARKET	3950.00	\N	50	3930.00	4010.00	\N	cancelled	2026-07-04 03:50:30	\N	2026-07-03 20:55:49.263	2026-07-03 20:55:49.263	\N	KITE-ENTRY-L1-002	\N	\N	\N	\N	\N	\N	\N	cancelled	cancelled	cancelled	\N	\N	LONG	demo-oco-002	Leg 1	5min
demo-l2-filled	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	TCS	MARKET	3945.50	\N	50	3965.00	3900.00	\N	FAILED	2026-07-04 04:00:00	2026-07-04 09:46:06.71	2026-07-03 20:55:49.263	2026-07-04 09:46:06.71	{"data": null, "status": "error", "message": "MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.", "error_type": "InputException"}	KITE-ENTRY-L2-002	Exit failed: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	\N	3965.00	\N	\N	\N	\N	filled	pending	pending	\N	\N	SHORT	demo-oco-002	Leg 2	15min
demo-l1-pending	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	HDFCBANK	MARKET	1680.00	\N	100	1665.00	1710.00	\N	FAILED	2026-07-04 03:50:30	2026-07-04 09:46:06.7	2026-07-03 20:55:50.234	2026-07-04 09:46:06.708	{"data": null, "status": "error", "message": "MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.", "error_type": "InputException"}	KITE-ENTRY-L1-003	Exit failed: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	\N	\N	\N	\N	\N	\N	pending	pending	pending	\N	\N	LONG	demo-oco-003	Leg 1	5min
demo-l1-filled	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	RELIANCE	MARKET	2850.50	\N	75	2835.25	2890.75	\N	FAILED	2026-07-04 03:50:30	2026-07-04 09:46:06.711	2026-07-03 20:55:48.295	2026-07-04 09:46:06.711	{"data": null, "status": "error", "message": "MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.", "error_type": "InputException"}	KITE-ENTRY-L1-001	Exit failed: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	\N	\N	\N	\N	\N	\N	filled	pending	pending	\N	\N	LONG	demo-oco-001	Leg 1	5min
demo-l2-pending	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	HDFCBANK	MARKET	1678.00	\N	100	1693.00	1650.00	\N	FAILED	2026-07-04 04:00:00	2026-07-04 09:46:06.714	2026-07-03 20:55:50.234	2026-07-04 09:46:06.714	{"data": null, "status": "error", "message": "MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.", "error_type": "InputException"}	KITE-ENTRY-L2-003	Exit failed: MIS (intraday) are blocked as the markets are not open for trading today. Try placing an AMO order.	\N	\N	\N	\N	\N	\N	pending	pending	pending	\N	\N	SHORT	demo-oco-003	Leg 2	15min
317d1f0b-fe6b-41ef-83e0-6441acc2abbe	b364d72f-e2e2-4dbc-bbef-3286c75e1875	c7bafa89-3403-44c3-bcd0-199602c878e1	KOTAKBANK	MIS	383.12	\N	0	\N	\N	\N	FAILED	2026-07-06 04:42:35.228	\N	2026-07-06 04:42:35.232	2026-07-06 04:42:35.232	{"message": "Skipped: Calculated quantity is 0 (capitalAtRisk ₹0.00 / slPoints ₹3.83 = 0)."}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3571 (class 0 OID 16539)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, mobile, user_id, password, role, status, created_at, updated_at) FROM stdin;
846d4c97-be94-4a06-a72c-c048daf71e3c	Vikash sharma	vikash@gmail.com	\N	vikashsharma162	grw_QyWf8D2n	client	active	2026-06-13 07:58:14.195	2026-07-03 19:31:47.131
dd7cb114-8fd4-457c-a963-9318188a1e8e	Firoz Mohammad	firoz@gmail.com	\N	firoz	123	admin	active	2026-06-13 13:57:11.047	2026-07-03 19:31:47.517
\.


--
-- TOC entry 3368 (class 2606 OID 16536)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3387 (class 2606 OID 16672)
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3390 (class 2606 OID 16684)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3374 (class 2606 OID 16576)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- TOC entry 3385 (class 2606 OID 16657)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3405 (class 2606 OID 196619)
-- Name: product_types product_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_types
    ADD CONSTRAINT product_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3377 (class 2606 OID 16590)
-- Name: strategies strategies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategies
    ADD CONSTRAINT strategies_pkey PRIMARY KEY (id);


--
-- TOC entry 3396 (class 2606 OID 81968)
-- Name: strategy_assignments strategy_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_assignments
    ADD CONSTRAINT strategy_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3402 (class 2606 OID 82013)
-- Name: strategy_backtests strategy_backtests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_backtests
    ADD CONSTRAINT strategy_backtests_pkey PRIMARY KEY (id);


--
-- TOC entry 3394 (class 2606 OID 81953)
-- Name: strategy_conditions strategy_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_conditions
    ADD CONSTRAINT strategy_conditions_pkey PRIMARY KEY (id);


--
-- TOC entry 3400 (class 2606 OID 81995)
-- Name: strategy_logs strategy_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_logs
    ADD CONSTRAINT strategy_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3398 (class 2606 OID 81981)
-- Name: strategy_templates strategy_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_templates
    ADD CONSTRAINT strategy_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3381 (class 2606 OID 16624)
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 3383 (class 2606 OID 16641)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3392 (class 2606 OID 16701)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 3379 (class 2606 OID 16608)
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- TOC entry 3371 (class 2606 OID 16557)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3388 (class 1259 OID 16705)
-- Name: app_settings_setting_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX app_settings_setting_key_key ON public.app_settings USING btree (setting_key);


--
-- TOC entry 3375 (class 1259 OID 16704)
-- Name: clients_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_user_id_key ON public.clients USING btree (user_id);


--
-- TOC entry 3403 (class 1259 OID 196620)
-- Name: product_types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX product_types_name_key ON public.product_types USING btree (name);


--
-- TOC entry 3369 (class 1259 OID 16702)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3372 (class 1259 OID 16703)
-- Name: users_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_user_id_key ON public.users USING btree (user_id);


--
-- TOC entry 3416 (class 2606 OID 16746)
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3406 (class 2606 OID 196626)
-- Name: clients clients_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3407 (class 2606 OID 16711)
-- Name: clients clients_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3408 (class 2606 OID 16706)
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3414 (class 2606 OID 16741)
-- Name: payments payments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3415 (class 2606 OID 16736)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3419 (class 2606 OID 82019)
-- Name: strategy_assignments strategy_assignments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_assignments
    ADD CONSTRAINT strategy_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3420 (class 2606 OID 82024)
-- Name: strategy_assignments strategy_assignments_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_assignments
    ADD CONSTRAINT strategy_assignments_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3422 (class 2606 OID 82034)
-- Name: strategy_backtests strategy_backtests_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_backtests
    ADD CONSTRAINT strategy_backtests_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3418 (class 2606 OID 82014)
-- Name: strategy_conditions strategy_conditions_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_conditions
    ADD CONSTRAINT strategy_conditions_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3421 (class 2606 OID 82029)
-- Name: strategy_logs strategy_logs_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.strategy_logs
    ADD CONSTRAINT strategy_logs_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3411 (class 2606 OID 196621)
-- Name: subscription_plans subscription_plans_product_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_product_type_id_fkey FOREIGN KEY (product_type_id) REFERENCES public.product_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3412 (class 2606 OID 16731)
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3413 (class 2606 OID 16726)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3417 (class 2606 OID 16751)
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3409 (class 2606 OID 16716)
-- Name: trades trades_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3410 (class 2606 OID 16721)
-- Name: trades trades_strategy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_strategy_id_fkey FOREIGN KEY (strategy_id) REFERENCES public.strategies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-07-07 07:44:27 IST

--
-- PostgreSQL database dump complete
--

\unrestrict VkXzTyjJgLC0U5uaCELZw8OPqSrMVst7dH34GhHvT45VtfPCO1aRPvQUdCmXbWa

