-- Create resumes table
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  public_slug TEXT UNIQUE,
  contact_name TEXT,
  contact_email TEXT,
  contact_linkedin TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_roles table (which roles are included in a resume)
CREATE TABLE public.resume_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  include_company BOOLEAN NOT NULL DEFAULT true,
  include_dates BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resume_id, role_id)
);

-- Create resume_bullets table (generated bullet points per role)
CREATE TABLE public.resume_bullets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  bullet_text TEXT NOT NULL,
  source_pattern_id UUID REFERENCES public.quarterly_patterns(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_proofs table (approved proofs for public sharing)
CREATE TABLE public.resume_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  proof_link_id UUID REFERENCES public.proof_links(id) ON DELETE CASCADE,
  entry_image_id UUID REFERENCES public.entry_images(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  display_context TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT proof_type_check CHECK (proof_link_id IS NOT NULL OR entry_image_id IS NOT NULL)
);

-- Enable RLS on all tables
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_bullets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_proofs ENABLE ROW LEVEL SECURITY;

-- RLS policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public resumes are viewable by anyone" ON public.resumes
  FOR SELECT USING (is_public = true);

-- RLS policies for resume_roles
CREATE POLICY "Users can view their own resume roles" ON public.resume_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume roles" ON public.resume_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume roles" ON public.resume_roles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume roles" ON public.resume_roles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public resume roles are viewable" ON public.resume_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.resumes 
      WHERE resumes.id = resume_roles.resume_id 
      AND resumes.is_public = true
    )
  );

-- RLS policies for resume_bullets
CREATE POLICY "Users can view their own resume bullets" ON public.resume_bullets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume bullets" ON public.resume_bullets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume bullets" ON public.resume_bullets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume bullets" ON public.resume_bullets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public resume bullets are viewable" ON public.resume_bullets
  FOR SELECT USING (
    is_visible = true AND EXISTS (
      SELECT 1 FROM public.resumes 
      WHERE resumes.id = resume_bullets.resume_id 
      AND resumes.is_public = true
    )
  );

-- RLS policies for resume_proofs
CREATE POLICY "Users can view their own resume proofs" ON public.resume_proofs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume proofs" ON public.resume_proofs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume proofs" ON public.resume_proofs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume proofs" ON public.resume_proofs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public approved resume proofs are viewable" ON public.resume_proofs
  FOR SELECT USING (
    is_approved = true AND EXISTS (
      SELECT 1 FROM public.resumes 
      WHERE resumes.id = resume_proofs.resume_id 
      AND resumes.is_public = true
    )
  );

-- Trigger for updated_at on resumes
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();