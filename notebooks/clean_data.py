import pandas as pd
from pathlib import Path

# Setup paths (adjust these if your files are in a different folder)
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

modis_path = RAW_DATA_DIR / "modis.csv"
viirs_path = RAW_DATA_DIR / "viirs.csv"

print("1. Loading raw CSV files...")
modis = pd.read_csv(modis_path, low_memory=False)
viirs = pd.read_csv(viirs_path, low_memory=False)

print("2. Preserving Near Real-Time (NRT) rows by filling unclassified 'type' with -1...")
# Archive data has classified types (0=vegetation, etc.), while NRT has missing types.
# We fill with -1 so recent data (Aug-Nov 2026) is preserved.
modis['type'] = modis['type'].fillna(-1)
viirs['type'] = viirs['type'].fillna(-1)
modis_clean = modis.copy()
viirs_clean = viirs.copy()

print("3. Standardizing the Confidence column (adding 'confidence_cat')...")
# Translating MODIS to match VIIRS (l, n, h) without deleting the original column
def categorize_modis_confidence(val):
    if val >= 80:
        return 'h'
    elif val >= 30:
        return 'n'
    else:
        return 'l'

modis_clean['confidence_cat'] = modis_clean['confidence'].apply(categorize_modis_confidence)
viirs_clean['confidence_cat'] = viirs_clean['confidence']

print("4. Removing ONLY 'version' and 'bright_t31'...")
columns_to_drop = ['version', 'bright_t31']
modis_final = modis_clean.drop(columns=columns_to_drop)
viirs_final = viirs_clean.drop(columns=columns_to_drop)

print("5. Saving cleaned datasets...")
modis_final.to_csv(PROCESSED_DATA_DIR / "modis_ready.csv", index=False)
viirs_final.to_csv(PROCESSED_DATA_DIR / "viirs_ready.csv", index=False)

print("\n=== CLEANING COMPLETE ===")
print(f"MODIS rows remaining: {len(modis_final)}")
print(f"VIIRS rows remaining: {len(viirs_final)}")