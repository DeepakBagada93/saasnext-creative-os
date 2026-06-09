-- Enable pgvector extension for semantic similarity search
create extension if not exists vector;

-- Workspaces table
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plan text not null default 'free', -- 'free', 'agency', 'scale'
  api_key text not null unique,
  created_at timestamp with time zone default now()
);

-- Clients table
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  industry text,
  created_at timestamp with time zone default now()
);

-- Hooks table
create table if not exists hooks (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  hook text not null,
  category text, -- 'curiosity', 'pain', 'authority', 'contrarian', 'urgency'
  created_at timestamp with time zone default now()
);

-- Angles table
create table if not exists angles (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  angle text not null,
  created_at timestamp with time zone default now()
);

-- Concepts table
create table if not exists concepts (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  concept jsonb not null, -- { hook: text, angle: text, creative_brief: text, cta: text }
  created_at timestamp with time zone default now()
);

-- Winners table
create table if not exists winners (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  content jsonb not null, -- contains hook, ad, campaign info
  score integer default 0, -- rating or historical score
  embedding vector(768), -- text-embedding-004 output
  created_at timestamp with time zone default now()
);

-- Vector index for fast similarity search
create index on winners using hnsw (embedding vector_cosine_ops);

-- Similarity matching function for winners
create or replace function match_winners (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_client_id uuid default null
) returns table (
  id uuid,
  client_id uuid,
  content jsonb,
  score int,
  similarity float
) language sql stable as $$
  select
    winners.id,
    winners.client_id,
    winners.content,
    winners.score,
    1 - (winners.embedding <=> query_embedding) as similarity
  from winners
  where 
    (1 - (winners.embedding <=> query_embedding) > match_threshold)
    and (filter_client_id is null or winners.client_id = filter_client_id)
  order by winners.embedding <=> query_embedding
  limit match_count;
$$;

-- Insert a default mockup Workspace for local testing
insert into workspaces (id, name, plan, api_key)
values (
  'd3b07384-d113-4ec5-a587-ad2052f53d71',
  'Mock Agency Workspace',
  'agency',
  'cos_live_mockkey12345'
) on conflict (api_key) do nothing;
