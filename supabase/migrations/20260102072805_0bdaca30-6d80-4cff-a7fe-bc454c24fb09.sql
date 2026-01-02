-- Create enum for signal flags
CREATE TYPE public.signal_flag AS ENUM ('delivery', 'ownership', 'influence', 'learning');

-- Create weekly_reflections table
CREATE TABLE public.weekly_reflections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id, week_start_date)
);

-- Create entry_signals table for flagging entries with signal types
CREATE TABLE public.entry_signals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    reflection_id UUID NOT NULL REFERENCES public.weekly_reflections(id) ON DELETE CASCADE,
    signal_flag signal_flag NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entry_id, signal_flag)
);

-- Enable RLS on both tables
ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_reflections
CREATE POLICY "Users can view their own weekly reflections"
ON public.weekly_reflections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly reflections"
ON public.weekly_reflections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly reflections"
ON public.weekly_reflections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly reflections"
ON public.weekly_reflections
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for entry_signals
CREATE POLICY "Users can view their own entry signals"
ON public.entry_signals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entry signals"
ON public.entry_signals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entry signals"
ON public.entry_signals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entry signals"
ON public.entry_signals
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on weekly_reflections
CREATE TRIGGER update_weekly_reflections_updated_at
BEFORE UPDATE ON public.weekly_reflections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();