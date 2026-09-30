"""Project generation module."""
from .generate_gis_geometry import project_point

PROJECT_TYPES = ["National Highway Expansion", "Railway Corridor", "Industrial Corridor", "Irrigation Project", "Metro/Rapid Transit", "Airport Expansion", "Power Transmission Corridor", "Renewable Energy Park", "Logistics Park", "Urban Infrastructure Project"]
AGENCIES = ["National Infrastructure Development Authority", "State Works Development Corporation", "Regional Mobility Authority", "Public Assets Delivery Agency"]
STAGES = ["Land Requirement", "Parcel Identification", "Land Record Verification", "Proposal Review", "Approval Pending", "Approved", "Compensation Assessment", "Possession Pending", "Possession Completed"]

def generate_projects(states):
    projects = []
    for i in range(64):
        state = states[i % len(states)]
        district = state['districts'][i % len(state['districts'])]
        ptype = PROJECT_TYPES[i % len(PROJECT_TYPES)]
        lat, lng = project_point(state, i)
        required = round(58 + (i * 17.3) % 520, 2)
        acquired = round(required * (.28 + (i % 7) * .09), 2)
        projects.append({
          "id": f"PRJ-2026-{i+1:03d}", "name": f"{district} {ptype} {i+1:02d}", "type": ptype,
          "ministry": "Ministry of Synthetic Infrastructure", "agency": AGENCIES[i % len(AGENCIES)],
          "state": state['name'], "district": district, "requiredArea": required, "acquiredArea": min(acquired, required),
          "parcelCount": 0, "affectedFamilies": 0, "compensationAmount": 0, "stage": STAGES[i % len(STAGES)],
          "startDate": f"202{3 + i % 3}-{(i % 12)+1:02d}-15", "targetDate": f"202{7 + i % 2}-{((i+5)%12)+1:02d}-28",
          "progress": 22 + (i * 9) % 72, "authority": f"{district} District Acquisition Office", "lat": lat, "lng": lng,
          "synthetic": True
        })
    return projects
