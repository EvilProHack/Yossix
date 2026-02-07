import csv
import requests
import os

csv_path = 'public/themes_data_v3.csv'
covers_dir = 'public/covers'

os.makedirs(covers_dir, exist_ok=True)

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    themes = list(reader)

print(f"Iniciando descarga de {len(themes)} imágenes...")

for i, theme in enumerate(themes):
    url = theme.get('Imagen Web')
    filename = theme.get('Nombre imagen drive')
    
    if not url or not filename:
        continue
        
    save_path = os.path.join(covers_dir, filename)
    
    if not os.path.exists(save_path):
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                with open(save_path, 'wb') as img_f:
                    img_f.write(r.content)
                print(f"[{i+1}/{len(themes)}] Descargada: {filename}")
            else:
                print(f"[{i+1}/{len(themes)}] Error {r.status_code}: {filename}")
        except Exception as e:
            print(f"[{i+1}/{len(themes)}] Error descargando {filename}: {e}")
    else:
        print(f"[{i+1}/{len(themes)}] Ya existe: {filename}")

print("Proceso completado.")
