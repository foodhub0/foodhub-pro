-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança para o bucket product-images

-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permitir leitura pública (para que o cardápio possa ser visualizado)
CREATE POLICY "Imagens são publicamente acessíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir atualização para usuários autenticados (donos)
CREATE POLICY "Usuários podem atualizar suas próprias imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);

-- Permitir deleção para usuários autenticados (donos)
CREATE POLICY "Usuários podem deletar suas próprias imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);
