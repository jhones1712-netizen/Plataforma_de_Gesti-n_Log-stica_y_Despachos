-- Creación de tipos ENUM para restricciones estrictas
create type tipo_vehiculo_enum as enum ('moto', 'motocarro');
create type tipo_servicio_enum as enum ('pedido', 'viaje');
create type estado_servicio_enum as enum ('pendiente', 'aceptado', 'en_camino', 'terminado', 'cancelado');

-- 1. Tabla transportadores
create table transportadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(nombre) between 2 and 100),
  telefono text not null check (telefono ~ '^[0-9]{7,15}$'),
  tipo_vehiculo tipo_vehiculo_enum not null,
  disponible boolean not null default true,
  fecha_creacion timestamptz not null default now()
);

-- 2. Tabla clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(nombre) between 2 and 100),
  telefono text not null check (telefono ~ '^[0-9]{7,15}$'),
  fecha_creacion timestamptz not null default now()
);

-- 3. Tabla servicios
create table servicios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  transportador_id uuid references transportadores(id) on delete set null,
  tipo tipo_servicio_enum not null default 'pedido',
  origen text not null check (length(origen) between 3 and 255),
  destino text not null check (length(destino) between 3 and 255),
  descripcion text check (length(descripcion) <= 500),
  precio integer not null check (precio > 0),
  estado estado_servicio_enum not null default 'pendiente',
  fecha_creacion timestamptz not null default now()
);

-- Índices para llaves foráneas (mejora de rendimiento)
create index idx_servicios_cliente_id on servicios(cliente_id);
create index idx_servicios_transportador_id on servicios(transportador_id);
create index idx_servicios_estado on servicios(estado);
create index idx_servicios_fecha_creacion on servicios(fecha_creacion desc);

-- Habilitar Row Level Security (RLS) en todas las tablas
alter table transportadores enable row level security;
alter table clientes enable row level security;
alter table servicios enable row level security;

-- Políticas de acceso: solo usuarios autenticados (administrador) tienen acceso total
create policy "Acceso autenticado transportadores" on transportadores
  for all to authenticated using (true) with check (true);

create policy "Acceso autenticado clientes" on clientes
  for all to authenticated using (true) with check (true);

create policy "Acceso autenticado servicios" on servicios
  for all to authenticated using (true) with check (true);