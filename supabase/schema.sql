-- =====================================================
-- Crowdsourced Transcription Validation System
-- Database Schema for Supabase (PostgreSQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MODELS TABLE
-- Stores different transcription model configurations
-- =====================================================
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default models
INSERT INTO models (model_name, description) VALUES 
    ('Peshawar', 'Peshawar Fine-Tuned Model for Pashto language'),
    ('Whisper', 'OpenAI Whisper Model');

-- =====================================================
-- 2. AUDIOS TABLE
-- Stores metadata for uploaded audio files
-- =====================================================
CREATE TABLE audios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_name VARCHAR(512) NOT NULL,
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    language_tag VARCHAR(50) DEFAULT 'pashto',
    duration_seconds FLOAT,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_audios_audio_name ON audios(audio_name);
CREATE INDEX idx_audios_language_tag ON audios(language_tag);
CREATE INDEX idx_audios_is_validated ON audios(is_validated);

-- =====================================================
-- 3. TRANSCRIPTIONS TABLE
-- Stores transcriptions from different models for each audio
-- =====================================================
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_id UUID NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    bleu_score DECIMAL(10, 6),
    chrf_score DECIMAL(10, 6),
    word_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique transcription per audio-model combination
    UNIQUE(audio_id, model_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_transcriptions_audio_id ON transcriptions(audio_id);
CREATE INDEX idx_transcriptions_model_id ON transcriptions(model_id);

-- =====================================================
-- 4. FEEDBACK TABLE
-- Stores user validation feedback and preferences
-- =====================================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_id UUID NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
    preferred_transcription_id UUID REFERENCES transcriptions(id) ON DELETE SET NULL,
    user_comments TEXT,
    user_identifier VARCHAR(255), -- Optional: for tracking anonymous users
    session_id VARCHAR(255), -- Session tracking
    ip_address INET, -- For analytics (optional)
    user_agent TEXT, -- Browser info (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX idx_feedback_audio_id ON feedback(audio_id);
CREATE INDEX idx_feedback_preferred_transcription_id ON feedback(preferred_transcription_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- =====================================================
-- 5. VALIDATION STATS VIEW
-- Aggregated view for validation statistics
-- =====================================================
CREATE OR REPLACE VIEW validation_stats AS
SELECT 
    a.id AS audio_id,
    a.audio_name,
    a.language_tag,
    COUNT(DISTINCT f.id) AS total_votes,
    COUNT(DISTINCT CASE WHEN t.model_id = (SELECT id FROM models WHERE model_name = 'Peshawar') THEN f.id END) AS peshawar_votes,
    COUNT(DISTINCT CASE WHEN t.model_id = (SELECT id FROM models WHERE model_name = 'Whisper') THEN f.id END) AS whisper_votes
FROM audios a
LEFT JOIN feedback f ON a.id = f.audio_id
LEFT JOIN transcriptions t ON f.preferred_transcription_id = t.id
GROUP BY a.id, a.audio_name, a.language_tag;

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- Auto-update timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_audios_updated_at
    BEFORE UPDATE ON audios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at
    BEFORE UPDATE ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to mark audio as validated when feedback is received
CREATE OR REPLACE FUNCTION mark_audio_validated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE audios SET is_validated = TRUE WHERE id = NEW.audio_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mark_audio_validated
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION mark_audio_validated();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE audios ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access on audios" ON audios
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on models" ON models
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on transcriptions" ON transcriptions
    FOR SELECT USING (true);

-- Admin write access (using service role key)
CREATE POLICY "Allow service role full access on audios" ON audios
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on models" ON models
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access on transcriptions" ON transcriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Public can insert feedback
CREATE POLICY "Allow public insert on feedback" ON feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own feedback" ON feedback
    FOR SELECT USING (true);

-- =====================================================
-- 8. STORAGE BUCKET SETUP (Run in Supabase Dashboard)
-- =====================================================
-- Note: Execute these in Supabase SQL Editor or Dashboard

-- Create storage bucket for audio files
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('audio-files', 'audio-files', true);

-- Storage policies (execute in dashboard):
-- CREATE POLICY "Public read access" ON storage.objects
--     FOR SELECT USING (bucket_id = 'audio-files');
-- 
-- CREATE POLICY "Service role upload access" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'audio-files');
