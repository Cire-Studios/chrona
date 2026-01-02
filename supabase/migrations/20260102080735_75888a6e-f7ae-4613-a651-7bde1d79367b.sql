-- Create storage bucket for entry images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('entry-images', 'entry-images', true, 5242880);

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own entry images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'entry-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own images
CREATE POLICY "Users can view their own entry images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'entry-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to entry images (since bucket is public)
CREATE POLICY "Anyone can view entry images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'entry-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own entry images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'entry-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);