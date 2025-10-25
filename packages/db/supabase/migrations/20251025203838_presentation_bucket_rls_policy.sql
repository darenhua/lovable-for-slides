-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to upload files to the presentation bucket
CREATE POLICY "Allow public uploads to presentation bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'presentation');

-- Allow anyone to view/download files from the presentation bucket
CREATE POLICY "Allow public reads from presentation bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'presentation');

-- Allow anyone to delete files from the presentation bucket
CREATE POLICY "Allow public deletes from presentation bucket"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'presentation');

-- Allow anyone to update files in the presentation bucket
CREATE POLICY "Allow public updates to presentation bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'presentation')
WITH CHECK (bucket_id = 'presentation');
