"""
Script to convert harmonized_fires.csv to an indexed SQLite database for instant querying by (acq_date, daynight).
"""
from pathlib import Path
import sqlite3
import pandas as pd
import time

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "data" / "processed" / "harmonized_fires.csv"
DB_PATH = BASE_DIR / "data" / "processed" / "fires.db"

def build_db():
    print(f"Reading CSV from {CSV_PATH} and indexing into {DB_PATH}...")
    start_time = time.time()
    
    if DB_PATH.exists():
        DB_PATH.unlink()
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create table schema
    cursor.execute("""
    CREATE TABLE fires (
        latitude REAL,
        longitude REAL,
        brightness REAL,
        scan REAL,
        track REAL,
        acq_date TEXT,
        acq_time INTEGER,
        instrument TEXT,
        confidence TEXT,
        frp REAL,
        daynight TEXT,
        type REAL,
        confidence_cat TEXT
    )
    """)
    conn.commit()
    
    chunksize = 200_000
    total_rows = 0
    for chunk in pd.read_csv(CSV_PATH, chunksize=chunksize, low_memory=False):
        chunk.to_sql('fires', conn, if_exists='append', index=False)
        total_rows += len(chunk)
        print(f"Inserted {total_rows} rows...")
        
    print("Creating index on (acq_date, daynight)...")
    cursor.execute("CREATE INDEX idx_date_daynight ON fires(acq_date, daynight)")
    conn.commit()

    print("Creating aggregated daily_summary table...")
    cursor.execute("DROP TABLE IF EXISTS daily_summary")
    cursor.execute("""
    CREATE TABLE daily_summary AS
    SELECT 
        acq_date,
        COUNT(*) as fire_count,
        ROUND(AVG(brightness), 1) as avg_brightness,
        ROUND(MAX(brightness), 1) as max_brightness,
        ROUND(SUM(frp), 1) as total_frp
    FROM fires 
    GROUP BY acq_date
    """)
    cursor.execute("CREATE UNIQUE INDEX idx_daily_summary_date ON daily_summary(acq_date)")
    conn.commit()
    conn.close()
    
    print(f"Done! {total_rows} rows indexed in {time.time() - start_time:.2f} seconds.")

if __name__ == '__main__':
    build_db()

