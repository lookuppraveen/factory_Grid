-- Create Order Artwork Table
CREATE TABLE IF NOT EXISTS order_artwork (
    id BIGSERIAL PRIMARY KEY,
    master_order_id BIGINT NOT NULL REFERENCES master_orders(id) ON DELETE CASCADE,
    sub_order_id BIGINT REFERENCES sub_orders(id) ON DELETE SET NULL,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(250),
    submission_type VARCHAR(50) NOT NULL DEFAULT 'UPLOAD',
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size VARCHAR(50),
    file_url VARCHAR(1000),
    storage_key VARCHAR(500),
    external_url VARCHAR(1000),
    instructions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    review_notes TEXT,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ(6),
    uploaded_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    uploaded_by_name VARCHAR(150),
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_artwork_master_order_id ON order_artwork(master_order_id);
CREATE INDEX IF NOT EXISTS idx_order_artwork_sub_order_id ON order_artwork(sub_order_id);
CREATE INDEX IF NOT EXISTS idx_order_artwork_product_id ON order_artwork(product_id);
CREATE INDEX IF NOT EXISTS idx_order_artwork_status ON order_artwork(status);
