import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ThemesService, AnimeTheme } from '../../services/themes.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-[#1e2124] text-white font-sans">
      <!-- Header -->
      <header class="h-16 bg-black/50 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-40">
        <div class="flex items-center gap-4">
          <span class="text-red-500 font-black italic tracking-widest text-xl">YOSSIX<span class="text-white">THEMES</span></span>
          <span class="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono hidden sm:inline-block">
            2026 OPENINGS
          </span>
        </div>

        <div class="flex-1 max-w-xl mx-4 flex gap-2">
          <div class="relative group flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Buscar opening, artista o anime..."
              class="w-full bg-[#2f3136] border border-transparent focus:border-red-500 rounded-md py-2 px-4 text-sm focus:outline-none transition-all"
            >
            <div class="absolute right-3 top-2.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <a
            routerLink="/watch/random"
            target="_blank"
            class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md font-bold text-sm transition-colors hidden sm:flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            RANDOM
          </a>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        @if (themesService.loading()) {
          <div class="flex flex-col items-center justify-center h-64 gap-4 px-4 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            <p class="text-gray-400 animate-pulse font-bold">Cargando openings...</p>
          </div>
        } @else if (themesService.error()) {
          <div class="flex flex-col items-center justify-center h-64 text-red-500 text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-xl mb-2">{{ themesService.error() }}</p>
          </div>
        } @else {
          
          <!-- Sections by Season -->
          @for (group of groupedThemes(); track group.season) {
            <section class="mb-12">
              <div class="flex items-center gap-4 mb-6">
                <h2 class="text-2xl font-black italic text-white uppercase tracking-wider">
                  {{ group.season }} <span class="text-red-500">{{ group.year }}</span>
                </h2>
                <div class="h-1 flex-1 bg-gradient-to-r from-red-600/50 to-transparent rounded"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                @for (theme of group.themes; track theme.id) {
                  <a
                    [routerLink]="['/watch', theme.id]"
                    target="_blank"
                    class="theme-card group bg-[#2f3136] rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500/50 block"
                  >
                    <!-- Thumbnail / Play Button Area -->
                    <div class="aspect-video bg-gradient-to-br from-red-900/30 to-purple-900/30 relative flex items-center justify-center overflow-hidden">
                      <!-- Background Image -->
                      @if (theme.imageUrl) {
                        <img [src]="theme.imageUrl" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" loading="lazy" alt="Cover" referrerpolicy="no-referrer">
                      }

                      <!-- Play Icon -->
                      <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="bg-red-600 rounded-full p-4 transform group-hover:scale-110 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>

                      <!-- Anime Initial -->
                      <div class="text-6xl font-black text-white/10 select-none absolute z-0">
                        {{ getAnimeInitial(theme.animeName) }}
                      </div>
                    </div>

                    <!-- Info -->
                    <div class="p-4 relative z-10">
                      <h3 class="font-bold text-white group-hover:text-red-400 transition-colors truncate" [title]="theme.name">
                        {{ theme.name }} - OP de "{{ theme.animeName }}"
                      </h3>
                      <p class="text-sm text-gray-400 truncate mt-1">
                        Interpretado por <span class="text-red-400">{{ theme.artist }}</span>
                      </p>
                    </div>
                  </a>
                }
              </div>
            </section>
          }

          @if (groupedThemes().length === 0) {
            <div class="flex flex-col items-center justify-center h-64 text-gray-500 text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-xl mb-2">No se encontraron openings</p>
              <p class="text-sm">Intenta con otra busqueda</p>
            </div>
          }
        }
      </main>

      <!-- Footer -->
      <footer class="h-12 bg-black/30 border-t border-white/10 flex items-center justify-center px-6 text-xs text-gray-600">
        <span>YossixThemes - Powered by AnimeThemes.moe</span>
      </footer>
    </div>
  `
})
export class HomeComponent {
  themesService = inject(ThemesService);
  titleService = inject(Title);
  searchQuery = signal('');

  constructor() {
    this.titleService.setTitle('YossixThemes - Openings de Anime');
  }

  groupedThemes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let themes = this.themesService.themes();

    // Filter
    if (query) {
      themes = themes.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.animeName.toLowerCase().includes(query)
      );
    }

    // Sort Alphabetically by Anime Name
    themes = [...themes].sort((a, b) => a.animeName.localeCompare(b.animeName));

    // Group by Season + Year
    const groups: { season: string; year: string; themes: AnimeTheme[] }[] = [];
    
    // Helper to get season order
    const seasonOrder: { [key: string]: number } = { 'Winter': 1, 'Spring': 2, 'Summer': 3, 'Fall': 4, 'Invierno': 1, 'Primavera': 2, 'Verano': 3, 'Otoño': 4 };
    
    // We want to group by unique season keys
    const map = new Map<string, AnimeTheme[]>();
    
    themes.forEach(theme => {
        const key = `${theme.season || 'Unknown'}|${theme.year || 'Unknown'}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(theme);
    });

    map.forEach((themes, key) => {
        const [season, year] = key.split('|');
        groups.push({ season, year, themes });
    });

    // Sort groups by Year (desc) then Season (desc)
    return groups.sort((a, b) => {
        if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
        const seasonA = seasonOrder[a.season] || 0;
        const seasonB = seasonOrder[b.season] || 0;
        return seasonB - seasonA;
    });
  });

  getAnimeInitial(animeName: string): string {
    if (!animeName) return '?';
    const name = animeName.replace(/^\[.*?\]\s*/, '');
    return name.charAt(0).toUpperCase();
  }
}
