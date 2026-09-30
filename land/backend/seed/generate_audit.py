"""Audit sequence generator aligned with workflow cases."""
EVENTS = [("Field Officer", "Parcel verification submitted"), ("District Officer", "Verification approved"), ("State Officer", "Acquisition proposal approved"), ("System", "Notification generated")]
def generate_audit(cases):
    return [{"id": f"AUD-{i:05d}-{j}", "caseId": c['id'], "date": f"2026-09-{(i+j)%27+1:02d}", "actor": actor, "event": event, "synthetic": True} for i,c in enumerate(cases) for j,(actor,event) in enumerate(EVENTS)]
