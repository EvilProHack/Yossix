import csv
import os

main_csv = 'public/themes_data_v3.csv'
output_csv = 'openings_2026_TOTAL_ACTUALIZADO.csv'

# Themes already in the database
total_data = []
if os.path.exists(main_csv):
    with open(main_csv, 'r', encoding='utf-8') as f:
        total_data = list(csv.DictReader(f))

# New themes found today
new_rows = [
    {
        'Nombre': 'Happy Ever After feat. YU-KA',
        'Artista': 'YU-KA, Reina Washio',
        'Enlace del video-web': 'https://v.animethemes.moe/ErisNoSeihai-OP1.webm',
        'Nombre en la carpeta del drive': 'ErisNoSeihai-OP1.webm',
        'Anime': 'Eris no Seihai',
        'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/o50jC5tQ2VshY2Wf302VshY2Wf302VshY2Wf30.jpg',
        'Nombre imagen drive': 'o50jC5tQ2VshY2Wf302VshY2Wf302VshY2Wf30.jpg',
        'Temporada': 'Winter',
        'Año': '2026'
    },
    {
        'Nombre': 'YOAKE',
        'Artista': 'blank paper',
        'Enlace del video-web': 'https://v.animethemes.moe/YoroiShindenSamuraiTroopers-OP1.webm',
        'Nombre en la carpeta del drive': 'YoroiShindenSamuraiTroopers-OP1.webm',
        'Anime': 'Yoroi Shinden Samurai Troopers',
        'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/PqWyp3hQz59q3w59mlV5flvTst7NcpCY0KmhXgtx.jpg',
        'Nombre imagen drive': 'PqWyp3hQz59q3w59mlV5flvTst7NcpCY0KmhXgtx.jpg',
        'Temporada': 'Winter',
        'Año': '2026'
    },
    {
        'Nombre': 'Magic',
        'Artista': 'kobore',
        'Enlace del video-web': 'https://v.animethemes.moe/IsekaiNoSataWaShachikuShidai-OP1.webm',
        'Nombre en la carpeta del drive': 'IsekaiNoSataWaShachikuShidai-OP1.webm',
        'Anime': 'Isekai no Sata wa Shachiku Shidai',
        'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/91CTVD97yoxVgeiBOIy8CLXOF5EleEngCVerT6mW.jpg',
        'Nombre imagen drive': '91CTVD97yoxVgeiBOIy8CLXOF5EleEngCVerT6mW.jpg',
        'Temporada': 'Winter',
        'Año': '2026'
    },
    {
        'Nombre': 'Hamidashi Gomen',
        'Artista': 'Porno Graffitti',
        'Enlace del video-web': 'https://v.animethemes.moe/Hikuidori-OP1.webm',
        'Nombre en la carpeta del drive': 'Hikuidori-OP1.webm',
        'Anime': 'Hikuidori',
        'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/o53lbEGTk4JGXrGPf2L4RiYsM1ETdBDYkSSyQaMw.png',
        'Nombre imagen drive': 'o53lbEGTk4JGXrGPf2L4RiYsM1ETdBDYkSSyQaMw.png',
        'Temporada': 'Winter',
        'Año': '2026'
    },
    {
        'Nombre': 'Cold Night',
        'Artista': 'HANA',
        'Enlace del video-web': 'https://v.animethemes.moe/MedalistS2-OP1.webm',
        'Nombre en la carpeta del drive': 'MedalistS2-OP1.webm',
        'Anime': 'Medalist 2nd Season',
        'Imagen Web': 'https://pub-92474f7785774e91a790e086dfa6b2ef.r2.dev/anime/large-cover/CcXpJlXkWnHTXEPL84kRw3KMgM1VL4cLe1Fk46FZ.jpg',
        'Nombre imagen drive': 'CcXpJlXkWnHTXEPL84kRw3KMgM1VL4cLe1Fk46FZ.jpg',
        'Temporada': 'Winter',
        'Año': '2026'
    }
]

headers = ['Nombre', 'Artista', 'Enlace del video-web', 'Nombre en la carpeta del drive', 'Anime', 'Imagen Web', 'Nombre imagen drive', 'Temporada', 'Año', 'Enlace Drive']

with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    # Write existing
    for row in total_data:
        writer.writerow(row)
    # Write new
    for row in new_rows:
        # Ensure all headers exist
        clean_row = {h: row.get(h, '') for h in headers}
        writer.writerow(clean_row)

print(f"Total themes saved to {output_csv}: {len(total_data) + len(new_rows)}")
