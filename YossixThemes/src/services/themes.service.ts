import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Papa from 'papaparse';

export interface AnimeTheme {
  id: number;
  name: string;
  artist: string;
  videoUrl: string; // Helper for default/fallback
  driveUrl: string;
  webUrl: string;
  driveFileName: string;
  animeName: string;
  imageUrl?: string;
  season?: string;
  year?: string;
}

@Injectable({ providedIn: 'root' })
export class ThemesService {
  private http = inject(HttpClient);
  
  themes = signal<AnimeTheme[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor() {
    this.loadThemes();
  }

  loadThemes() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get('/themes_data_v3.csv', { responseType: 'text' }).subscribe({
      next: (csvData) => {
        try {
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (result: any) => {
              // Use Drive URL if available, fallback to Web URL
              const themes: AnimeTheme[] = result.data.map((row: any, index: number) => {
                 const driveUrl = row['Enlace Drive'] || '';
                 const webUrl = row['Enlace del video-web'] || '';
                 // Prefer Drive URL if present for default
                 const finalVideoUrl = driveUrl || webUrl || '';
                 
                 // Use local cover image if available (to avoid Cloudflare blocks), fallback to Web Image
                 const imageFilename = row['Nombre imagen drive'];
                 const webImage = row['Imagen Web'];
                 // Assuming user puts images in /covers/ folder in public
                 const finalImageUrl = imageFilename ? `/covers/${imageFilename}` : (webImage || '');

                 return {
                    id: index,
                    name: row['Nombre'] || 'Unknown',
                    artist: row['Artista'] || 'Unknown Artist',
                    videoUrl: finalVideoUrl,
                    driveUrl: driveUrl,
                    webUrl: webUrl,
                    driveFileName: row['Nombre en la carpeta del drive'] || '',
                    animeName: row['Anime'] || 'Unknown Anime',
                    imageUrl: finalImageUrl,
                    season: row['Temporada'] || 'Winter',
                    year: row['Año'] || '2026'
                 };
              }).filter((t: AnimeTheme) => t.videoUrl);

              this.themes.set(themes);
              console.log(`Loaded ${themes.length} themes`);
              this.loading.set(false);
            },
            error: (err: any) => {
                console.error('CSV Parse Error:', err);
                this.error.set('Error parsing CSV data');
                this.loading.set(false);
            }
          });
        } catch (e) {
          console.error('Error processing themes:', e);
          this.error.set('Error processing themes');
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('HTTP Error:', err);
        this.error.set('Error loading CSV file');
        this.loading.set(false);
      }
    });
  }

  getRandomTheme(): AnimeTheme | null {
    const allThemes = this.themes();
    if (allThemes.length === 0) return null;
    return allThemes[Math.floor(Math.random() * allThemes.length)];
  }
}
