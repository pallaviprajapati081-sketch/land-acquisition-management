"""Notification generator tied to seeded cases."""
MESSAGES = ["New acquisition proposal assigned", "Approval pending", "Compensation assessment completed", "Case overdue", "Possession milestone approaching", "R&R verification pending"]
def generate_notifications(cases):
    return [{"id": f"NOT-2026-{i+1:04d}", "caseId": c['id'], "message": f"{MESSAGES[i%len(MESSAGES)]} for Case {c['id']}", "severity": "critical" if c['overdueDays'] else ("warning" if c['issue'] else "info"), "read": i%3==0, "date": f"2026-09-{(i%28)+1:02d}", "synthetic": True} for i,c in enumerate(cases[:180])]
