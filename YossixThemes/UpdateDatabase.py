import requests
import os
import csv
import time
import json

def create_api_url(year=2026, page_size=100, page_num=1):
    base_url = "https://api.animethemes.moe/animetheme"
    queries = f"""?page%5Bsize%5D={page_size}&page%5Bnumber%5D={page_num}&filter%5Bhas%5D=song&filter%5Btype%5D=OP&sort=anime.year%2Canime.season%2Ccreated_at&include=song.artists,anime.images,animethemeentries.videos"""
    return base_url + queries

def download_file(url, save_path):
    """Download file if it doesn't already exist."""
    # Check if the file already exists to avoid re-downloading
    if not os.path.exists(save_path):
        try:
            # Get the content from the URL
            response = requests.get(url)
            
            # Check if the request was successful
            if response.status_code == 200:
                # Ensure directory exists
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                # Write the content to a file in the specified save path
                with open(save_path, 'wb') as file:
                    file.write(response.content)
                print(f"Downloaded and saved to {save_path}")
            else:
                print(f"Failed to download {url}. Status code: {response.status_code}")
        except Exception as e:
            print(f"Error downloading {url}: {e}")
    else:
        print(f"File already exists at {save_path}. Skipping download.")

def get_openings(year):
    start_time = time.time()
    current_page = 1
    all_json = []
    added_to_csv = []

    # Set to track processed songs to avoid duplicates
    processed_songs = set()

    # Ensure the save directories exist
    base_drive_path = f"G:\\DriveE\\{year}"
    videos_directory = os.path.join(base_drive_path, "Openings")
    images_directory = os.path.join(base_drive_path, "Images")
    
    os.makedirs(videos_directory, exist_ok=True) 
    os.makedirs(images_directory, exist_ok=True)

    csv_filename = f'openings_{year}.csv'
    
    # If starting fresh, overwrite. If appending, we might duplicate headers if we don't check.
    # For this script, assuming we overwrite or start clean is safer given the logic.
    # But to match previous 'a' mode:
    file_exists = os.path.isfile(csv_filename)

    while True:
        api_url = create_api_url(year, page_num=current_page)
        print(f"Fetching: {api_url}")
        try:
            r = requests.get(api_url)
            if r.status_code != 200:
                print(f"Error fetching API: {r.status_code}")
                break
            data = r.json()
        except Exception as e:
            print(f"Request failed: {e}")
            break
            
        all_json.append(data)

        with open(csv_filename, 'a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            if current_page == 1 and not file_exists:
                writer.writerow(["Nombre", "Artista", "Enlace del video-web", "Nombre en la carpeta del drive", "Anime", "Imagen Web", "Nombre imagen drive", "Temporada", "Año"])
                file_exists = True # Prevent writing header again

            for anime in data['animethemes']:
                song = anime['song']
                anime_content = anime['anime'] 
                nombre = song['title']
                anime_name = anime_content['name']
                season = anime_content.get('season', 'Unknown')
                anime_year = anime_content.get('year', year)
                song_id = song['id']
                
                if anime['animethemeentries'] and anime['animethemeentries'][0]['videos']:
                    for video in anime['animethemeentries'][0]['videos']:
                        video_link = video['link']
                        
                        # Filter for year if needed, though API query sorts by year. 
                        # The original script checked: if str(year) in video['path']:
                        # This might be specific to how files are named or organized on the API.
                        # I'll keep it but it might be restrictive if the video path doesn't contain the year.
                        # Actually, let's keep the logic as close to original as possible.
                        if str(year) in video.get('path', ''):
                            if song_id not in processed_songs:
                                processed_songs.add(song_id)
                                artistas = ", ".join([artist['name'] for artist in song['artists']])
                                
                                # Process Video
                                video_name = video_link.split("/")[-1]
                                save_video_path = os.path.join(videos_directory, video_name)
                                # download_file(video_link, save_video_path) # Skipped for speed
                                
                                # Process Image
                                image_url = ""
                                image_name = ""
                                if 'images' in anime_content and anime_content['images']:
                                    # Try to find 'Large Cover', else 'Common Cover', else first available
                                    cover = next((img for img in anime_content['images'] if img.get('facet') == 'Large Cover'), None)
                                    if not cover:
                                        cover = next((img for img in anime_content['images'] if img.get('facet') == 'Common Cover'), None)
                                    if not cover:
                                        cover = anime_content['images'][0]
                                    
                                    if cover:
                                        image_url = cover['link']
                                        image_name = image_url.split("/")[-1]
                                        save_image_path = os.path.join(images_directory, image_name)
                                        # download_file(image_url, save_image_path) # Skipped for speed

                                # Write to CSV
                                writer.writerow([nombre, artistas, video_link, video_name, anime_name, image_url, image_name, season, anime_year])
                                added_to_csv.append(anime)
                                break  # Break after processing the first video to avoid duplicates

        current_page += 1
        elapsed_time = time.time() - start_time
        print(f"Tiempo transcurrido: {elapsed_time} segundos")

        if 'links' in data and data['links']['next'] is None:
            break
        if 'links' not in data:
            break

    total_time = time.time() - start_time
    print(f"Tiempo total transcurrido: {total_time} segundos")

    # Save all fetched JSON data to a file
    with open(f'json_results_{year}.json', 'w') as f:
        json.dump(all_json, f, indent=2)

    # Save all added openings to CSV JSON file
    with open(f'added_to_csv_{year}.json', 'w') as f:
        json.dump(added_to_csv, f, indent=2)

if __name__ == "__main__":
    get_openings(2026)