-- PROPLEDGER Supabase Database Schema (IDEMPOTENT VERSION)
-- This version can be run multiple times safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers first (to allow re-running)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON public.user_tokens;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('investor', 'property_owner', 'agent', 'developer')),
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    wallet_address VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    agency VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    commission_rate DECIMAL(5,2),
    total_sales DECIMAL(15,2),
    rating DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    token_price DECIMAL(10,2) NOT NULL,
    total_tokens INTEGER NOT NULL,
    available_tokens INTEGER NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id),
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Manager messages table
CREATE TABLE IF NOT EXISTS public.manager_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manager_name VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    sender_type VARCHAR(20) DEFAULT 'user' CHECK (sender_type IN ('user', 'agent')),
    receiver_type VARCHAR(20) DEFAULT 'agent' CHECK (receiver_type IN ('user', 'agent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    replied_at TIMESTAMPTZ,
    reply_message TEXT
);

-- User tokens table
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    token_balance DECIMAL(15,2) DEFAULT 0,
    total_purchased DECIMAL(15,2) DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund')),
    token_amount DECIMAL(15,2) NOT NULL,
    pkr_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_reference VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    processing_fee_percent DECIMAL(5,2) DEFAULT 0,
    min_amount DECIMAL(15,2) DEFAULT 0,
    max_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.manager_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_manager ON public.manager_messages(manager_name);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON public.user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to allow re-running)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can view approved agents" ON public.agents;
DROP POLICY IF EXISTS "Agents can update their own profile" ON public.agents;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.manager_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.manager_messages;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.token_transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.token_transactions;
DROP POLICY IF EXISTS "Authenticated users can view payment methods" ON public.payment_methods;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Anyone can view approved agents" ON public.agents
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Agents can update their own profile" ON public.agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON public.properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Property owners can manage their properties" ON public.properties
    FOR ALL USING (auth.uid() = owner_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.manager_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON public.manager_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User tokens policies
CREATE POLICY "Users can view their own tokens" ON public.user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON public.user_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Token transactions policies
CREATE POLICY "Users can view their own transactions" ON public.token_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON public.token_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment methods policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view payment methods" ON public.payment_methods
    FOR SELECT TO authenticated USING (is_active = true);

-- Insert default payment methods
INSERT INTO public.payment_methods (method_name, display_name, is_active, processing_fee_percent, min_amount, max_amount)
VALUES 
    ('jazzcash', 'JazzCash', true, 1.5, 100, 100000),
    ('easypaisa', 'Easypaisa', true, 1.5, 100, 100000),
    ('bank_transfer', 'Bank Transfer', true, 0, 1000, 1000000),
    ('credit_card', 'Credit/Debit Card', true, 2.5, 500, 500000)
ON CONFLICT (method_name) DO NOTHING;

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, phone, country, user_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', ''),
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'investor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Supabase database setup completed successfully!' AS message;
