"""Acquisition case workflow generator covering every stage and scenario."""
STAGES = ["Project Created", "Land Requirement", "Parcel Identification", "Land Record Verification", "Field Verification", "Proposal Submitted", "Proposal Review", "Approval Pending", "Approved", "Notification", "Objection Period", "Compensation Assessment", "Award", "Payment Pending", "Payment Completed", "R&R", "Possession Pending", "Possession Completed", "Closed"]
ISSUES = [None, "Pending approval", "Missing documents", "Delayed verification", "Compensation dispute", "Ownership dispute", "Multiple owners", "R&R pending", "Payment pending", "Possession pending", "SLA breached", "GIS mismatch", "Data correction required"]
SCENARIOS = ["A — Normal Acquisition", "B — Delayed Acquisition", "C — Compensation Dispute", "D — R&R Case", "E — GIS Verification"]

def generate_cases(projects, parcels, owners):
    cases = []
    by_project = {}
    for parcel in parcels: by_project.setdefault(parcel['projectId'], []).append(parcel)
    for i in range(320):
        project = projects[i % len(projects)]
        linked = by_project[project['id']][(i * 3) % len(by_project[project['id']]):][:3]
        if not linked: linked = by_project[project['id']][:1]
        case = {"id": f"LA-2026-{i+1:05d}", "projectId": project['id'], "project": project['name'], "state": project['state'], "district": project['district'], "stage": STAGES[i % len(STAGES)], "scenario": SCENARIOS[i % 5], "issue": ISSUES[i % len(ISSUES)], "createdAt": f"2026-{(i%9)+1:02d}-{(i%26)+1:02d}", "slaDays": 30 + i%31, "overdueDays": (i%19) if i%11 == 1 else 0, "parcelIds": [p['id'] for p in linked], "synthetic": True}
        cases.append(case)
        for p in linked:
            if p['caseId'] is None: p['caseId'] = case['id']
            # keep owners case counts internally consistent
            for owner in owners:
                if owner['id'] == p['ownerId']: owner['caseCount'] += 1; break
    return cases
