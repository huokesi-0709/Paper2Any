from fastapi_app.dependencies.auth import AuthUser
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
