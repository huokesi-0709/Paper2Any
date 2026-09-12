-- Keep the owner role explicit and available to future management endpoints.
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

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates a profile, assigns the FigureMind owner admin role, and grants regular users five signup points exactly once.';
