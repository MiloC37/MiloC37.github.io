# NYC Multifamily Building Cost Estimator

Required structure:

```text
.
├── index.html
├── style.css
├── script.js
└── data/
    └── estimator_data.json
```

Generate `data/estimator_data.json` from the R analysis pipeline.

## Local preview

From this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload these files plus `data/estimator_data.json`.
3. Go to Settings → Pages.
4. Choose Deploy from a branch.
5. Select `main` and `/ (root)`.
6. Save.
