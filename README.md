# NYC Multifamily Building Cost Estimator

Required structure:

```text
.
├── index.html
├── style.css
├── script.js
└── data/
    └── estimator_curve.json
```

Generate `data/estimator_curve.json` from the R analysis pipeline.

The estimator uses a smooth log-log model of price per residential unit versus
building size. Separate curves are generated for Bronx, Brooklyn, Manhattan,
Queens, plus an all-borough fallback.

For each integer unit count from 5 through 100, the exported JSON contains:

- predicted price per unit
- 25th percentile price-per-unit range
- 75th percentile price-per-unit range
- nearby comparable-sales count

The website multiplies those smooth price-per-unit estimates by the requested
unit count, so per-buyer costs now change continuously when buyers are locked
to units.

## Local preview

From this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

1. Create a GitHub repository.
2. Upload these files plus `data/estimator_curve.json`.
3. Go to Settings → Pages.
4. Choose Deploy from a branch.
5. Select `main` and `/ (root)`.
6. Save.
