-- 创建笔记图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- 设置存储策略：允许认证用户上传
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 设置存储策略：允许所有人查看
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'note-images');

-- 设置存储策略：允许用户删除自己的图片
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'note-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
