# ListingForge

A lightweight browser-based product listing builder. Create structured product listings, preview them live, save them locally, import data, and export to several portable formats.

## Current features

- Product editor for core catalog fields
- Pricing, currency, inventory, SKU, brand, category, tags, description
- Product image URL preview
- Variants and arbitrary custom fields
- Multiple saved listings using browser localStorage
- Duplicate and delete listings
- JSON, CSV, XML, YAML, Markdown, and HTML export
- JSON/CSV import
- Print dialog for PDF output
- Responsive layout
- No backend required for the current MVP

## Run locally

Because this is a static application, you can serve the repository with any static HTTP server. For example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Roadmap

The current version intentionally keeps the data model client-side. A later production version can add authentication, a persistent database, image storage, XLSX/PDF generation, catalog templates, bulk import/export, and integrations with commerce platforms.
