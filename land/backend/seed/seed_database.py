"""NLAMS demo seed orchestrator. Run with: python3 backend/seed/seed_database.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from backend.seed.generate_projects import generate_projects
from backend.seed.generate_parcels import generate_parcels
from backend.seed.generate_cases import generate_cases
from backend.seed.generate_compensation import generate_compensation
from backend.seed.generate_documents import generate_documents
from backend.seed.generate_notifications import generate_notifications
from backend.seed.generate_audit import generate_audit

STATES = [
 ("Gujarat","GJ",23.02,72.57,["Ahmedabad","Surat","Vadodara"]),("Maharashtra","MH",19.07,72.88,["Pune","Nashik","Nagpur"]),("Rajasthan","RJ",26.91,75.79,["Jaipur","Udaipur","Kota"]),("Karnataka","KA",12.97,77.59,["Bengaluru","Mysuru","Hubballi"]),("Tamil Nadu","TN",13.08,80.27,["Chennai","Coimbatore","Madurai"]),("Uttar Pradesh","UP",26.85,80.95,["Lucknow","Kanpur","Varanasi"]),("Madhya Pradesh","MP",23.26,77.41,["Bhopal","Indore","Jabalpur"]),("Delhi","DL",28.61,77.21,["New Delhi","North Delhi","Dwarka"]),("Assam","AS",26.14,91.74,["Guwahati","Dibrugarh","Jorhat"]),("Arunachal Pradesh","AR",27.10,93.62,["Itanagar","Tawang","Pasighat"]),("Sikkim","SK",27.33,88.61,["Gangtok","Namchi","Gyalshing"]),("West Bengal","WB",22.57,88.36,["Kolkata","Howrah","Siliguri"]),("Telangana","TS",17.38,78.48,["Hyderabad","Warangal","Nizamabad"]),("Andhra Pradesh","AP",16.50,80.64,["Vijayawada","Visakhapatnam","Tirupati"]),("Kerala","KL",9.93,76.26,["Kochi","Thiruvananthapuram","Kozhikode"]),("Odisha","OD",20.30,85.82,["Bhubaneswar","Cuttack","Sambalpur"])]

def main():
    states = [{"name":n,"code":c,"lat":lat,"lng":lng,"districts":d,"synthetic":True} for n,c,lat,lng,d in STATES]
    projects = generate_projects(states); parcels, owners, records = generate_parcels(projects, states)
    cases = generate_cases(projects, parcels, owners); compensation, families = generate_compensation(cases, parcels)
    for p in projects:
        pp = [x for x in parcels if x['projectId']==p['id']]; p['parcelCount']=len(pp); p['affectedFamilies']=len([f for f in families if f['projectId']==p['id']]); p['compensationAmount']=round(sum(x['awardAmount'] for x in compensation if x['caseId'] in {q['id'] for q in cases if q['projectId']==p['id']}),2)
    data={"meta":{"title":"NLAMS Synthetic Demonstration Dataset","generatedAt":"2026-09-30T10:00:00Z","synthetic":True,"disclaimer":"Synthetic GIS / Demonstration Data — Not for Legal or Administrative Use"},"states":states,"projects":projects,"parcels":parcels,"owners":owners,"landRecords":records,"cases":cases,"compensation":compensation,"families":families,"documents":generate_documents(cases),"notifications":generate_notifications(cases),"audits":generate_audit(cases)}
    output=os.path.join(os.path.dirname(os.path.dirname(__file__)),"data","demo_data.json")
    with open(output,"w") as f: json.dump(data,f,separators=(",",":"))
    print(f"Seed complete: {len(projects)} projects, {len(parcels)} parcels, {len(cases)} cases, {len(compensation)} compensation records.")
if __name__ == "__main__": main()
