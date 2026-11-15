import pandas as pd
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
file_path = PROCESSED_DATA_DIR / "harmonized_fires.csv"

print("1. Loading harmonized dataset...")
df = pd.read_csv(file_path, low_memory=False)

print("2. Formatting the instrument column...")
# Combine them into the format: Instrument (Satellite)
df['instrument'] = df['instrument'].astype(str) + " (" + df['satellite'].astype(str) + ")"

print("3. Dropping the original satellite column...")
df = df.drop(columns=['satellite'])

print("4. Saving updated dataset...")
# Overwriting the existing harmonized file with the new format
df.to_csv(file_path, index=False)

print("✅ Columns merged successfully!")