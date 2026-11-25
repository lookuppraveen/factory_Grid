-- Create Master Orders Table
CREATE TABLE IF NOT EXISTS master_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    rfq_id BIGINT REFERENCES rfqs(id) ON DELETE SET NULL,
    quote_id BIGINT REFERENCES quotes(id) ON DELETE SET NULL,
    buyer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    buyer_registration_id BIGINT REFERENCES buyer_registrations(id) ON DELETE SET NULL,
    customer_name VARCHAR(250) NOT NULL,
    customer_code VARCHAR(50),
    customer_classification VARCHAR(50) DEFAULT 'REGULAR',
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    shipping_address TEXT,
    billing_address TEXT,
    buyer_gst VARCHAR(50),
    advance_required BOOLEAN NOT NULL DEFAULT false,
    advance_outstanding DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_orders_rfq_id ON master_orders(rfq_id);
CREATE INDEX IF NOT EXISTS idx_master_orders_buyer_id ON master_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_master_orders_status ON master_orders(status);

-- Create Sub Orders Table
CREATE TABLE IF NOT EXISTS sub_orders (
    id BIGSERIAL PRIMARY KEY,
    sub_order_number VARCHAR(50) NOT NULL UNIQUE,
    master_order_id BIGINT NOT NULL REFERENCES master_orders(id) ON DELETE CASCADE,
    manufacturer_id BIGINT NOT NULL REFERENCES manufacturer_registrations(id) ON DELETE CASCADE,
    quote_id BIGINT REFERENCES quotes(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_ACCEPTANCE',
    production_status VARCHAR(50) DEFAULT 'AWAITING_ACCEPTANCE',
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    lead_time_days INTEGER NOT NULL DEFAULT 14,
    delivery_date DATE,
    shipping_address TEXT,
    billing_address TEXT,
    rejection_reason VARCHAR(255),
    rejection_remarks TEXT,
    accepted_at TIMESTAMPTZ(6),
    source_quote_ref VARCHAR(50),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_orders_master_order_id ON sub_orders(master_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_manufacturer_id ON sub_orders(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_production_status ON sub_orders(production_status);

-- Create Sub Order Lines Table
CREATE TABLE IF NOT EXISTS sub_order_lines (
    id BIGSERIAL PRIMARY KEY,
    sub_order_id BIGINT NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50),
    product_name VARCHAR(250) NOT NULL,
    dosage_form VARCHAR(100),
    pack_size VARCHAR(100),
    quantity INTEGER NOT NULL,
    uom VARCHAR(50) DEFAULT 'Units',
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    lead_time_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_order_lines_sub_order_id ON sub_order_lines(sub_order_id);

-- Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,
    sub_order_id BIGINT NOT NULL UNIQUE REFERENCES sub_orders(id) ON DELETE CASCADE,
    master_order_id BIGINT NOT NULL REFERENCES master_orders(id) ON DELETE CASCADE,
    manufacturer_id BIGINT NOT NULL REFERENCES manufacturer_registrations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    shipping_address TEXT,
    billing_address TEXT,
    buyer_name VARCHAR(250),
    buyer_gst VARCHAR(50),
    mfg_name VARCHAR(250),
    mfg_gst VARCHAR(50),
    total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    payment_terms VARCHAR(255),
    delivery_terms VARCHAR(255),
    source_quote_ref VARCHAR(50),
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_sub_order_id ON purchase_orders(sub_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_mfr_id ON purchase_orders(manufacturer_id);

-- Create Purchase Order Lines Table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50),
    product_name VARCHAR(250) NOT NULL,
    dosage_form VARCHAR(100),
    quantity INTEGER NOT NULL,
    uom VARCHAR(50) DEFAULT 'Units',
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_lines_po_id ON purchase_order_lines(purchase_order_id);

-- Create Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGSERIAL PRIMARY KEY,
    sub_order_id BIGINT NOT NULL REFERENCES sub_orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_sub_order_id ON order_status_history(sub_order_id);
