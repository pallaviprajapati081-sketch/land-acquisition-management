"""Synthetic document metadata generator."""
TYPES = ["Land Record", "Survey Report", "Ownership Document", "Acquisition Proposal", "Notification", "Objection Record", "Compensation Assessment", "Award", "R&R Document", "Possession Certificate", "Approval Document"]
def generate_documents(cases):
    return [{"id": f"DOC-2026-{i+1:05d}", "caseId": c['id'], "type": TYPES[i%len(TYPES)], "title": f"{TYPES[i%len(TYPES)]} — {c['id']}", "uploadedOn": f"2026-{(i%9)+1:02d}-{(i%25)+1:02d}", "status": "Verified" if i%4 else "Pending review", "watermark": "SYNTHETIC DEMONSTRATION DOCUMENT", "downloadUrl": "/api/documents/placeholder", "synthetic": True} for i,c in enumerate(cases)]
