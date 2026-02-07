import csv
import os

main_csv = 'public/themes_data_v3.csv'
links_csv = 'LinksDrivecsv.csv'
output_csv = 'public/themes_data_v3.csv'

# 5 New themes to add if they are not there yet
new_themes = [
    {'Nombre': 'Happy Ever After feat. YU-KA', 'Artista': 'YU-KA, Reina Washio', 'Enlace del video-web': 'https://v.animethemes.moe/ErisNoSeihai-OP1.webm', 'Nombre en la carpeta del drive': 'ErisNoSeihai-OP1.webm', 'Anime': 'Eris no Seihai', 'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/o50jC5tQ2VshY2Wf302VshY2Wf302VshY2Wf30.jpg', 'Nombre imagen drive': 'o50jC5tQ2VshY2Wf302VshY2Wf302VshY2Wf30.jpg', 'Temporada': 'Winter', 'Año': '2026'},
    {'Nombre': 'YOAKE', 'Artista': 'blank paper', 'Enlace del video-web': 'https://v.animethemes.moe/YoroiShindenSamuraiTroopers-OP1.webm', 'Nombre en la carpeta del drive': 'YoroiShindenSamuraiTroopers-OP1.webm', 'Anime': 'Yoroi Shinden Samurai Troopers', 'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/PqWyp3hQz59q3w59mlV5flvTst7NcpCY0KmhXgtx.jpg', 'Nombre imagen drive': 'PqWyp3hQz59q3w59mlV5flvTst7NcpCY0KmhXgtx.jpg', 'Temporada': 'Winter', 'Año': '2026'},
    {'Nombre': 'Magic', 'Artista': 'kobore', 'Enlace del video-web': 'https://v.animethemes.moe/IsekaiNoSataWaShachikuShidai-OP1.webm', 'Nombre en la carpeta del drive': 'IsekaiNoSataWaShachikuShidai-OP1.webm', 'Anime': 'Isekai no Sata wa Shachiku Shidai', 'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/91CTVD97yoxVgeiBOIy8CLXOF5EleEngCVerT6mW.jpg', 'Nombre imagen drive': '91CTVD97yoxVgeiBOIy8CLXOF5EleEngCVerT6mW.jpg', 'Temporada': 'Winter', 'Año': '2026'},
    {'Nombre': 'Hamidashi Gomen', 'Artista': 'Porno Graffitti', 'Enlace del video-web': 'https://v.animethemes.moe/Hikuidori-OP1.webm', 'Nombre en la carpeta del drive': 'Hikuidori-OP1.webm', 'Anime': 'Hikuidori', 'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/o53lbEGTk4JGXrGPf2L4RiYsM1ETdBDYkSSyQaMw.png', 'Nombre imagen drive': 'o53lbEGTk4JGXrGPf2L4RiYsM1ETdBDYkSSyQaMw.png', 'Temporada': 'Winter', 'Año': '2026'},
    {'Nombre': 'Cold Night', 'Artista': 'HANA', 'Enlace del video-web': 'https://v.animethemes.moe/MedalistS2-OP1.webm', 'Nombre en la carpeta del drive': 'MedalistS2-OP1.webm', 'Anime': 'Medalist 2nd Season', 'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/CcXpJlXkWnHTXEPL84kRw3KMgM1VL4cLe1Fk46FZ.jpg', 'Nombre imagen drive': 'CcXpJlXkWnHTXEPL84kRw3KMgM1VL4cLe1Fk46FZ.jpg', 'Temporada': 'Winter', 'Año': '2026'}
]

# 1. Load current database
themes = []
if os.path.exists(main_csv):
    with open(main_csv, 'r', encoding='utf-8') as f:
        themes = list(csv.DictReader(f))

# Add new themes if not already present
existing_keys = {f"{t['Anime']}|{t['Nombre']}" for t in themes}
for nt in new_themes:
    if f"{nt['Anime']}|{nt['Nombre']}" not in existing_keys:
        themes.append(nt)

# 2. Load Drive links map
drive_map = {}
if os.path.exists(links_csv):
    with open(links_csv, 'r', encoding='utf-8') as f:
        # User provided file has "File Name" and "File URL"
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('File Name', '').strip()
            url = row.get('File URL', '').strip()
            if name and url:
                drive_map[name] = url

# 3. Update Enlace Drive
count = 0
for t in themes:
    fname = t.get('Nombre en la carpeta del drive')
    if fname in drive_map:
        t['Enlace Drive'] = drive_map[fname]
        count += 1

# 4. Save back
headers = ['Nombre', 'Artista', 'Enlace del video-web', 'Nombre en la carpeta del drive', 'Anime', 'Imagen Web', 'Nombre imagen drive', 'Temporada', 'Año', 'Enlace Drive']
with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for t in themes:
        writer.writerow({h: t.get(h, '') for h in headers})

print(f"Updated {len(themes)} themes. Matched {count} Drive links.")
