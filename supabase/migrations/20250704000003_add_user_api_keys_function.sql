-- Create user_settings table for API keys and other settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  api_keys JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can only access their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create function to get user API keys
CREATE OR REPLACE FUNCTION get_user_api_keys()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_keys jsonb;
BEGIN
  -- Get API keys for the authenticated user
  SELECT api_keys INTO user_keys
  FROM user_settings
  WHERE user_id = auth.uid();
  
  -- Return empty object if no settings found
  IF user_keys IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  RETURN user_keys;
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at_trigger
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Grant permissions
GRANT ALL ON user_settings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_api_keys TO authenticated;