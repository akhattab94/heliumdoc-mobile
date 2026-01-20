# CMS Provider Data Catalog API

## Overview
The CMS (Centers for Medicare & Medicaid Services) Provider Data Catalog provides **free, open access** to healthcare provider data in the United States. This is US government public data - no API key required.

## Available Datasets for Doctors and Clinicians

| Dataset | Description | Use Case |
|---------|-------------|----------|
| **National Downloadable File** | Complete list of doctors/clinicians with enrollment records, groups, addresses | Doctor directory, search |
| **Facility Affiliation Data** | Which facilities doctors are affiliated with | Hospital connections |
| **Utilization Data** | Procedure volumes for clinicians | Experience metrics |
| **MIPS Performance Data** | Quality scores, patient experience | Doctor ratings |
| **Patient Experience (CAHPS)** | Patient satisfaction surveys | Reviews/ratings |

## API Access

Base URL: `https://data.cms.gov/provider-data/api/1/`

### Example Endpoints

**Get Dataset Metadata:**
```
GET /provider-data/api/1/metastore/schemas/dataset/items/27ea-46a8
```

**Query Datastore (SQL-like):**
```
GET /provider-data/api/1/datastore/sql?query=[SQL_QUERY]
```

### Key Fields Available
- NPI (National Provider Identifier)
- Provider name
- Specialty
- Address, city, state, zip
- Phone number
- Facility affiliations
- Medicare participation status
- Quality scores

## Relevance to HeliumDoc

**Pros:**
- Free, no API key needed
- Official government data
- Comprehensive US doctor database
- Quality metrics included

**Cons:**
- US-only data (not Qatar/GCC)
- Medicare providers only
- No real-time availability/booking

## Potential Use
Could be used as a reference for:
1. Building a similar data structure for Qatar doctors
2. Understanding what data points to collect
3. Benchmarking quality metrics approach
