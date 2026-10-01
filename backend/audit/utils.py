from .models import AuditLog


def create_audit_log(
    user,
    action,
    entity,
    entity_id=None,
    details=None,
    ip_address=None,
):
    return AuditLog.objects.create(
        user=user,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details or {},
        ip_address=ip_address,
    )