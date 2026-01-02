-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create roles table (career roles/positions, NOT security roles)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT '#f59e0b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Roles policies
CREATE POLICY "Users can view their own roles"
  ON public.roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roles"
  ON public.roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON public.roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles"
  ON public.roles FOR DELETE
  USING (auth.uid() = user_id);

-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  accomplishments TEXT,
  decisions TEXT,
  challenges TEXT,
  learnings TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, entry_date)
);

-- Enable RLS on journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Journal entries policies
CREATE POLICY "Users can view their own entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create proof links table
CREATE TABLE public.proof_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('github', 'jira', 'confluence', 'slack', 'other')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on proof_links
ALTER TABLE public.proof_links ENABLE ROW LEVEL SECURITY;

-- Proof links policies
CREATE POLICY "Users can view their own proof links"
  ON public.proof_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proof links"
  ON public.proof_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proof links"
  ON public.proof_links FOR DELETE
  USING (auth.uid() = user_id);

-- Create entry images table (stores URLs, not actual images)
CREATE TABLE public.entry_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on entry_images
ALTER TABLE public.entry_images ENABLE ROW LEVEL SECURITY;

-- Entry images policies
CREATE POLICY "Users can view their own entry images"
  ON public.entry_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entry images"
  ON public.entry_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entry images"
  ON public.entry_images FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();