-- Additional tables for Token Purchase System
-- Add these to your existing database

-- User tokens table - tracks token balances
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_balance INTEGER DEFAULT 0,
    total_purchased INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Token transactions table - tracks all token purchases and spending
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund')),
    token_amount INTEGER NOT NULL,
    pkr_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Payment methods table - supported payment options
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    processing_fee_percent DECIMAL(5,2) DEFAULT 0,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(15,2) DEFAULT 1000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment methods
INSERT INTO payment_methods (method_name, display_name, processing_fee_percent, min_amount, max_amount) VALUES
('credit_card', 'Credit/Debit Card', 2.5, 100, 500000),
('bank_transfer', 'Bank Transfer', 0.5, 500, 1000000),
('bank_hbl', 'HBL Bank Account', 0.3, 1000, 2000000),
('bank_ubl', 'UBL Bank Account', 0.3, 1000, 2000000),
('bank_mcb', 'MCB Bank Account', 0.3, 1000, 2000000),
('bank_allied', 'Allied Bank Account', 0.3, 1000, 2000000),
('easypaisa', 'EasyPaisa', 1.5, 50, 100000),
('jazzcash', 'JazzCash', 1.5, 50, 100000),
('sadapay', 'SadaPay', 1.2, 100, 150000),
('nayapay', 'NayaPay', 1.2, 100, 150000),
('crypto_usdt', 'USDT (Crypto)', 1.0, 100, 1000000),
('crypto_btc', 'Bitcoin', 1.0, 500, 1000000)
ON CONFLICT (method_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_status ON token_transactions(status);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created ON token_transactions(created_at);

-- Function to update user token balance
CREATE OR REPLACE FUNCTION update_user_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process completed transactions
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Insert or update user_tokens record
        INSERT INTO user_tokens (user_id, token_balance, total_purchased, total_spent, last_purchase_at, updated_at)
        VALUES (
            NEW.user_id,
            CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.token_amount ELSE -NEW.token_amount END,
            CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.token_amount ELSE 0 END,
            CASE WHEN NEW.transaction_type = 'spend' THEN NEW.token_amount ELSE 0 END,
            CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.completed_at ELSE NULL END,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) DO UPDATE SET
            token_balance = user_tokens.token_balance + 
                CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.token_amount ELSE -NEW.token_amount END,
            total_purchased = user_tokens.total_purchased + 
                CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.token_amount ELSE 0 END,
            total_spent = user_tokens.total_spent + 
                CASE WHEN NEW.transaction_type = 'spend' THEN NEW.token_amount ELSE 0 END,
            last_purchase_at = CASE WHEN NEW.transaction_type = 'purchase' THEN NEW.completed_at ELSE user_tokens.last_purchase_at END,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update token balances
CREATE TRIGGER trigger_update_token_balance
    AFTER INSERT OR UPDATE ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_token_balance();
