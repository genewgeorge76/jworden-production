import os
import sys
import csv
import sqlite3
from datetime import datetime

def parse_date(date_str):
    if not date_str:
        return None
    for fmt in ('%Y-%m-%d %H:%M:%S', '%m/%d/%Y %H:%M', '%m/%d/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue
    return None

def normalize_phone(phone_str):
    if not phone_str:
        return ""
    return ''.join(c for c in str(phone_str) if c.isdigit() or c in ['-', '+', '(', ')'])

def import_kickserv_csv(csv_path):
    db_path = 'jworden_leads.db'
    if not os.path.exists(db_path):
        # Check backend folder
        db_path = 'jwordenai operation system/jworden_leads.db'
        if not os.path.exists(db_path):
            print("Error: Could not locate jworden_leads.db database file.")
            return

    if not os.path.exists(csv_path):
        print(f"Error: Could not find CSV file at {csv_path}")
        print("Please copy your Kickserv export CSV to this folder and name it 'kickserv_export.csv'")
        return

    print(f"Starting import from: {csv_path}")
    print(f"Target database: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        headers = [h.strip().lower() for h in reader.fieldnames]
        print(f"Detected columns: {reader.fieldnames}")

        # Map headers dynamically based on common Kickserv output names
        col_map = {}
        for original in reader.fieldnames:
            h = original.strip().lower()
            if 'first' in h: col_map['first_name'] = original
            elif 'last' in h: col_map['last_name'] = original
            elif 'company' in h: col_map['company'] = original
            elif 'email' in h: col_map['email'] = original
            elif 'phone' in h or 'mobile' in h: col_map['phone'] = original
            elif 'address' in h or 'street' in h: col_map['address'] = original
            elif 'city' in h: col_map['city'] = original
            elif 'state' in h: col_map['state'] = original
            elif 'zip' in h or 'postal' in h: col_map['zip'] = original
            elif 'number' in h or 'job #' in h or 'id' == h: col_map['job_number'] = original
            elif 'title' in h or 'name' in h or 'summary' in h: col_map['job_name'] = original
            elif 'description' in h or 'notes' in h: col_map['description'] = original
            elif 'status' in h: col_map['status'] = original
            elif 'total' in h or 'amount' in h or 'price' in h: col_map['amount'] = original
            elif 'start' in h or 'date' in h: col_map['date'] = original

        # Determine import mode
        is_jobs = any(k in col_map for k in ['job_number', 'amount'])
        print(f"Import mode detected: {'Jobs & Estimates' if is_jobs else 'Customers only'}")

        customer_count = 0
        job_count = 0
        estimate_count = 0
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        for row_idx, row in enumerate(reader):
            # Clean keys
            clean_row = {k: row[v].strip() if row[v] else "" for k, v in col_map.items()}
            
            # Extract customer info
            first_name = clean_row.get('first_name', '')
            last_name = clean_row.get('last_name', '')
            company = clean_row.get('company', '')
            email = clean_row.get('email', '')
            phone = normalize_phone(clean_row.get('phone', ''))
            address = clean_row.get('address', '')
            city = clean_row.get('city', '')
            state = clean_row.get('state', 'VA')
            zip_code = clean_row.get('zip', '')
            
            cust_name = f"{first_name} {last_name}".strip()
            if not cust_name:
                cust_name = company or "Unknown Customer"

            # Skip header duplicates or empty rows
            if cust_name == "Unknown Customer" and not email and not phone:
                continue

            # 1. Create or Find Customer
            cursor.execute("SELECT id FROM customers WHERE name = ? OR email = ? OR phone = ?", (cust_name, email, phone))
            cust_res = cursor.fetchone()
            if cust_res:
                customer_id = cust_res[0]
            else:
                cursor.execute("""
                INSERT INTO customers (
                    name, email, phone, company, address, city, state_code, zip_code,
                    customer_type, is_franchise, total_jobs, total_revenue, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0.0, ?, ?)
                """, (cust_name, email, phone, company, address, city, state, zip_code, 'residential', now_str, now_str))
                customer_id = cursor.lastrowid
                customer_count += 1

            if is_jobs:
                # Extract job details
                job_num = clean_row.get('job_number', f"KS-{1000 + row_idx}")
                job_name = clean_row.get('job_name', f"Kickserv Job - {job_num}")
                description = clean_row.get('description', '')
                status = clean_row.get('status', 'completed').lower()
                amount_str = clean_row.get('amount', '0.0').replace('$', '').replace(',', '').strip()
                amount = float(amount_str) if amount_str else 0.0
                date_str = parse_date(clean_row.get('date', '')) or now_str

                # 2. Insert Lead / Estimate
                cursor.execute("SELECT id FROM leads WHERE address = ? AND name = ?", (address or cust_name, job_name))
                lead_res = cursor.fetchone()
                if lead_res:
                    lead_id = lead_res[0]
                else:
                    cursor.execute("""
                    INSERT INTO leads (
                        name, email, phone, service_type, property_type, urgency, project_size_sqft,
                        address, state_code, message, pipeline_stage, created_at
                    ) VALUES (?, ?, ?, 'paving', 'residential', 'flexible', 0.0, ?, ?, ?, 'won', ?)
                    """, (job_name, email or "no-email@kickserv.com", phone or "000-000-0000", address or cust_name, state, description, date_str))
                    lead_id = cursor.lastrowid

                # Insert Estimate
                cursor.execute("SELECT id FROM estimates WHERE estimate_number = ?", (f"EST-{job_num}",))
                est_res = cursor.fetchone()
                if not est_res:
                    cursor.execute("""
                    INSERT INTO estimates (
                        lead_id, customer_id, estimate_number, status, service_type, scope_summary,
                        amount_low, amount_high, total_amount, currency, state_code, tenant_id, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, 'paving', ?, ?, ?, ?, 'USD', ?, 'default-tenant', ?, ?)
                    """, (lead_id, customer_id, f"EST-{job_num}", 'approved' if status == 'completed' else 'draft', description, amount, amount, amount, state, date_str, date_str))
                    estimate_id = cursor.lastrowid
                    estimate_count += 1

                # 3. Insert Job
                cursor.execute("SELECT id FROM jobs WHERE job_number = ?", (job_num,))
                job_res = cursor.fetchone()
                if not job_res:
                    cursor.execute("""
                    INSERT INTO jobs (
                        estimate_id, lead_id, customer_id, job_number, name, status, service_type,
                        site_address, state_code, completed_at, progress_percent, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'paving', ?, ?, ?, 100 if ? == 'completed' else 0, ?, ?)
                    """, (estimate_id if 'estimate_id' in locals() else None, lead_id, customer_id, job_num, job_name, status, address or cust_name, state, date_str, status, date_str, date_str))
                    job_count += 1

        conn.commit()
        conn.close()
        
        # Sync to second database copy if exists
        alt_db = 'jwordenai operation system/jworden_leads.db' if db_path == 'jworden_leads.db' else 'jworden_leads.db'
        if os.path.exists(alt_db):
            import shutil
            shutil.copy(db_path, alt_db)
            print(f"Copied updated database to backup: {alt_db}")

        print("\n=== IMPORT COMPLETED ===")
        print(f"Imported {customer_count} new customers.")
        if is_jobs:
            print(f"Imported {job_count} new jobs.")
            print(f"Imported {estimate_count} new estimates.")

if __name__ == "__main__":
    csv_file = sys.argv[1] if len(sys.argv) > 1 else 'kickserv_export.csv'
    import_kickserv_csv(csv_file)
