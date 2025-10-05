-- Adiciona a coluna user_id para vincular cada tipo de quarto a um usuário.
ALTER TABLE public.room_types
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Preenche o user_id para os tipos de quarto existentes com o ID do primeiro usuário (ajuste se necessário).
-- Esta é uma medida paliativa. O ideal é associar manualmente os quartos já criados.
UPDATE public.room_types
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Garante que a coluna user_id não possa ser nula para novos quartos.
ALTER TABLE public.room_types
ALTER COLUMN user_id SET NOT NULL;

-- Habilita a Segurança a Nível de Linha (RLS) para proteger os dados.
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas, se existirem.
DROP POLICY IF EXISTS "Users can manage their own room types" ON public.room_types;
DROP POLICY IF EXISTS "Users can view their own room types" ON public.room_types;

-- Cria uma nova política que permite que os usuários gerenciem APENAS os seus próprios tipos de quarto.
CREATE POLICY "Users can manage their own room types"
ON public.room_types FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);