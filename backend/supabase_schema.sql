-- 1. TIPOS
CREATE TYPE user_role AS ENUM ('centro_acopio', 'lider_vecinal', 'ciudadano', 'clinica');
CREATE TYPE sos_status AS ENUM ('abierta', 'en_camino', 'entregada', 'cancelada');
CREATE TYPE donacion_status AS ENUM ('pendiente', 'completada', 'cancelada');

-- 2. USUARIOS (Auth Propio)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    rol user_role NOT NULL DEFAULT 'ciudadano',
    zona_operacion VARCHAR(255),
    foto_cedula_url TEXT,
    foto_rostro_url TEXT,
    activo BOOLEAN DEFAULT true,
    cantidad_reportes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. UBICACIONES Y CENTROS
CREATE TABLE public.centros_y_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo user_role NOT NULL, -- 'centro_acopio' o 'clinica'
    zona VARCHAR(255) NOT NULL,
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    encargado_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INVENTARIO UNIFICADO
CREATE TABLE public.inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    insumo VARCHAR(150) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unidad_medida VARCHAR(50) NOT NULL,
    umbral_minimo DECIMAL(10, 2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (propietario_id, insumo)
);

-- 5. SOLICITUDES SOS Y MENSAJERÍA DIRECTA
CREATE TABLE public.solicitudes_sos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitante_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    dirigido_a_centro_id UUID REFERENCES public.usuarios(id), -- Para Solicitudes Directas a Centros
    zona VARCHAR(255) NOT NULL,
    insumo_solicitado VARCHAR(150) NOT NULL,
    cantidad_solicitada DECIMAL(10, 2) NOT NULL,
    estado sos_status NOT NULL DEFAULT 'abierta',
    descripcion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    canal_origen VARCHAR(50) NOT NULL DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DONACIONES Y CÓDIGOS QR (Registro ciudadano)
CREATE TABLE public.donaciones_qr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_qr VARCHAR(255) UNIQUE NOT NULL,
    ciudadano_id UUID REFERENCES public.usuarios(id) NOT NULL,
    receptor_id UUID REFERENCES public.usuarios(id),
    estado donacion_status NOT NULL DEFAULT 'pendiente',
    insumo_donado VARCHAR(150) NOT NULL,
    cantidad_donada DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_escaneo TIMESTAMP WITH TIME ZONE
);

-- 7. CHECKLISTS DE DESPACHO (Centros hacia Comunidades)
CREATE TABLE public.despachos_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origen_id UUID REFERENCES public.usuarios(id) NOT NULL,
    destino_id UUID REFERENCES public.usuarios(id) NOT NULL,
    estado VARCHAR(50) DEFAULT 'en_preparacion', -- en_preparacion, en_camino, entregado
    contenido JSONB NOT NULL, -- Ej: [{"insumo": "Harina Pan", "cant": 10}]
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_entrega TIMESTAMP WITH TIME ZONE
);

-- 8. BOT WHATSAPP
CREATE TABLE public.whatsapp_session (
    id VARCHAR(255) PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. CHAT Y MENSAJERÍA
CREATE TABLE public.mensajes_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sala_id VARCHAR(255) NOT NULL, -- ej: 'room_id1_id2' o 'global_zona'
    remitente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. ANUNCIOS Y HORARIOS DE CENTROS
CREATE TABLE public.anuncios_centros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. REGISTRO DE PERSONAS (Refugiados / Ingresados Clínicas)
CREATE TABLE public.registro_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(50),
    estado_salud VARCHAR(50) NOT NULL, -- Ej: 'Atendido', 'Herido', 'A Salvo', 'Fallecido', 'Desaparecido'
    notas TEXT,
    registrador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
