import os
from pathlib import Path
import pandas as pd

# Set up project base directory dynamically
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"

print("1. Loading CSV files (this might take a minute)...")

# Read the satellite datasets
modis = pd.read_csv(RAW_DATA_DIR / "modis.csv", low_memory=False)
viirs = pd.read_csv(RAW_DATA_DIR / "viirs.csv", low_memory=False)

# Display the first 5 records
print("MODIS DATA")
print(modis.head())

print("\nVIIRS DATA")
print(viirs.head())

# Display column names
print("\nMODIS COLUMNS:")
print(modis.columns.tolist())

print("\nVIIRS COLUMNS:")
print(viirs.columns.tolist())

# Check dataset sizes
print("\nMODIS SHAPE:", modis.shape)
print("VIIRS SHAPE:", viirs.shape)

# Check missing values
print("\nMODIS MISSING VALUES:")
print(modis.isnull().sum())

print("\nVIIRS MISSING VALUES:")
print(viirs.isnull().sum())