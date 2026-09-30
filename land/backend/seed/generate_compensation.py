"""Compensation and rehabilitation & resettlement records."""
def generate_compensation(cases, parcels):
    lookup = {p['id']: p for p in parcels}; compensation=[]; families=[]
    for i, case in enumerate(cases):
        for j, parcel_id in enumerate(case['parcelIds']):
            p = lookup[parcel_id]; assessment = round(p['area'] * 1850000 + (i%9)*78000, 2)
            paid = (i+j) % 4 == 0 or case['stage'] in ["Payment Completed", "Possession Completed", "Closed"]
            compensation.append({"id": f"CMP-2026-{len(compensation)+1:05d}", "caseId": case['id'], "parcelId": p['id'], "beneficiaryId": p['ownerId'], "beneficiary": p['owner'], "assessmentAmount": assessment, "approvedAmount": round(assessment*.97,2), "awardAmount": round(assessment*.95,2), "paymentStatus": "Paid" if paid else "Pending", "paymentReference": "DEMO PAYMENT REFERENCE", "paymentDate": f"2026-{(i%9)+1:02d}-18" if paid else None, "pendingAmount": 0 if paid else round(assessment*.95,2), "disputeStatus": "Under dispute" if case['issue']=="Compensation dispute" else "None", "synthetic": True})
        if i % 2 == 0:
            statuses = ["Eligible", "Verification pending", "Entitlement approved", "Assistance pending", "Assistance provided", "Relocation pending", "Relocated", "Completed"]
            families.append({"id": f"RR-2026-{len(families)+1:04d}", "caseId": case['id'], "projectId": case['projectId'], "familyName": f"Synthetic Affected Family {len(families)+1:03d}", "members": 2+i%6, "status": statuses[i%len(statuses)], "synthetic": True})
    return compensation, families
