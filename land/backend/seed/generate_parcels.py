"""Parcel, owner and land record generation module."""
from .generate_gis_geometry import parcel_polygon

NAMES = ["Ramesh Patel", "Anita Sharma", "Mahesh Verma", "Priya Shah", "Synthetic Beneficiary 001", "Kavita Nair", "Arjun Desai", "Meera Iyer", "Vikram Rao", "Nisha Kapoor"]
LAND_TYPES = ["Agricultural", "Residential", "Commercial", "Barren", "Plantation", "Industrial"]
OWNERSHIP = ["Individual", "Joint ownership", "Institutional", "Community"]
ACQ = ["Proposed", "Under verification", "Acquired", "Compensation pending", "Possession completed", "Disputed"]
RECORD = ["Verified", "Pending verification", "Requires correction", "Under dispute", "Missing document", "Historical record"]

def generate_parcels(projects, states):
    parcels, owners, records = [], {}, []
    for i in range(960):
        project = projects[i % len(projects)]
        state = next(s for s in states if s['name'] == project['state'])
        owner_name = NAMES[i % len(NAMES)] + (f" {i//len(NAMES)+1:03d}" if i >= len(NAMES) else "")
        owner_id = f"OWN-{i % 380 + 1:04d}"
        if owner_id not in owners:
            owners[owner_id] = {"id": owner_id, "name": owner_name, "ownershipType": OWNERSHIP[i % len(OWNERSHIP)], "contact": "DEMO CONTACT — 9XXXX-XXXXX", "parcelCount": 0, "caseCount": 0, "compensationStatus": "Pending", "synthetic": True}
        lat = project['lat'] + ((i % 12) - 6) * .007
        lng = project['lng'] + ((i % 9) - 4) * .008
        status = ACQ[i % len(ACQ)]
        parcel = {"id": f"{state['code']}-{project['district'][:3].upper()}-{(i%14)+1:02d}-{i+1001:05d}", "surveyNo": str(1100+i),
                  "state": project['state'], "district": project['district'], "taluka": f"{project['district']} Tehsil {(i%4)+1}",
                  "village": f"Synthetic Village {(i%24)+1}", "area": round(.38 + (i % 23)*.19, 2), "landType": LAND_TYPES[i % len(LAND_TYPES)],
                  "ownershipType": OWNERSHIP[i % len(OWNERSHIP)], "ownerId": owner_id, "owner": owners[owner_id]['name'], "projectId": project['id'],
                  "caseId": None, "acquisitionStatus": status, "compensationStatus": "Paid" if status in ["Acquired", "Possession completed"] and i%3 else "Pending",
                  "rrStatus": ["Not applicable", "Verification pending", "Assistance provided", "Relocated"][i%4], "possessionStatus": "Completed" if status == "Possession completed" else "Pending",
                  "lat": round(lat, 6), "lng": round(lng, 6), "polygon": parcel_polygon(lat, lng, i), "synthetic": True}
        parcels.append(parcel); owners[owner_id]['parcelCount'] += 1
        records.append({"id": f"LR-{state['code']}-2026-{i+4821:06d}", "parcelId": parcel['id'], "surveyNo": parcel['surveyNo'], "village": parcel['village'], "district": parcel['district'], "area": parcel['area'], "landType": parcel['landType'], "ownership": parcel['ownershipType'], "status": RECORD[i%len(RECORD)], "synthetic": True})
    return parcels, list(owners.values()), records
