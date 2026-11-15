import pandas as pd
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

modis_path = PROCESSED_DATA_DIR / "modis_ready.csv"
viirs_path = PROCESSED_DATA_DIR / "viirs_ready.csv"

print("1. Loading cleaned CSV files...")
modis = pd.read_csv(modis_path, low_memory=False)
viirs = pd.read_csv(viirs_path, low_memory=False)

print("2. Combining datasets...")
# Combine both into a single DataFrame
combined = pd.concat([modis, viirs], ignore_index=True)

print("3. Creating a spatial grid for deduplication...")
# Rounding coordinates to 2 decimal places creates roughly a 1.1km x 1.1km grid cell
combined['grid_lat'] = combined['latitude'].round(2)
combined['grid_lon'] = combined['longitude'].round(2)

print("4. Removing duplicate detections...")
# Sort by FRP descending so we keep the strongest detection for the grid cell
combined = combined.sort_values('frp', ascending=False)

# Drop duplicates that happen in the same grid cell, on the same date, during the same day/night cycle
harmonized = combined.drop_duplicates(subset=['acq_date', 'daynight', 'grid_lat', 'grid_lon'])

print("5. Cleaning up temporary grid columns...")
harmonized = harmonized.drop(columns=['grid_lat', 'grid_lon'])

print("6. Saving final harmonized dataset...")
harmonized.to_csv(PROCESSED_DATA_DIR / "harmonized_fires.csv", index=False)

print("\n=== HARMONIZATION COMPLETE ===")
print(f"Total rows before harmonization: {len(combined)}")
print(f"Total rows after harmonization: {len(harmonized)}")
print(f"Duplicates removed: {len(combined) - len(harmonized)}")