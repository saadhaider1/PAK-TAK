-- Update the trigger function to skip auto-creation when skip_auto_profile flag is set
-- This allows manual profile creation in the signup API route

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip auto-creation if skip_auto_profile flag is set
    IF NEW.raw_user_meta_data->>'skip_auto_profile' = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Auto-create profile for OAuth users or other cases
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

-- Success message
SELECT 'Trigger function updated successfully!' AS message;
