# HomePath Site Scout

Lane 1 — Find it MVP for Orange County parcel research.

The app reads the public OC Survey Legal Lots Attributes layer at runtime:

- Parcel/APN, site address, city and ZIP
- `Shape__Area` for square feet and calculated acres
- `ZC_DETAIL`, `ZCLASS`, `ZC_DESCR`, and `CAT_DIST` for a first-pass zoning signal
- returned parcel geometry bounds for the detail view

The Met / Conflict / Unknown label is a triage signal only. It does not replace a jurisdiction zoning determination, title report, survey, environmental review, or legal advice.

The integration build copies this static app to `/tools/homepath/`. The APN in the URL hash keeps a detail view directly addressable and refreshable. The detail view supports side-by-side comparison and a print-friendly due diligence report.

Source endpoints:

- https://www.ocgis.com/survey/rest/services/WebApps/ParcelFeatures/FeatureServer/0
- https://www.ocgis.com/survey/rest/services/WebApps/Map_Layers_Associated_Documents/MapServer/9
