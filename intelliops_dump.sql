--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Name: api_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_logs (
    id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    log_type character varying(50) NOT NULL,
    provider character varying(50) NOT NULL,
    session_id character varying(255),
    endpoint character varying(255),
    request_data json,
    response_data json,
    status_code integer,
    duration_ms integer,
    error_message text
);


ALTER TABLE public.api_logs OWNER TO postgres;

--
-- Name: api_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.api_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_logs_id_seq OWNER TO postgres;

--
-- Name: api_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.api_logs_id_seq OWNED BY public.api_logs.id;


--
-- Name: aws_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aws_settings (
    id integer NOT NULL,
    agent_id character varying(50) NOT NULL,
    agent_alias_id character varying(50) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.aws_settings OWNER TO postgres;

--
-- Name: aws_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aws_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aws_settings_id_seq OWNER TO postgres;

--
-- Name: aws_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aws_settings_id_seq OWNED BY public.aws_settings.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    thread_id integer,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_threads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_threads (
    id integer NOT NULL,
    user_id integer,
    title character varying(255),
    cloud_provider character varying(32),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_threads OWNER TO postgres;

--
-- Name: chat_threads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_threads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_threads_id_seq OWNER TO postgres;

--
-- Name: chat_threads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_threads_id_seq OWNED BY public.chat_threads.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    user_id integer,
    filename character varying(255) NOT NULL,
    url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: favorite_prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorite_prompts (
    id integer NOT NULL,
    user_id integer,
    prompt_id character varying(64),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.favorite_prompts OWNER TO postgres;

--
-- Name: favorite_prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.favorite_prompts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.favorite_prompts_id_seq OWNER TO postgres;

--
-- Name: favorite_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.favorite_prompts_id_seq OWNED BY public.favorite_prompts.id;


--
-- Name: gcp_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gcp_settings (
    id integer NOT NULL,
    session_endpoint character varying(255) NOT NULL,
    agent_run_endpoint character varying(255) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gcp_settings OWNER TO postgres;

--
-- Name: gcp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gcp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gcp_settings_id_seq OWNER TO postgres;

--
-- Name: gcp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gcp_settings_id_seq OWNED BY public.gcp_settings.id;


--
-- Name: navigation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.navigation_items (
    id character varying(50) NOT NULL,
    title character varying(100) NOT NULL,
    path character varying(255) NOT NULL,
    tooltip character varying(255),
    "position" character varying(20) NOT NULL,
    "order" integer NOT NULL,
    is_enabled boolean,
    required_role character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.navigation_items OWNER TO postgres;

--
-- Name: prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompts (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100),
    command text NOT NULL,
    cloud_provider character varying(32),
    user_id integer,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.prompts OWNER TO postgres;

--
-- Name: provider_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_access (
    id integer NOT NULL,
    user_id integer,
    provider character varying(32) NOT NULL,
    has_access boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.provider_access OWNER TO postgres;

--
-- Name: provider_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provider_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provider_access_id_seq OWNER TO postgres;

--
-- Name: provider_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provider_access_id_seq OWNED BY public.provider_access.id;


--
-- Name: provider_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provider_configs (
    id integer NOT NULL,
    user_id integer,
    provider character varying(32) NOT NULL,
    config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.provider_configs OWNER TO postgres;

--
-- Name: provider_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provider_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provider_configs_id_seq OWNER TO postgres;

--
-- Name: provider_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provider_configs_id_seq OWNED BY public.provider_configs.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer,
    permission character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: user_navigation_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_navigation_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    nav_item_id character varying(50) NOT NULL,
    is_enabled boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_navigation_permissions OWNER TO postgres;

--
-- Name: user_navigation_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_navigation_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_navigation_permissions_id_seq OWNER TO postgres;

--
-- Name: user_navigation_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_navigation_permissions_id_seq OWNED BY public.user_navigation_permissions.id;


--
-- Name: user_role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role_permissions (
    id integer NOT NULL,
    user_id integer,
    permission character varying(100) NOT NULL,
    granted boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_role_permissions OWNER TO postgres;

--
-- Name: user_role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_role_permissions_id_seq OWNER TO postgres;

--
-- Name: user_role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_role_permissions_id_seq OWNED BY public.user_role_permissions.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer,
    role_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    hashed_password character varying(128) NOT NULL,
    is_admin boolean DEFAULT false,
    is_authenticated boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: api_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_logs ALTER COLUMN id SET DEFAULT nextval('public.api_logs_id_seq'::regclass);


--
-- Name: aws_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aws_settings ALTER COLUMN id SET DEFAULT nextval('public.aws_settings_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_threads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_threads ALTER COLUMN id SET DEFAULT nextval('public.chat_threads_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: favorite_prompts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_prompts ALTER COLUMN id SET DEFAULT nextval('public.favorite_prompts_id_seq'::regclass);


--
-- Name: gcp_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gcp_settings ALTER COLUMN id SET DEFAULT nextval('public.gcp_settings_id_seq'::regclass);


--
-- Name: provider_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_access ALTER COLUMN id SET DEFAULT nextval('public.provider_access_id_seq'::regclass);


--
-- Name: provider_configs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_configs ALTER COLUMN id SET DEFAULT nextval('public.provider_configs_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: user_navigation_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_navigation_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_navigation_permissions_id_seq'::regclass);


--
-- Name: user_role_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_role_permissions_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: api_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_logs (id, "timestamp", log_type, provider, session_id, endpoint, request_data, response_data, status_code, duration_ms, error_message) FROM stdin;
1	2025-04-25 06:13:46.925813+00	info	test	test-session	/api/logs/test	{"test": true}	{"success": true}	200	0	\N
2	2025-04-25 06:25:23.439213+00	request	gcp	bf2f5f58-39c9-49f2-a02e-24ec7a2de930	http://34.58.224.198:8000/sessions/bf2f5f58-39c9-49f2-a02e-24ec7a2de930	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/bf2f5f58-39c9-49f2-a02e-24ec7a2de930"}	\N	\N	\N	\N
3	2025-04-25 06:25:23.501759+00	error	gcp	bf2f5f58-39c9-49f2-a02e-24ec7a2de930	http://34.58.224.198:8000/sessions/bf2f5f58-39c9-49f2-a02e-24ec7a2de930	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
4	2025-04-25 06:25:26.03401+00	request	gcp	bf2f5f58-39c9-49f2-a02e-24ec7a2de930	http://34.58.224.198:8000/agent/run	{"session_id": "bf2f5f58-39c9-49f2-a02e-24ec7a2de930", "new_message": {"role": "user", "parts": [{"text": "Hi"}]}}	\N	\N	\N	\N
5	2025-04-25 06:25:26.040628+00	error	gcp	bf2f5f58-39c9-49f2-a02e-24ec7a2de930	http://34.58.224.198:8000/agent/run	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
6	2025-04-25 07:13:55.695523+00	request	gcp	95220342-a521-4834-ab7e-1c57e68d7059	http://34.58.224.198:8000/sessions/95220342-a521-4834-ab7e-1c57e68d7059	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/95220342-a521-4834-ab7e-1c57e68d7059"}	\N	\N	\N	\N
7	2025-04-25 07:13:55.711016+00	response	gcp	95220342-a521-4834-ab7e-1c57e68d7059	http://34.58.224.198:8000/sessions/95220342-a521-4834-ab7e-1c57e68d7059	\N	{"id": "95220342-a521-4834-ab7e-1c57e68d7059", "state": {}, "events": [], "last_update_time": 1745565236.174626}	200	390	\N
8	2025-04-25 07:13:56.141549+00	request	gcp	95220342-a521-4834-ab7e-1c57e68d7059	http://34.58.224.198:8000/agent/run	{"session_id": "95220342-a521-4834-ab7e-1c57e68d7059", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
9	2025-04-25 07:13:56.150095+00	response	gcp	95220342-a521-4834-ab7e-1c57e68d7059	http://34.58.224.198:8000/agent/run	\N	[{"invocation_id": "4ra9Qkla", "author": "root_agent", "content": {"parts": [{"text": "Hi there! How can I help you with your Google Cloud resources today?"}], "role": "model"}, "actions": {}, "id": "q4ATQaM6", "timestamp": 1745565238.826108}]	200	2629	\N
10	2025-04-25 07:14:17.924719+00	request	aws	95220342-a521-4834-ab7e-1c57e68d7059	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "hi"}	\N	\N	\N	\N
11	2025-04-25 07:14:18.127967+00	error	aws	95220342-a521-4834-ab7e-1c57e68d7059	bedrock-agent-runtime.invoke_agent	\N	\N	500	\N	Error invoking AWS Bedrock agent: 'EventStream' object is not subscriptable
12	2025-04-25 07:18:57.565647+00	request	aws	1390f550-ec52-4b0a-8c67-d4e0aa799040	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "Hi"}	\N	\N	\N	\N
13	2025-04-25 07:18:57.707029+00	error	aws	1390f550-ec52-4b0a-8c67-d4e0aa799040	bedrock-agent-runtime.invoke_agent	\N	\N	500	\N	Error invoking AWS Bedrock agent: 'EventStream' object is not subscriptable
14	2025-04-25 07:22:51.718845+00	request	aws	8ddabfdc-0748-4deb-908a-93534473c3cf	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "hi"}	\N	\N	\N	\N
15	2025-04-25 07:22:51.946691+00	error	aws	8ddabfdc-0748-4deb-908a-93534473c3cf	bedrock-agent-runtime.invoke_agent	\N	\N	500	\N	Error invoking AWS Bedrock agent: 'EventStream' object is not subscriptable
16	2025-04-25 07:25:46.666388+00	request	aws	8205a133-8666-4cf3-b2a4-8e70ad81f18d	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "Hi"}	\N	\N	\N	\N
17	2025-04-25 07:25:46.831986+00	error	aws	8205a133-8666-4cf3-b2a4-8e70ad81f18d	bedrock-agent-runtime.invoke_agent	\N	\N	500	\N	Error invoking AWS Bedrock agent: 'EventStream' object is not subscriptable
18	2025-04-25 07:26:18.035901+00	request	aws	c443e0a7-2f72-43ec-aab3-1d7da9989077	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "Hi"}	\N	\N	\N	\N
19	2025-04-25 07:26:18.075196+00	error	aws	c443e0a7-2f72-43ec-aab3-1d7da9989077	bedrock-agent-runtime.invoke_agent	\N	\N	500	\N	Error invoking AWS Bedrock agent: 'EventStream' object is not subscriptable
20	2025-04-25 07:30:26.647996+00	request	aws	7e272b66-6dce-4337-8f26-da27d3929ddb	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "Hi"}	\N	\N	\N	\N
21	2025-04-25 07:30:26.846106+00	response	aws	7e272b66-6dce-4337-8f26-da27d3929ddb	bedrock-agent-runtime.invoke_agent	\N	{"completion": "Hello! Welcome to the AWS resource management assistant. I'm here to help you with various tasks related to AWS resources, infrastructure management, and more. How can I assist you today? Feel free to ask about creating, modifying, or managing AWS resources, installing software, patching systems, or any other AWS-related queries you might have.", "trace": ""}	200	353	\N
22	2025-04-25 07:32:47.549365+00	request	gcp	4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	http://34.58.224.198:8000/sessions/4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/4e0cb6ad-09db-4343-b68c-63eaa49aeeb7"}	\N	\N	\N	\N
23	2025-04-25 07:32:47.591674+00	response	gcp	4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	http://34.58.224.198:8000/sessions/4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	\N	{"id": "4e0cb6ad-09db-4343-b68c-63eaa49aeeb7", "state": {}, "events": [], "last_update_time": 1745566368.024155}	200	395	\N
24	2025-04-25 07:32:47.992604+00	request	gcp	4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	http://34.58.224.198:8000/agent/run	{"session_id": "4e0cb6ad-09db-4343-b68c-63eaa49aeeb7", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
25	2025-04-25 07:32:47.994992+00	response	gcp	4e0cb6ad-09db-4343-b68c-63eaa49aeeb7	http://34.58.224.198:8000/agent/run	\N	[{"invocation_id": "rqyY9B6F", "author": "root_agent", "content": {"parts": [{"text": "Hi! How can I help you today? I can assist with DevOps, monitoring, and security tasks on GCP."}], "role": "model"}, "actions": {}, "id": "HDtwOzTz", "timestamp": 1745566370.785688}]	200	2753	\N
26	2025-04-25 07:37:05.603669+00	request	gcp	148c83bc-5f64-4754-8989-3e67221bae13	http://34.58.224.198:8000/sessions/148c83bc-5f64-4754-8989-3e67221bae13	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/148c83bc-5f64-4754-8989-3e67221bae13"}	\N	\N	\N	\N
27	2025-04-25 07:37:05.610939+00	error	gcp	148c83bc-5f64-4754-8989-3e67221bae13	http://34.58.224.198:8000/sessions/148c83bc-5f64-4754-8989-3e67221bae13	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
28	2025-04-25 07:37:08.186681+00	request	gcp	148c83bc-5f64-4754-8989-3e67221bae13	http://34.58.224.198:8000/agent/run	{"session_id": "148c83bc-5f64-4754-8989-3e67221bae13", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
29	2025-04-25 07:37:08.189117+00	error	gcp	148c83bc-5f64-4754-8989-3e67221bae13	http://34.58.224.198:8000/agent/run	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
30	2025-04-25 07:37:44.86933+00	request	aws	c272198c-b766-4123-a8ad-1875c3a88114	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "Hi"}	\N	\N	\N	\N
54	2025-04-25 09:13:55.538169+00	request	gcp	07d8b005-1d67-4162-81f5-6c2bc2542f78	http://34.58.224.198:8000/agent/run	{"session_id": "07d8b005-1d67-4162-81f5-6c2bc2542f78", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
31	2025-04-25 07:37:45.001541+00	response	aws	c272198c-b766-4123-a8ad-1875c3a88114	bedrock-agent-runtime.invoke_agent	\N	{"completion": "Hello! Welcome to the AWS resource management assistant. I'm here to help you with various tasks related to AWS resources, infrastructure management, and more. How can I assist you today? Feel free to ask about creating, modifying, or managing AWS resources, installing software, patching systems, or any other AWS-related tasks you need help with.", "trace": ""}	200	335	\N
32	2025-04-25 07:41:25.111618+00	request	aws	be4a18dc-23c5-4915-877a-e9c8fd67b189	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "hi"}	\N	\N	\N	\N
33	2025-04-25 07:41:25.332334+00	response	aws	be4a18dc-23c5-4915-877a-e9c8fd67b189	bedrock-agent-runtime.invoke_agent	\N	{"completion": "Hello! Welcome to the AWS resource management assistant. I'm here to help you with various tasks related to AWS resources, infrastructure management, and more. How can I assist you today? Feel free to ask about creating, modifying, or managing AWS resources, installing software, patching systems, or any other AWS-related tasks you need help with.", "trace": ""}	200	310	\N
34	2025-04-25 07:41:46.486412+00	request	gcp	aca20c6e-7e9e-464b-99ce-6108e8126726	http://34.58.224.198:8000/sessions/aca20c6e-7e9e-464b-99ce-6108e8126726	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/aca20c6e-7e9e-464b-99ce-6108e8126726"}	\N	\N	\N	\N
35	2025-04-25 07:41:46.549208+00	error	gcp	aca20c6e-7e9e-464b-99ce-6108e8126726	http://34.58.224.198:8000/sessions/aca20c6e-7e9e-464b-99ce-6108e8126726	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
36	2025-04-25 07:41:49.066738+00	request	gcp	aca20c6e-7e9e-464b-99ce-6108e8126726	http://34.58.224.198:8000/agent/run	{"session_id": "aca20c6e-7e9e-464b-99ce-6108e8126726", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
37	2025-04-25 07:41:49.069189+00	error	gcp	aca20c6e-7e9e-464b-99ce-6108e8126726	http://34.58.224.198:8000/agent/run	\N	\N	\N	\N	[WinError 10061] No connection could be made because the target machine actively refused it
38	2025-04-25 07:47:45.57742+00	request	aws	9fa234b3-0ca8-4b5a-9558-364044e5181e	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "hi"}	\N	\N	\N	\N
39	2025-04-25 07:47:45.821904+00	response	aws	9fa234b3-0ca8-4b5a-9558-364044e5181e	bedrock-agent-runtime.invoke_agent	\N	{"completion": "Hello! Welcome to the AWS resource management assistant. I'm here to help you with various tasks related to AWS resources, infrastructure management, and more. How can I assist you today? Feel free to ask about creating, modifying, or managing AWS resources, installing software, patching systems, or any other AWS-related tasks you need help with.", "trace": ""}	200	425	\N
40	2025-04-25 07:48:01.826078+00	request	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/sessions/34ad38fd-f708-4b82-a9f1-35913545a231	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/34ad38fd-f708-4b82-a9f1-35913545a231"}	\N	\N	\N	\N
41	2025-04-25 07:48:01.867583+00	response	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/sessions/34ad38fd-f708-4b82-a9f1-35913545a231	\N	{"id": "34ad38fd-f708-4b82-a9f1-35913545a231", "state": {}, "events": [], "last_update_time": 1745567282.2908452}	200	388	\N
42	2025-04-25 07:48:02.259328+00	request	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	{"session_id": "34ad38fd-f708-4b82-a9f1-35913545a231", "new_message": {"role": "user", "parts": [{"text": "hi"}]}}	\N	\N	\N	\N
43	2025-04-25 07:48:02.264315+00	response	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	\N	[{"invocation_id": "Z3VGlOsd", "author": "root_agent", "content": {"parts": [{"text": "Hi there! How can I help you with your cloud infrastructure tasks today?"}], "role": "model"}, "actions": {}, "id": "PUtaOINK", "timestamp": 1745567287.299317}]	200	4997	\N
44	2025-04-25 07:48:15.198901+00	request	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	{"session_id": "34ad38fd-f708-4b82-a9f1-35913545a231", "new_message": {"role": "user", "parts": [{"text": "what can you do?"}]}}	\N	\N	\N	\N
45	2025-04-25 07:48:15.275717+00	response	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	\N	[{"invocation_id": "DeJwabVS", "author": "root_agent", "content": {"parts": [{"text": "I act as the main point of contact and can help route your requests to the right specialist agent. Here's what we can handle:\\n\\n*   **Creating or deleting resources:** If you need to create or delete VMs, Cloud Storage Buckets, or Filestore instances, I'll pass you to **DevOps-Genie**.\\n*   **Listing or describing existing resources:** For listing VMs, disks, firewall rules, or checking resource details, **SmartOps** is the expert.\\n*   **Monitoring and Utilization:** If you have questions about resource usage or monitoring metrics, **SmartOps** can assist.\\n*   **Security and Networking:** For managing Firewall rules, IAM policies, or Internal Load Balancers, **SecureOps** is the agent to talk to.\\n\\nJust tell me what you need to do, and I'll make sure the right agent takes care of it! If your request is missing some details, I might ask for clarification first."}], "role": "model"}, "actions": {}, "id": "FrQ6P9k2", "timestamp": 1745567301.42247}]	200	6112	\N
46	2025-04-25 07:48:38.709482+00	request	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	{"session_id": "34ad38fd-f708-4b82-a9f1-35913545a231", "new_message": {"role": "user", "parts": [{"text": "list available resources"}]}}	\N	\N	\N	\N
47	2025-04-25 07:48:38.711648+00	response	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	\N	{"raw_text": "Internal Server Error"}	500	3374	\N
48	2025-04-25 07:48:42.088384+00	error	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	\N	\N	500	\N	Failed to send GCP message: Internal Server Error
49	2025-04-25 07:48:42.090317+00	error	gcp	34ad38fd-f708-4b82-a9f1-35913545a231	http://34.58.224.198:8000/agent/run	\N	\N	\N	\N	Failed to send GCP message: Internal Server Error
50	2025-04-25 08:05:22.393744+00	request	aws	617aaadc-3390-4a23-b0b5-d581109a1be6	bedrock-agent-runtime.invoke_agent	{"agentId": "NOPNUNTEOB", "agentAliasId": "UHMWSV1HUM", "message": "hi"}	\N	\N	\N	\N
51	2025-04-25 08:05:22.858867+00	response	aws	617aaadc-3390-4a23-b0b5-d581109a1be6	bedrock-agent-runtime.invoke_agent	\N	{"completion": "Hello! Welcome to the AWS resource management assistant. I'm here to help you with various tasks related to AWS resources, infrastructure management, and more. How can I assist you today? Feel free to ask about creating, modifying, or managing AWS resources, installing software, patching systems, or any other AWS-related tasks you need help with.", "trace": ""}	200	347	\N
52	2025-04-25 09:13:55.063358+00	request	gcp	07d8b005-1d67-4162-81f5-6c2bc2542f78	http://34.58.224.198:8000/sessions/07d8b005-1d67-4162-81f5-6c2bc2542f78	{"method": "POST", "url": "http://34.58.224.198:8000/sessions/07d8b005-1d67-4162-81f5-6c2bc2542f78"}	\N	\N	\N	\N
53	2025-04-25 09:13:55.071223+00	response	gcp	07d8b005-1d67-4162-81f5-6c2bc2542f78	http://34.58.224.198:8000/sessions/07d8b005-1d67-4162-81f5-6c2bc2542f78	\N	{"id": "07d8b005-1d67-4162-81f5-6c2bc2542f78", "state": {}, "events": [], "last_update_time": 1745572435.5538583}	200	439	\N
55	2025-04-25 09:13:55.54247+00	response	gcp	07d8b005-1d67-4162-81f5-6c2bc2542f78	http://34.58.224.198:8000/agent/run	\N	[{"invocation_id": "b4Ka0bX5", "author": "root_agent", "content": {"parts": [{"text": "Hi there! How can I help you today? I can assist with managing cloud resources, monitoring, security settings, and more. Just let me know what you need."}], "role": "model"}, "actions": {}, "id": "xrV0PUX4", "timestamp": 1745572442.254505}]	200	6694	\N
\.


--
-- Data for Name: aws_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aws_settings (id, agent_id, agent_alias_id, is_active, created_at, updated_at) FROM stdin;
1	NOPNUNTEOB	UHMWSV1HUM	f	2025-04-25 03:21:15.357171+00	2025-04-25 03:21:45.590214+00
2	NOPNUNTEOBX	UHMWSV1HUM	f	2025-04-25 03:21:45.590214+00	2025-04-25 04:07:56.291125+00
3	NOPNUNTEOBX123	UHMWSV1HUM	f	2025-04-25 04:07:56.291125+00	2025-04-25 04:18:52.616024+00
4	NOPNUNTEOBX123x	UHMWSV1HUM	f	2025-04-25 04:18:52.616024+00	2025-04-25 04:23:14.111479+00
5	NOPNUNTEOB	UHMWSV1HUM	t	2025-04-25 04:23:14.111479+00	2025-04-25 04:23:14.111479+00
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, thread_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: chat_threads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_threads (id, user_id, title, cloud_provider, created_at, updated_at) FROM stdin;
1	1	AWS EC2 Setup Discussion	aws	2025-04-18 14:01:50.995915+00	2025-04-18 14:01:50.995915+00
2	1	GCP VM Configuration	gcp	2025-04-18 14:01:50.995915+00	2025-04-18 14:01:50.995915+00
3	2	AWS S3 Bucket Creation	aws	2025-04-18 14:01:50.995915+00	2025-04-18 14:01:50.995915+00
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, user_id, filename, url, uploaded_at) FROM stdin;
\.


--
-- Data for Name: favorite_prompts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorite_prompts (id, user_id, prompt_id, created_at) FROM stdin;
1	1	aws-1	2025-04-18 14:01:50.993665+00
2	1	aws-3	2025-04-18 14:01:50.993665+00
3	1	aws-user-1	2025-04-18 14:01:50.993665+00
4	2	aws-1	2025-04-18 14:01:50.993665+00
5	1	aws-9	2025-04-20 18:06:15.529389+00
6	1	onprem-1	2025-04-20 18:06:42.889443+00
7	7	prompt-1745232736838	2025-04-21 14:53:46.134681+00
9	7	onprem-3	2025-04-21 14:53:54.175289+00
11	8	gcp-1	2025-04-23 11:02:05.977006+00
\.


--
-- Data for Name: gcp_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gcp_settings (id, session_endpoint, agent_run_endpoint, is_active, created_at, updated_at) FROM stdin;
1	http://34.58.224.198:8000/sessions	http://34.58.224.198:8000/agent/run	t	2025-04-25 06:25:09.303913+00	2025-04-25 06:25:09.303913+00
\.


--
-- Data for Name: navigation_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.navigation_items (id, title, path, tooltip, "position", "order", is_enabled, required_role, created_at, updated_at) FROM stdin;
new-chat	New Chat	/chat	Start a new conversation	sidebar	10	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
chat-history	Chat History	/chat/history	Browse saved conversations	sidebar	20	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
infrastructure	Infrastructure	/infrastructure	Manage cloud infrastructure	sidebar	30	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
prompt-library	Prompt Library	/prompt-library	Access saved prompts & templates	sidebar	40	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
logs	System Logs	/logs	View system activity logs	sidebar	50	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
security	Security	/security	Manage security & permissions	sidebar	60	t	admin	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
notifications	Notifications	/notifications	View alerts & notifications	sidebar	70	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
finops	FinOps	/finops	Monitor cloud costs & usage	sidebar	80	t	admin	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
settings	Settings	/settings	Configure application settings	bottom	10	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
profile	Profile	/profile	Manage your profile	bottom	20	t	\N	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
admin	Admin	/admin	Admin dashboard	bottom	30	t	admin	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
backend-test	API Test	/backend-test	Test backend API endpoints	bottom	40	t	admin	2025-04-24 16:32:14.243962+00	2025-04-24 16:32:14.243962+00
\.


--
-- Data for Name: prompts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prompts (id, title, description, category, command, cloud_provider, user_id, is_system, created_at, updated_at) FROM stdin;
aws-1	Create EC2 Instance	Provision a new Provision EC2 resource in your AWS infrastructure	Provision EC2	create ec2 instance t2.micro ubuntu us-east-1	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-2	Delete EC2 Instance	Safely remove a Provision EC2 resource from your AWS infrastructure	Provision EC2	delete ec2 instance abc AMAN	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-3	Create S3 Bucket	Provision a new Provision S3 resource in your AWS infrastructure	Provision S3	create s3 bucket test-1234567	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-4	Delete S3 Bucket	Safely remove a Provision S3 resource from your AWS infrastructure	Provision S3	delete s3 bucket test-1234567 AMAN	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-5	Scan Patches with Baseline	Perform a security scan on your AWS Patch Management resources	Patch Management	scan patches i-xxx with-baseline	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-6	Scan Patches without Baseline	Perform a security scan on your AWS Patch Management resources	Patch Management	scan patches i-xxx without-baseline	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-7	Install Patches with Baseline	Manage Patch Management resources in your AWS infrastructure	Patch Management	install patches with-baseline	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-8	Install Patches without Baseline	Manage Patch Management resources in your AWS infrastructure	Patch Management	install patches without-baseline	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-9	Summarize Log Errors	Manage Auto Heal resources in your AWS infrastructure	Auto Heal	summarize errors	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-10	Scan Log Group Errors	Perform a security scan on your AWS Auto Heal resources	Auto Heal	scan /aws/logs/errors	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-11	Show Error Details	Manage Auto Heal resources in your AWS infrastructure	Auto Heal	show error details /aws/logs/errors/	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-12	Create Error Incident	Manage Auto Heal resources in your AWS infrastructure	Auto Heal	create incident	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-13	List Incidents	Get a detailed list of Auto Heal resources in your AWS infrastructure	Auto Heal	list incidents	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-14	List EC2 Instances	Get a detailed list of List Resources resources in your AWS infrastructure	List Resources	list ec2	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-15	List S3 Buckets	Get a detailed list of List Resources resources in your AWS infrastructure	List Resources	list s3	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-16	AWS Configure	Execute AWS CLI commands directly from the interface	CLI Commands	aws configure	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-17	AWS Version	Execute AWS CLI commands directly from the interface	CLI Commands	aws --version	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-18	List AWS Regions	Execute AWS CLI commands directly from the interface	CLI Commands	aws ec2 describe-regions	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-19	List AWS Profiles	Execute AWS CLI commands directly from the interface	CLI Commands	aws configure list-profiles	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
aws-20	AWS Help	Execute AWS CLI commands directly from the interface	CLI Commands	aws help	aws	\N	t	2025-04-18 14:01:50.989506+00	2025-04-18 14:01:50.989506+00
gcp-1	Create VM (Virtual Machine)	Provision a new Google Compute Engine resource in your GCP infrastructure	Google Compute Engine	Create GCE name ABC instance type n1-standard-1 OS image debian 11 region us-east1 network default, Project ID XYZ user ID a@hcltech.com	gcp	\N	t	2025-04-18 14:01:50.991595+00	2025-04-18 14:01:50.991595+00
gcp-2	Delete VM (Virtual Machine)	Safely remove a Google Compute Engine resource from your GCP infrastructure	Google Compute Engine	Delete GCE name ABC Project ID XYZ user ID a@hcltech.com	gcp	\N	t	2025-04-18 14:01:50.991595+00	2025-04-18 14:01:50.991595+00
gcp-3	Modify VM (Virtual Machine)	Modify existing Google Compute Engine resource settings in your GCP infrastructure	Google Compute Engine	Update GCE instance type n2-standard-2 VM name ABC Project ID XYZ user ID a@hcltech.com	gcp	\N	t	2025-04-18 14:01:50.991595+00	2025-04-18 14:01:50.991595+00
azure-1	Create Azure VM	Provision a new Virtual Machines resource in your AZURE infrastructure	Virtual Machines	create azure vm --name myVM --resource-group myRG --image Ubuntu2004	azure	\N	t	2025-04-18 14:01:50.992116+00	2025-04-18 14:01:50.992116+00
azure-2	Delete Azure VM	Safely remove a Virtual Machines resource from your AZURE infrastructure	Virtual Machines	delete azure vm --name myVM --resource-group myRG	azure	\N	t	2025-04-18 14:01:50.992116+00	2025-04-18 14:01:50.992116+00
azure-3	List Azure VMs	Get a detailed list of Virtual Machines resources in your AZURE infrastructure	Virtual Machines	list azure vms --resource-group myRG	azure	\N	t	2025-04-18 14:01:50.992116+00	2025-04-18 14:01:50.992116+00
onprem-1	Create VMware VM	Provision a new VMware resource in your ONPREM infrastructure	VMware	create vmware vm --name myVM --datastore myDatastore --network myNetwork	onprem	\N	t	2025-04-18 14:01:50.992614+00	2025-04-18 14:01:50.992614+00
onprem-2	Delete VMware VM	Safely remove a VMware resource from your ONPREM infrastructure	VMware	delete vmware vm --name myVM	onprem	\N	t	2025-04-18 14:01:50.992614+00	2025-04-18 14:01:50.992614+00
onprem-3	List VMware VMs	Get a detailed list of VMware resources in your ONPREM infrastructure	VMware	list vmware vms	onprem	\N	t	2025-04-18 14:01:50.992614+00	2025-04-18 14:01:50.992614+00
aws-user-1	My Custom EC2 Setup	Launch EC2 instance with my preferred configuration	EC2	create ec2 instance t2.micro ubuntu us-east-1 with-monitoring	aws	1	f	2025-04-18 14:01:50.993095+00	2025-04-18 14:01:50.993095+00
test-prompt-1745172056.7576303	Test Prompt	This is a test prompt	Testing	echo 'Hello World'	aws	1	f	2025-04-20 18:00:58.794397+00	2025-04-20 18:00:58.794397+00
prompt-1745232736838	test123	test123	testing	test test	aws	7	f	2025-04-21 10:52:16.881828+00	2025-04-21 10:52:16.881828+00
prompt-1745253389918	test1	test1	EC2x	test1	aws	6	f	2025-04-21 16:36:30.259835+00	2025-04-21 16:36:30.259835+00
prompt-1745422877737	test2	test2	EC2x	test2	aws	7	f	2025-04-23 15:41:18.094977+00	2025-04-23 15:41:18.094977+00
prompt-1745427194184	test1azure	testazure	c1	test123	azure	6	f	2025-04-23 16:53:14.198611+00	2025-04-23 16:53:14.198611+00
\.


--
-- Data for Name: provider_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_access (id, user_id, provider, has_access, is_active, created_at) FROM stdin;
1	1	aws	t	t	2025-04-18 14:01:50.978312+00
2	1	azure	t	t	2025-04-18 14:01:50.978312+00
3	1	gcp	t	t	2025-04-18 14:01:50.978312+00
4	1	onprem	t	t	2025-04-18 14:01:50.978312+00
6	2	azure	f	t	2025-04-18 14:01:50.988336+00
7	2	gcp	f	t	2025-04-18 14:01:50.988336+00
8	2	onprem	f	t	2025-04-18 14:01:50.988336+00
9	7	aws	t	t	2025-04-23 10:37:50.895925+00
10	7	azure	f	t	2025-04-23 10:37:50.956167+00
12	7	onprem	t	t	2025-04-23 10:37:50.991265+00
13	8	aws	f	t	2025-04-23 10:53:50.843347+00
14	8	azure	f	t	2025-04-23 10:53:50.851243+00
15	8	gcp	t	t	2025-04-23 10:53:50.85918+00
16	8	onprem	f	t	2025-04-23 10:53:50.882967+00
5	2	aws	t	f	2025-04-18 14:01:50.988336+00
17	9	aws	f	t	2025-04-23 16:07:33.554314+00
18	9	azure	f	t	2025-04-23 16:07:33.578017+00
19	9	gcp	f	t	2025-04-23 16:07:33.590173+00
20	9	onprem	t	t	2025-04-23 16:07:33.598116+00
22	6	azure	t	t	2025-04-23 16:07:47.318607+00
23	6	gcp	f	t	2025-04-23 16:07:47.341448+00
24	6	onprem	f	t	2025-04-23 16:07:47.360645+00
25	10	aws	f	t	2025-04-24 07:52:36.037001+00
26	10	azure	t	t	2025-04-24 07:52:36.074046+00
27	10	gcp	f	t	2025-04-24 07:52:36.083803+00
28	10	onprem	f	t	2025-04-24 07:52:36.091768+00
21	6	aws	t	t	2025-04-23 16:07:47.30263+00
29	11	aws	t	t	2025-04-24 15:34:16.309268+00
30	11	azure	f	t	2025-04-24 15:34:16.324893+00
31	11	gcp	f	t	2025-04-24 15:34:16.334426+00
32	11	onprem	f	t	2025-04-24 15:34:16.346088+00
33	13	aws	t	t	2025-04-24 16:19:20.192984+00
34	13	azure	t	t	2025-04-24 16:19:20.194857+00
35	13	onprem	t	t	2025-04-24 16:19:20.217937+00
36	13	gcp	t	t	2025-04-24 16:19:20.219307+00
11	7	gcp	t	t	2025-04-23 10:37:50.979463+00
\.


--
-- Data for Name: provider_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.provider_configs (id, user_id, provider, config, created_at) FROM stdin;
1	1	openai	{"model": "gpt-4", "api_key": "dummy_key_replace_in_production"}	2025-04-18 14:01:50.980237+00
2	1	aws_bedrock	{"region": "us-east-1", "access_key": "dummy_key_replace_in_production", "secret_key": "dummy_secret_replace_in_production"}	2025-04-18 14:01:50.980237+00
3	1	azure_openai	{"api_key": "dummy_key_replace_in_production", "endpoint": "https://example.openai.azure.com", "deployment_id": "gpt-4"}	2025-04-18 14:01:50.980237+00
4	1	gcp_vertexai	{"model": "gemini-pro", "location": "us-central1", "project_id": "your-project-id"}	2025-04-18 14:01:50.980237+00
5	2	openai	{"model": "gpt-3.5-turbo", "api_key": "user_dummy_key_replace_in_production"}	2025-04-18 14:01:50.988895+00
6	2	aws_bedrock	{"region": "us-west-2", "access_key": "user_dummy_key_replace_in_production", "secret_key": "user_dummy_secret_replace_in_production"}	2025-04-18 14:01:50.988895+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission, created_at) FROM stdin;
1	1	users:read	2025-04-18 14:01:50.972174+00
2	1	users:write	2025-04-18 14:01:50.972174+00
3	1	users:delete	2025-04-18 14:01:50.972174+00
4	1	prompts:read	2025-04-18 14:01:50.972174+00
5	1	prompts:write	2025-04-18 14:01:50.972174+00
6	1	prompts:delete	2025-04-18 14:01:50.972174+00
7	1	settings:read	2025-04-18 14:01:50.972174+00
8	1	settings:write	2025-04-18 14:01:50.972174+00
9	1	providers:read	2025-04-18 14:01:50.972174+00
10	1	providers:write	2025-04-18 14:01:50.972174+00
11	1	providers:delete	2025-04-18 14:01:50.972174+00
12	1	documents:read	2025-04-18 14:01:50.972174+00
13	1	documents:write	2025-04-18 14:01:50.972174+00
14	1	documents:delete	2025-04-18 14:01:50.972174+00
15	1	chat:read	2025-04-18 14:01:50.972174+00
16	1	chat:write	2025-04-18 14:01:50.972174+00
17	1	chat:delete	2025-04-18 14:01:50.972174+00
18	2	prompts:read	2025-04-18 14:01:50.972174+00
19	2	prompts:write_own	2025-04-18 14:01:50.972174+00
20	2	prompts:delete_own	2025-04-18 14:01:50.972174+00
21	2	settings:read_own	2025-04-18 14:01:50.972174+00
22	2	settings:write_own	2025-04-18 14:01:50.972174+00
23	2	providers:read_own	2025-04-18 14:01:50.972174+00
24	2	providers:write_own	2025-04-18 14:01:50.972174+00
25	2	documents:read_own	2025-04-18 14:01:50.972174+00
26	2	documents:write_own	2025-04-18 14:01:50.972174+00
27	2	documents:delete_own	2025-04-18 14:01:50.972174+00
28	2	chat:read_own	2025-04-18 14:01:50.972174+00
29	2	chat:write_own	2025-04-18 14:01:50.972174+00
30	2	chat:delete_own	2025-04-18 14:01:50.972174+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at) FROM stdin;
1	admin	Administrator with full access to all features	2025-04-18 14:01:50.970494+00
2	user	Regular user with limited access	2025-04-18 14:01:50.970494+00
3	Admin	Full system access	2025-04-20 08:45:24.885977+00
4	User	Standard user access	2025-04-20 08:45:24.885977+00
5	Viewer	Read-only access	2025-04-20 08:45:24.885977+00
\.


--
-- Data for Name: user_navigation_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_navigation_permissions (id, user_id, nav_item_id, is_enabled, created_at) FROM stdin;
\.


--
-- Data for Name: user_role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role_permissions (id, user_id, permission, granted, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
1	1	1	2025-04-18 14:01:50.976178+00
2	2	2	2025-04-18 14:01:50.9878+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, hashed_password, is_admin, is_authenticated, created_at, updated_at, is_active) FROM stdin;
2	Test User	user@intelliops.com	$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW	f	t	2025-04-18 14:01:50.987393+00	2025-04-18 14:01:50.987393+00	t
3	Test User	test@example.com	$2b$12$Kh8vSUVLcHx.JsKQ3efRMe.B2sL77kr.q5Ga2xZN/lFqdNLDdKdGy	f	t	2025-04-19 08:43:05.480677+00	2025-04-19 08:43:05.480677+00	t
4	Jaideep singh	jaideep12983@gmail.com	$2b$12$Td9Pv8ZBg8y3VkddhU2kq.253azpa3i6FdEE8DXJkilYF04e6XAXG	f	t	2025-04-19 10:28:43.678757+00	2025-04-19 10:28:43.678757+00	t
5	Jaideep singh	jaideep12984@gmail.com	$2b$12$hE.VnI5PXG9yLtdzYeUEA.pQiqfaUwRvOQ9AUt3SBTwS8SwJHd9Lu	f	t	2025-04-20 06:09:05.987896+00	2025-04-20 06:09:05.987896+00	t
1	System Administrator	admin@intelliops.com	$5$rounds=535000$4DL72pMYuLOsM7Pz$GA1RUZzZKfoa.gFy2yxiM7HhfDhYwdlfv5vlRCeha/0	t	t	2025-04-18 14:01:50.974529+00	2025-04-20 10:10:36.613971+00	t
6	Jaideep singh	jaideep12985@gmail.com	$5$rounds=535000$sh3RxCyv8p45AC7M$MKmguUrsw2yvYHL4wJduAxW1oaPY/1p27iCnBaGVoM4	f	t	2025-04-20 15:50:29.393487+00	2025-04-20 15:50:29.393487+00	t
7	Jaideep singh	jaideep12986@gmail.com	$5$rounds=535000$TePPz.8YsKmgfuxz$1w3M6oNc2Y7vI2.OM.EWQIf1xYd1MkgPSWV7ULHgZF8	t	t	2025-04-20 16:26:17.326273+00	2025-04-20 16:26:17.840112+00	t
8	Test ABC	testabc@hcltech.com	$5$rounds=535000$VKYK4yHBjqWPbGaT$qYuzGiY52sRN/VYr3vD5CKDsQZNMNQ7YHylF5tKi8O/	f	t	2025-04-22 06:56:09.424503+00	2025-04-22 06:56:09.424503+00	t
9	Test UserX	test1@example.com	$5$rounds=535000$4OFVGVznQp428UEo$5dWJWkOiVmtDQDeAvuM6BQ.rXKIpZ3cn11elYBxiWr6	f	t	2025-04-23 12:07:49.216817+00	2025-04-23 12:07:49.216817+00	t
10	Jaideep singh	jaideep12987@gmail.com	$5$rounds=535000$bUI0ZnmdyE0faPOy$Jx0wNgerfZYlR/oe/VPT2E1XCZJfNRqp/xqQXM4g6O1	f	t	2025-04-24 07:50:55.820372+00	2025-04-24 07:50:55.820372+00	t
11	Jaideep singh	jaideep12988@gmail.com	$5$rounds=535000$6BdlwRQwEm50EBf.$u.Id2wMrJIqdiXiHsYma3azjcLN6Rdv7Y07trKXXf54	f	t	2025-04-24 09:32:08.778446+00	2025-04-24 09:32:08.778446+00	t
12	Jaideep singh	jaideep12989@gmail.com	$5$rounds=535000$RnxvYbiFkNrTdhJ.$S.LnIEmCw4ycd6uFql1lnoGXVaT1lvdSH7A4Bn2ZsS2	f	t	2025-04-24 10:15:32.442169+00	2025-04-24 10:15:32.442169+00	t
13	Jaideep singh	jaideep12980@gmail.com	$5$rounds=535000$uaycvOW7JSEIGp1B$HVJMpl2SD2KbxFjW/DWBNegaCK7Ff/VOR3ES7Z6kdXD	t	t	2025-04-24 16:19:19.782633+00	2025-04-24 16:19:20.121858+00	t
\.


--
-- Name: api_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_logs_id_seq', 55, true);


--
-- Name: aws_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aws_settings_id_seq', 5, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chat_threads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_threads_id_seq', 3, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- Name: favorite_prompts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.favorite_prompts_id_seq', 13, true);


--
-- Name: gcp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gcp_settings_id_seq', 1, true);


--
-- Name: provider_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provider_access_id_seq', 36, true);


--
-- Name: provider_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.provider_configs_id_seq', 6, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 30, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: user_navigation_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_navigation_permissions_id_seq', 1, false);


--
-- Name: user_role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_role_permissions_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: api_logs api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_pkey PRIMARY KEY (id);


--
-- Name: aws_settings aws_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aws_settings
    ADD CONSTRAINT aws_settings_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_threads chat_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT chat_threads_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: favorite_prompts favorite_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_prompts
    ADD CONSTRAINT favorite_prompts_pkey PRIMARY KEY (id);


--
-- Name: favorite_prompts favorite_prompts_user_id_prompt_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_prompts
    ADD CONSTRAINT favorite_prompts_user_id_prompt_id_key UNIQUE (user_id, prompt_id);


--
-- Name: gcp_settings gcp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gcp_settings
    ADD CONSTRAINT gcp_settings_pkey PRIMARY KEY (id);


--
-- Name: navigation_items navigation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.navigation_items
    ADD CONSTRAINT navigation_items_pkey PRIMARY KEY (id);


--
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- Name: provider_access provider_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_access
    ADD CONSTRAINT provider_access_pkey PRIMARY KEY (id);


--
-- Name: provider_access provider_access_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_access
    ADD CONSTRAINT provider_access_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: provider_configs provider_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_configs
    ADD CONSTRAINT provider_configs_pkey PRIMARY KEY (id);


--
-- Name: provider_configs provider_configs_user_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_configs
    ADD CONSTRAINT provider_configs_user_id_provider_key UNIQUE (user_id, provider);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_key UNIQUE (role_id, permission);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_navigation_permissions user_navigation_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_navigation_permissions
    ADD CONSTRAINT user_navigation_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_role_permissions user_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_permissions
    ADD CONSTRAINT user_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_role_permissions user_role_permissions_user_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_permissions
    ADD CONSTRAINT user_role_permissions_user_id_permission_key UNIQUE (user_id, permission);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_thread_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_thread_id ON public.chat_messages USING btree (thread_id);


--
-- Name: idx_chat_threads_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_threads_provider ON public.chat_threads USING btree (cloud_provider);


--
-- Name: idx_chat_threads_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_threads_user_id ON public.chat_threads USING btree (user_id);


--
-- Name: idx_documents_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id);


--
-- Name: idx_favorite_prompts_prompt_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorite_prompts_prompt_id ON public.favorite_prompts USING btree (prompt_id);


--
-- Name: idx_favorite_prompts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorite_prompts_user_id ON public.favorite_prompts USING btree (user_id);


--
-- Name: idx_prompts_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompts_category ON public.prompts USING btree (category);


--
-- Name: idx_prompts_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompts_provider ON public.prompts USING btree (cloud_provider);


--
-- Name: idx_prompts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prompts_user_id ON public.prompts USING btree (user_id);


--
-- Name: idx_provider_access_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_provider_access_provider ON public.provider_access USING btree (provider);


--
-- Name: idx_provider_access_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_provider_access_user_id ON public.provider_access USING btree (user_id);


--
-- Name: idx_provider_configs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_provider_configs_user_id ON public.provider_configs USING btree (user_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_user_role_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_role_permissions_user_id ON public.user_role_permissions USING btree (user_id);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: ix_api_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_api_logs_id ON public.api_logs USING btree (id);


--
-- Name: ix_aws_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_aws_settings_id ON public.aws_settings USING btree (id);


--
-- Name: ix_gcp_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_gcp_settings_id ON public.gcp_settings USING btree (id);


--
-- Name: ix_navigation_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_navigation_items_id ON public.navigation_items USING btree (id);


--
-- Name: ix_user_navigation_permissions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_navigation_permissions_id ON public.user_navigation_permissions USING btree (id);


--
-- Name: ix_user_navigation_permissions_nav_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_navigation_permissions_nav_item_id ON public.user_navigation_permissions USING btree (nav_item_id);


--
-- Name: ix_user_navigation_permissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_navigation_permissions_user_id ON public.user_navigation_permissions USING btree (user_id);


--
-- Name: chat_messages chat_messages_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;


--
-- Name: chat_threads chat_threads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT chat_threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorite_prompts favorite_prompts_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_prompts
    ADD CONSTRAINT favorite_prompts_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- Name: favorite_prompts favorite_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorite_prompts
    ADD CONSTRAINT favorite_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: prompts prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: provider_access provider_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_access
    ADD CONSTRAINT provider_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: provider_configs provider_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provider_configs
    ADD CONSTRAINT provider_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_navigation_permissions user_navigation_permissions_nav_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_navigation_permissions
    ADD CONSTRAINT user_navigation_permissions_nav_item_id_fkey FOREIGN KEY (nav_item_id) REFERENCES public.navigation_items(id) ON DELETE CASCADE;


--
-- Name: user_navigation_permissions user_navigation_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_navigation_permissions
    ADD CONSTRAINT user_navigation_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_role_permissions user_role_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_permissions
    ADD CONSTRAINT user_role_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

