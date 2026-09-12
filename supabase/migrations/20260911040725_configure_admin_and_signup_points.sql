-- FigureMind account policy:
-- - 1533305864@qq.com is a billing-exempt administrator.
-- - every regular account receives five signup points exactly once.

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
    jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{billing_exempt}',
        'true'::jsonb,
        true
    ),
    '{figuremind_role}',
    '"admin"'::jsonb,
    true
)
WHERE lower(COALESCE(email, '')) = '1533305864@qq.com';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    IF lower(COALESCE(NEW.email, '')) = '1533305864@qq.com' THEN
        UPDATE auth.users
        SET raw_app_meta_data = jsonb_set(
            jsonb_set(
                COALESCE(raw_app_meta_data, '{}'::jsonb),
                '{billing_exempt}',
                'true'::jsonb,
                true
            ),
            '{figuremind_role}',
            '"admin"'::jsonb,
            true
        )
        WHERE id = NEW.id;
    ELSIF COALESCE(NEW.raw_app_meta_data ->> 'billing_exempt', 'false') <> 'true' THEN
        INSERT INTO public.points_ledger (user_id, points, reason, event_key)
        VALUES (NEW.id, 5, 'signup_bonus', 'signup_bonus_' || NEW.id::text)
        ON CONFLICT (event_key) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Make the migration safe for accounts created before this policy was applied.
INSERT INTO public.profiles (user_id)
SELECT id
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.points_ledger (user_id, points, reason, event_key)
SELECT
    id,
    5,
    'signup_bonus',
    'signup_bonus_' || id::text
FROM auth.users
WHERE lower(COALESCE(email, '')) <> '1533305864@qq.com'
  AND COALESCE(raw_app_meta_data ->> 'billing_exempt', 'false') <> 'true'
ON CONFLICT (event_key) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates a profile, marks the FigureMind owner as billing-exempt, and grants regular users five signup points exactly once.';
