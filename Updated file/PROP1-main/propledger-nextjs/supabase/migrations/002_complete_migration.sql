-- ============================================
-- PROPLEDGER Complete Migration to Supabase
-- Migration 002: Investments, Video Calls, and Property Seeds
-- ============================================

-- ============================================
-- INVESTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.investments (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tokens_purchased INTEGER NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  roi_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investments_user ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_property ON public.investments(property_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);

-- ============================================
-- VIDEO CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.video_calls (
  id SERIAL PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_name VARCHAR(255) NOT NULL,
  caller_name VARCHAR(255) NOT NULL,
  room_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_video_calls_agent ON public.video_calls(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_video_calls_caller ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_room ON public.video_calls(room_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON public.video_calls(status);

-- ============================================
-- ROW LEVEL SECURITY - INVESTMENTS
-- ============================================
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create investments" ON public.investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;

-- Create policies
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- ROW LEVEL SECURITY - VIDEO CALLS
-- ============================================
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own calls" ON public.video_calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.video_calls;
DROP POLICY IF EXISTS "Agents can update calls" ON public.video_calls;

-- Create policies
CREATE POLICY "Users can view their own calls" ON public.video_calls
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = agent_id);

CREATE POLICY "Users can create calls" ON public.video_calls
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Agents can update calls" ON public.video_calls
  FOR UPDATE USING (auth.uid() = agent_id OR auth.uid() = caller_id);

-- ============================================
-- SEED PROPERTIES DATA
-- ============================================

-- Note: This requires at least one property owner user to exist
-- The owner_id will be set to the first property_owner user found
-- If no property owner exists, these inserts will be skipped

DO $$
DECLARE
  default_owner_id UUID;
BEGIN
  -- Get first property owner or create a placeholder
  SELECT id INTO default_owner_id 
  FROM public.users 
  WHERE user_type = 'property_owner' 
  LIMIT 1;
  
  -- If no property owner exists, use first user
  IF default_owner_id IS NULL THEN
    SELECT id INTO default_owner_id 
    FROM public.users 
    LIMIT 1;
  END IF;
  
  -- Only proceed if we have a valid owner
  IF default_owner_id IS NOT NULL THEN
    
    -- Property 1: Dolmen Mall Clifton
    INSERT INTO public.properties (title, description, location, price, token_price, total_tokens, available_tokens, property_type, owner_id, image_url, is_active)
    SELECT 
      'Dolmen Mall Clifton',
      'Premium commercial property in Karachi''s most prestigious location. Dolmen Mall Clifton offers world-class retail and dining experiences.',
      'Clifton, Karachi',
      150000000.00,
      1000.00,
      150000,
      75000,
      'commercial',
      default_owner_id,
      '/images/dolmen-mall.jpg',
      true
    WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Dolmen Mall Clifton');
    
    -- Property 2: Bahria Town Karachi
    INSERT INTO public.properties (title, description, location, price, token_price, total_tokens, available_tokens, property_type, owner_id, image_url, is_active)
    SELECT 
      'Bahria Town Karachi',
      'Luxurious gated community offering residential and commercial properties with world-class amenities including golf courses, theme parks, and shopping malls.',
      'Bahria Town, Karachi',
      200000000.00,
      1500.00,
      133333,
      66666,
      'residential',
      default_owner_id,
      '/images/bahria-town.jpg',
      true
    WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Bahria Town Karachi');
    
    -- Property 3: DHA Phase 8
    INSERT INTO public.properties (title, description, location, price, token_price, total_tokens, available_tokens, property_type, owner_id, image_url, is_active)
    SELECT 
      'DHA Phase 8',
      'Defence Housing Authority Phase 8 offers premium residential plots and houses in one of Karachi''s most sought-after locations.',
      'DHA Phase 8, Karachi',
      180000000.00,
      1200.00,
      150000,
      90000,
      'residential',
      default_owner_id,
      '/images/dha-phase8.jpg',
      true
    WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'DHA Phase 8');
    
    -- Property 4: Emaar Canyon Views
    INSERT INTO public.properties (title, description, location, price, token_price, total_tokens, available_tokens, property_type, owner_id, image_url, is_active)
    SELECT 
      'Emaar Canyon Views',
      'Modern residential complex with stunning views and premium amenities. Part of the prestigious Emaar development.',
      'Islamabad',
      120000000.00,
      800.00,
      150000,
      100000,
      'residential',
      default_owner_id,
      '/images/emaar-canyon.jpg',
      true
    WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Emaar Canyon Views');
    
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Migration 002 completed successfully! Investments and Video Calls tables created.' AS message;
