from fastapi_app.dependencies.auth import AuthUser
from fastapi_app.config.pricing import get_pricing_config
from fastapi_app.services.billing_service import BillingService, UNLIMITED_QUOTA


def _billing_exempt_user() -> AuthUser:
    return AuthUser(
        user_id="admin-user",
        email="admin@example.com",
        phone=None,
        app_metadata={"billing_exempt": True},
    )


def test_auth_user_only_accepts_explicit_billing_exempt_boolean() -> None:
    assert _billing_exempt_user().is_billing_exempt is True
    assert AuthUser("user", None, None, app_metadata={"billing_exempt": "true"}).is_billing_exempt is False
    assert AuthUser("user", None, None).is_billing_exempt is False


def test_configured_owner_email_is_an_administrator_without_metadata() -> None:
    user = AuthUser("owner", " 1533305864@QQ.COM ", None)

    assert user.is_admin is True
    assert user.is_billing_exempt is True


def test_trusted_app_metadata_can_assign_admin_role() -> None:
    user = AuthUser(
        "delegated-admin",
        "delegated@example.com",
        None,
        app_metadata={"figuremind_role": "admin"},
    )

    assert user.is_admin is True
    assert user.is_billing_exempt is True


def test_signup_policy_is_five_points_once_without_daily_refill() -> None:
    billing = get_pricing_config()["billing"]

    assert billing["signup_bonus_points"] == 5
    assert billing["daily_grant_points"] == 0
    assert billing["daily_grant_balance_cap"] == 0


def test_signup_bonus_is_idempotent_for_regular_users(monkeypatch) -> None:
    service = BillingService()
    user = AuthUser("regular-user", "regular@example.com", None)
    existing_events = set()
    inserted = []

    monkeypatch.setattr(service, "_billing_config", lambda: {"signup_bonus_points": 5})
    monkeypatch.setattr(
        service,
        "_select_first",
        lambda _table, _columns, **filters: (
            {"id": 1} if filters.get("event_key") in existing_events else None
        ),
    )

    def append_ledger(**payload) -> None:
        inserted.append(payload)
        existing_events.add(payload["event_key"])

    monkeypatch.setattr(service, "_append_ledger", append_ledger)

    service._ensure_signup_bonus(user)
    service._ensure_signup_bonus(user)

    assert inserted == [
        {
            "user_id": "regular-user",
            "points": 5,
            "reason": "signup_bonus",
            "event_key": "signup_bonus_regular-user",
        }
    ]


def test_administrator_does_not_receive_signup_ledger_entry(monkeypatch) -> None:
    service = BillingService()
    admin = AuthUser("owner", "1533305864@qq.com", None)
    monkeypatch.setattr(
        service,
        "_select_first",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("ledger lookup should not run")),
    )
    monkeypatch.setattr(
        service,
        "_append_ledger",
        lambda **_kwargs: (_ for _ in ()).throw(AssertionError("ledger write should not run")),
    )

    service._ensure_signup_bonus(admin)


def test_billing_exempt_user_has_unlimited_quota_without_balance_lookup(monkeypatch) -> None:
    service = BillingService()
    monkeypatch.setattr(service, "_bootstrap_user", lambda _user: None)
    monkeypatch.setattr(
        service,
        "_get_balance",
        lambda _user_id: (_ for _ in ()).throw(AssertionError("balance lookup should not run")),
    )

    quota = service._quota_from_user(_billing_exempt_user())

    assert quota["remaining"] == UNLIMITED_QUOTA
    assert quota["is_authenticated"] is True
    assert quota["is_unlimited"] is True
    assert quota["billing_exempt"] is True
    assert quota["is_admin"] is False


def test_billing_exempt_workflow_never_writes_deduction(monkeypatch) -> None:
    service = BillingService()
    monkeypatch.setattr(service, "_auth_enabled", lambda: True)
    monkeypatch.setattr(
        service,
        "_append_ledger",
        lambda **_kwargs: (_ for _ in ()).throw(AssertionError("ledger deduction should not run")),
    )

    result = service.consume_workflow(
        workflow_type="image2drawio",
        user=_billing_exempt_user(),
        guest_id=None,
    )

    assert result["success"] is True
    assert result["amount"] == 0
    assert result["remaining"] == UNLIMITED_QUOTA
    assert result["is_unlimited"] is True
    assert result["billing_exempt"] is True
    assert result["is_admin"] is False
