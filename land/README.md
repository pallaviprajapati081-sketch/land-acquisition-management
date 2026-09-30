# NLAMS · SIH26016

National Land Acquisition & Management System is a local, synthetic-data demonstration for Smart India Hackathon 2026. It is not connected to government records, payments, identity providers, cadastral services, or citizen systems.

## Run locally

Requirements: Node.js 18+ and Python 3.10+ (only required to regenerate the seed dataset).

```powershell
npm install
npm run seed
npm start
```

Open [http://localhost:4173](http://localhost:4173). `npm install` is included for a familiar setup flow; the current application has no third-party npm dependencies. Set the `PORT` environment variable to change the local server port.

If Python is installed as `py` rather than `python`, run `py backend/seed/seed_database.py` to regenerate the demo dataset.

## Demo access

Select a persona on the sign-in screen. Each listed demo account uses password `demo123`. The role selector is for presentation only; it does not provide server-side authentication or authorization.

The seeded dataset contains 64 synthetic infrastructure projects, 960 parcels, workflow cases, compensation records, affected-family records, documents, notifications, and audit events across 16 synthetic state jurisdictions. It can be regenerated with `npm run seed`.

## Included modules

- National command centre and operational analytics
- Projects and detail pages, parcel registry, acquisition cases, and GIS reference view
- Compensation and R&R registers, documents, and workflow overview
- Browser-local field verification submissions and demo user administration
- Alerts, rule-based project risk scoring, CSV reports, audit history, and an architecture explainer
- Global search across project, parcel, and document records

Field submissions and administration changes are stored in the browser's local storage. Report CSV export and print use the current client-side dataset.

## Current architecture and limitations

The supplied project is a dependency-free JavaScript SPA served by a small Node.js HTTP server. Demo data is a generated JSON file at `backend/data/demo_data.json`. The prototype does **not** implement the proposed React/TypeScript, FastAPI, PostgreSQL, SQLAlchemy, JWT, password hashing, secure document upload, or production role-based access control stack. Browser-local forms do not persist to the JSON API. Do not deploy this prototype with real land, beneficiary, identity, payment, or government records.

All identifiers, owners, project records, geometries, statuses, and financial information displayed by this prototype are fictional demonstration data and must not be treated as authoritative.