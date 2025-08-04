-- profiles 테이블 생성
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  website text,
  updated_at timestamp with time zone
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 프로필을 읽을 수 있도록 정책 생성
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- 인증된 사용자가 자신의 프로필을 업데이트할 수 있도록 정책 생성
CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 새로운 사용자가 가입할 때 profiles 테이블에 자동으로 레코드를 삽입하는 함수 및 트리거
-- 이 함수는 auth.users 테이블에 새 사용자가 삽입될 때마다 호출됩니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email); -- 또는 NEW.raw_user_meta_data->>'full_name' 등
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 새 사용자가 삽입될 때 handle_new_user 함수를 실행하는 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 기존 사용자에게도 프로필을 생성하려면 다음을 수동으로 실행할 수 있습니다.
-- INSERT INTO public.profiles (id, username)
-- SELECT id, email FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
