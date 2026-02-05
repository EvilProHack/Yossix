import csv
import os
import re

def get_drive_id(url):
    # Extract ID from https://drive.google.com/file/d/ID/view...
    match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None

def merge_csv():
    main_csv_path = 'public/themes_data.csv'
    drive_csv_path = 'LinksDrivecsv.csv'
    output_csv_path = 'public/themes_data_merged.csv'

    # Load Drive Links
    drive_map = {}
    if os.path.exists(drive_csv_path):
        with open(drive_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                filename = row.get('File Name')
                url = row.get('File URL')
                if filename and url:
                    drive_map[filename.strip()] = url.strip()
        print(f"Loaded {len(drive_map)} drive links.")
    else:
        print("Drive links CSV not found!")
        return

    # Merge into Main CSV
    updated_rows = []
    headers = []
    
    with open(main_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames
        if 'Enlace Drive' not in headers:
            headers.append('Enlace Drive')
        
        for row in reader:
            drive_filename = row.get('Nombre en la carpeta del drive', '').strip()
            drive_url = drive_map.get(drive_filename, '')
            
            # Keep URL as is
            # if drive_url:
            #     file_id = get_drive_id(drive_url)
            #     if file_id:
            #         drive_url = f"https://drive.google.com/uc?export=download&id={file_id}"
            
            row['Enlace Drive'] = drive_url
            updated_rows.append(row)

    # Save
    with open(output_csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(updated_rows)
    
    print(f"Merged CSV saved to {output_csv_path}")

    # Replace original
    os.replace(output_csv_path, main_csv_path)
    print(f"Updated {main_csv_path}")

if __name__ == "__main__":
    merge_csv()
