"""
Lightweight high-performance HTTP server using Python built-in standard library (no pip packages needed).
Serves fire data filtered by date and daynight directly from SQLite.
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "processed" / "fires.db"

class FireRequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for frontend development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == '/api/fires':
            self.handle_fires(query)
        elif path == '/api/dates':
            self.handle_dates()
        elif path == '/api/calendar':
            self.handle_calendar(query)
        elif path == '/api/monthly':
            self.handle_monthly()
        elif path == '/api/archive/summary':
            self.handle_archive_summary(query)
        elif path == '/api/export':
            self.handle_export(query)
        elif path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "db_exists": DB_PATH.exists()}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def handle_dates(self):
        if not DB_PATH.exists():
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'{"error": "Database not built yet"}')
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT MIN(acq_date), MAX(acq_date), COUNT(DISTINCT acq_date) FROM daily_summary")
        row = cursor.fetchone()
        conn.close()

        data = {
            "min_date": row[0],
            "max_date": row[1],
            "total_dates": row[2]
        }
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def handle_calendar(self, query):
        year = query.get('year', [None])[0]
        if not DB_PATH.exists():
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'{"error": "Database not built"}')
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        if year:
            cursor.execute("""
                SELECT acq_date, fire_count, avg_brightness, max_brightness, total_frp 
                FROM daily_summary 
                WHERE acq_date LIKE ? 
                ORDER BY acq_date
            """, (f"{year}%",))
        else:
            cursor.execute("""
                SELECT acq_date, fire_count, avg_brightness, max_brightness, total_frp 
                FROM daily_summary 
                ORDER BY acq_date
            """)
        rows = cursor.fetchall()
        conn.close()

        result = [
            {
                "date": r[0],
                "count": r[1],
                "avg_b": r[2],
                "max_b": r[3],
                "frp": r[4]
            }
            for r in rows
        ]

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode('utf-8'))

    def handle_monthly(self):
        if not DB_PATH.exists():
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'{"error": "Database not built"}')
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                substr(acq_date, 1, 4) as year,
                substr(acq_date, 6, 2) as month,
                SUM(fire_count) as total_fires,
                ROUND(AVG(avg_brightness), 1) as avg_brightness,
                MAX(max_brightness) as peak_brightness,
                ROUND(SUM(total_frp), 1) as total_frp
            FROM daily_summary
            GROUP BY year, month
            ORDER BY year, month
        """)
        rows = cursor.fetchall()
        conn.close()

        result = [
            {
                "year": r[0],
                "month": r[1],
                "fires": r[2],
                "avg_b": r[3],
                "max_b": r[4],
                "frp": r[5]
            }
            for r in rows
        ]

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode('utf-8'))

    def handle_fires(self, query):
        date = query.get('date', [None])[0]
        daynight = query.get('daynight', ['ALL'])[0].upper()

        if not date:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing 'date' parameter (YYYY-MM-DD)"}).encode('utf-8'))
            return

        if not DB_PATH.exists():
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Database not built yet"}).encode('utf-8'))
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        sql = "SELECT latitude, longitude, brightness, frp, daynight, instrument, confidence, acq_time, type, confidence_cat FROM fires WHERE acq_date = ?"
        params = [date]

        if daynight in ['D', 'N']:
            sql += " AND daynight = ?"
            params.append(daynight)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            # Parse type integer (-1 if null, undefined, or -1.0)
            raw_type = r[8]
            try:
                fire_type = int(raw_type) if raw_type is not None else -1
            except (ValueError, TypeError):
                fire_type = -1

            results.append({
                "lat": r[0],
                "lon": r[1],
                "brightness": r[2],
                "frp": r[3],
                "daynight": r[4],
                "instrument": r[5],
                "confidence": r[6],
                "time": r[7],
                "type": fire_type,
                "confidence_cat": r[9]
            })

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "date": date,
            "daynight": daynight,
            "count": len(results),
            "fires": results
        }).encode('utf-8'))

    def handle_archive_summary(self, query):
        start_date = query.get('start_date', [None])[0]
        end_date = query.get('end_date', [None])[0]
        daynight = query.get('daynight', ['ALL'])[0].upper()
        instrument = query.get('instrument', ['ALL'])[0]
        fire_type = query.get('type', ['ALL'])[0]

        if not start_date or not end_date:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error": "Missing start_date or end_date"}')
            return

        if not DB_PATH.exists():
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error": "Database not found"}')
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        where_clauses = ["acq_date BETWEEN ? AND ?"]
        params = [start_date, end_date]

        if daynight in ['D', 'N']:
            where_clauses.append("daynight = ?")
            params.append(daynight)

        if instrument and instrument != 'ALL':
            where_clauses.append("instrument LIKE ?")
            params.append(f"%{instrument}%")

        if fire_type and fire_type != 'ALL':
            try:
                where_clauses.append("type = ?")
                params.append(float(fire_type))
            except ValueError:
                pass

        where_sql = " AND ".join(where_clauses)

        cursor.execute(f"""
            SELECT COUNT(*), 
                   ROUND(AVG(brightness), 1), 
                   MAX(brightness), 
                   ROUND(SUM(frp), 1)
            FROM fires 
            WHERE {where_sql}
        """, params)
        summary_row = cursor.fetchone()

        cursor.execute(f"""
            SELECT latitude, longitude, brightness, scan, track, acq_date, 
                   acq_time, instrument, confidence, frp, daynight, type, confidence_cat
            FROM fires 
            WHERE {where_sql}
            ORDER BY acq_date, acq_time
            LIMIT 15
        """, params)
        sample_rows = cursor.fetchall()
        conn.close()

        preview = []
        for r in sample_rows:
            type_val = int(r[11]) if r[11] is not None and not (isinstance(r[11], float) and r[11] != r[11]) else -1
            preview.append({
                "latitude": r[0],
                "longitude": r[1],
                "brightness": r[2],
                "scan": r[3],
                "track": r[4],
                "acq_date": r[5],
                "acq_time": r[6],
                "instrument": r[7],
                "confidence": r[8],
                "frp": r[9],
                "daynight": r[10],
                "type": type_val,
                "confidence_cat": r[12]
            })

        data = {
            "start_date": start_date,
            "end_date": end_date,
            "count": summary_row[0] or 0,
            "avg_brightness": summary_row[1] or 0,
            "max_brightness": summary_row[2] or 0,
            "total_frp": summary_row[3] or 0,
            "preview": preview
        }

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def handle_export(self, query):
        start_date = query.get('start_date', [None])[0]
        end_date = query.get('end_date', [None])[0]
        daynight = query.get('daynight', ['ALL'])[0].upper()
        instrument = query.get('instrument', ['ALL'])[0]
        fire_type = query.get('type', ['ALL'])[0]
        limit = query.get('limit', [None])[0]

        if not start_date or not end_date:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error": "Missing start_date or end_date (YYYY-MM-DD)"}')
            return

        if not DB_PATH.exists():
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"error": "Database not found"}')
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        where_clauses = ["acq_date BETWEEN ? AND ?"]
        params = [start_date, end_date]

        if daynight in ['D', 'N']:
            where_clauses.append("daynight = ?")
            params.append(daynight)

        if instrument and instrument != 'ALL':
            where_clauses.append("instrument LIKE ?")
            params.append(f"%{instrument}%")

        if fire_type and fire_type != 'ALL':
            try:
                where_clauses.append("type = ?")
                params.append(float(fire_type))
            except ValueError:
                pass

        where_sql = " AND ".join(where_clauses)
        sql = f"""
            SELECT latitude, longitude, brightness, scan, track, acq_date, 
                   acq_time, instrument, confidence, frp, daynight, type 
            FROM fires 
            WHERE {where_sql}
            ORDER BY acq_date, acq_time
        """

        if limit:
            try:
                sql += f" LIMIT {int(limit)}"
            except ValueError:
                pass

        cursor.execute(sql, params)

        filename = f"firesync_archive_{start_date.replace('-', '')}_{end_date.replace('-', '')}.csv"
        self.send_response(200)
        self.send_header('Content-Type', 'text/csv; charset=utf-8')
        self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.end_headers()

        # Write CSV header row
        self.wfile.write(b"latitude,longitude,brightness,scan,track,acq_date,acq_time,instrument,confidence,frp,daynight,type\r\n")

        # Stream rows in chunks
        chunk_size = 2000
        while True:
            rows = cursor.fetchmany(chunk_size)
            if not rows:
                break
            lines = []
            for r in rows:
                type_val = int(r[11]) if r[11] is not None and not (isinstance(r[11], float) and r[11] != r[11]) else -1
                lines.append(f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]},{r[5]},{r[6]},{r[7]},{r[8]},{r[9]},{r[10]},{type_val}\r\n")
            self.wfile.write("".join(lines).encode('utf-8'))

        conn.close()

def run_server(port=8000):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, FireRequestHandler)
    print(f"🔥 Fire API backend running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run_server()

