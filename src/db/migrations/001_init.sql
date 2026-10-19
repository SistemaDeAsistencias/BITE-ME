CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY, full_name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 phone VARCHAR(30), password_hash TEXT NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','customer')),
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, slug VARCHAR(100) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS products (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(140) NOT NULL, slug VARCHAR(160) NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '',
 price NUMERIC(10,2) NOT NULL CHECK (price >= 0), image_url TEXT NOT NULL DEFAULT '', category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
 stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0), active BOOLEAN NOT NULL DEFAULT TRUE, featured BOOLEAN NOT NULL DEFAULT FALSE,
 tag VARCHAR(40), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_active_category_idx ON products(active, category_id);
CREATE INDEX IF NOT EXISTS products_name_idx ON products USING gin (to_tsvector('simple', name));
CREATE TABLE IF NOT EXISTS orders (
 id BIGSERIAL PRIMARY KEY, code VARCHAR(32) NOT NULL UNIQUE, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
 customer_name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL, phone VARCHAR(30) NOT NULL,
 address TEXT NOT NULL, district VARCHAR(100) NOT NULL, city VARCHAR(100) NOT NULL, reference TEXT,
 delivery_method VARCHAR(30) NOT NULL DEFAULT 'delivery' CHECK (delivery_method IN ('delivery','pickup')),
 payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash_on_delivery','bank_transfer')),
 payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','confirmed','refunded')),
 status VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente','Confirmado','En preparación','En camino','Entregado','Cancelado')),
 notes TEXT, subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0), discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
 shipping NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0), total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_items (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id BIGINT REFERENCES products(id) ON DELETE SET NULL, product_name VARCHAR(140) NOT NULL,
 unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0), quantity INTEGER NOT NULL CHECK (quantity > 0), line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0)
);
CREATE TABLE IF NOT EXISTS payments (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 method VARCHAR(30) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
 provider_reference TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS order_status_history (
 id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 old_status VARCHAR(30), new_status VARCHAR(30) NOT NULL, changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
 id BIGSERIAL PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS carts (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cart_items (
 id BIGSERIAL PRIMARY KEY, cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
 product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INTEGER NOT NULL CHECK (quantity > 0), UNIQUE(cart_id, product_id)
);
