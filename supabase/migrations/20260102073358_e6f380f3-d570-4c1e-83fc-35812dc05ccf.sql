-- Create quarterly_records table
CREATE TABLE public.quarterly_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    quarter_start_date DATE NOT NULL,
    quarter_end_date DATE NOT NULL,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id, quarter_start_date)
);

-- Create pattern categories enum
CREATE TYPE public.pattern_category AS ENUM ('growth', 'scope_change', 'sustained_impact', 'skill_development', 'leadership', 'collaboration');

-- Create quarterly_patterns table for confirmed patterns
CREATE TABLE public.quarterly_patterns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    record_id UUID NOT NULL REFERENCES public.quarterly_records(id) ON DELETE CASCADE,
    category pattern_category NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    signal_count INTEGER NOT NULL DEFAULT 0,
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pattern_evidence table for linking patterns to weekly signals
CREATE TABLE public.pattern_evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    pattern_id UUID NOT NULL REFERENCES public.quarterly_patterns(id) ON DELETE CASCADE,
    signal_id UUID NOT NULL REFERENCES public.entry_signals(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(pattern_id, signal_id)
);

-- Enable RLS on all tables
ALTER TABLE public.quarterly_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies for quarterly_records
CREATE POLICY "Users can view their own quarterly records"
ON public.quarterly_records FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quarterly records"
ON public.quarterly_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quarterly records"
ON public.quarterly_records FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quarterly records"
ON public.quarterly_records FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for quarterly_patterns
CREATE POLICY "Users can view their own patterns"
ON public.quarterly_patterns FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patterns"
ON public.quarterly_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
ON public.quarterly_patterns FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patterns"
ON public.quarterly_patterns FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for pattern_evidence
CREATE POLICY "Users can view their own pattern evidence"
ON public.pattern_evidence FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pattern evidence"
ON public.pattern_evidence FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pattern evidence"
ON public.pattern_evidence FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on quarterly_records
CREATE TRIGGER update_quarterly_records_updated_at
BEFORE UPDATE ON public.quarterly_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();