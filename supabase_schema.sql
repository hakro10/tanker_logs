-- Supabase schema for the fuel daily work log
create extension if not exists "uuid-ossp";

create type cargo_type as enum (
  'diesel',
  'petrol',
  'diesel_plus',
  'petrol_plus',
  'kerosene',
  'gas_oil'
);

create table drivers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

create table trucks (
  id uuid primary key default uuid_generate_v4(),
  plate text not null unique,
  created_at timestamptz default now()
);

create table trailers (
  id uuid primary key default uuid_generate_v4(),
  plate text not null unique,
  compartment_count smallint not null default 6,
  max_per_compartment_liters integer not null default 7200,
  created_at timestamptz default now()
);

create table work_logs (
  id uuid primary key default uuid_generate_v4(),
  work_date date not null unique,
  driver_id uuid references drivers(id),
  truck_id uuid references trucks(id),
  trailer_id uuid references trailers(id),
  start_time time,
  end_time time,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table jobs (
  id uuid primary key default uuid_generate_v4(),
  work_log_id uuid references work_logs(id) on delete cascade,
  job_number text,
  customer_account text,
  delivery_address text,
  position integer default 0,
  created_at timestamptz default now()
);

create table job_drops (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  customer_name text,
  delivery_address text,
  created_at timestamptz default now()
);

create table cargo_drops (
  id uuid primary key default uuid_generate_v4(),
  job_drop_id uuid references job_drops(id) on delete cascade,
  cargo cargo_type not null,
  liters numeric(10,2) not null,
  compartment smallint not null,
  created_at timestamptz default now()
);

create index on jobs(work_log_id);
create index on job_drops(job_id);
create index on cargo_drops(job_drop_id);
