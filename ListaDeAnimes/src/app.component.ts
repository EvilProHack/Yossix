import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnimeService, Anime } from './services/anime.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-[#1e2124] text-white font-sans">
      <!-- Header -->
      <header class="h-16 bg-black/50 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
         <div class="flex items-center gap-4">
           <span class="text-red-500 font-black italic tracking-widest text-xl">YOSSIX<span class="text-white">LIST</span></span>
           <span class="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded font-mono hidden sm:inline-block">
             LIBRARY V1.2
           </span>
         </div>
         
         <div class="flex-1 max-w-xl mx-4 flex gap-2">
            <div class="relative group flex-1">
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery"
                    placeholder="Buscar anime..." 
                    class="w-full bg-[#2f3136] border border-transparent focus:border-red-500 rounded-md py-2 px-4 text-sm focus:outline-none transition-all"
                >
                <div class="absolute right-3 top-2.5 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <select 
                [ngModel]="statusFilter()" 
                (ngModelChange)="statusFilter.set($event)"
                class="bg-[#2f3136] text-white text-sm border-r-8 border-transparent rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer h-full"
            >
                <option value="all">Todos</option>
                <option value="completed">Completados</option>
                <option value="skipping">Dropeados</option>
                <option value="ruleta">Ruleta</option>
            </select>
         </div>

         <div class="text-xs text-gray-500 font-mono hidden md:block">
           {{ filteredAnimes().length }} / {{ animes().length }} ITEMS
         </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6 relative">
        
        @if (loading()) {
            <div class="flex flex-col items-center justify-center h-64 gap-4 px-4 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                <p class="text-gray-400 animate-pulse font-bold">Cargando biblioteca de Yossix...</p>
                <p class="text-gray-500 text-sm max-w-md">
                    La primera carga puede tardar unos minutos mientras recopilamos todas las imágenes. <br>
                    Por favor, ten paciencia.
                </p>
            </div>
        } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                @for (anime of filteredAnimes(); track anime.id) {
                    <a [href]="anime.url" target="_blank" class="group relative bg-[#2f3136] rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/20 block">
                        <!-- Image Container -->
                        <div class="aspect-[2/3] overflow-hidden relative">
                            <img [src]="anime.image" [alt]="anime.title" class="w-full h-full object-cover" loading="lazy">
                            
                            <!-- Status Badge -->
                            <div class="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm"
                                [class.bg-green-500]="anime.status === 'completed'"
                                [class.bg-red-500]="anime.status === 'skipping'"
                                [class.bg-purple-500]="anime.status === 'ruleta'"
                                [class.text-white]="true">
                                {{ anime.status === 'skipping' ? 'DROPPED' : (anime.status === 'ruleta' ? 'RULETA' : 'COMPLETED') }}
                            </div>

                            @if (anime.status === 'ruleta') {
                                <div class="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-tight z-10">
                                    SOLO HA VISTO EL PRIMER CAP
                                </div>
                            }
                            
                            <!-- Overlay -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <span class="text-red-400 text-xs font-bold">VER EN LIVECHART</span>
                            </div>
                        </div>
                        
                        <!-- Info -->
                        <div class="p-3">
                            <h3 class="font-bold text-sm line-clamp-2 leading-tight group-hover:text-red-400 transition-colors" [title]="anime.title">
                                {{ anime.title }}
                            </h3>
                        </div>
                    </a>
                }
            </div>

            @if (filteredAnimes().length === 0 && !loading()) {
                <div class="flex flex-col items-center justify-center h-64 text-gray-500 text-center p-4">
                    <p class="text-xl mb-2">No se encontraron animes</p>
                    <p class="text-sm">Si esto es un error, intenta recargar la página.</p>
                    <p class="text-xs mt-4 text-gray-700 font-mono">
                        Debug: {{ animes().length }} items cargados.
                        <br>
                        Cache: {{ getCacheStatus() }}
                    </p>
                    <button (click)="forceReload()" class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-bold transition-colors">
                        FORZAR RECARGA
                    </button>
                    <!-- Debug logs hidden by default for cleaner UI on mobile -->
                    <p class="text-xs mt-4 text-gray-700 font-mono">
                        Revisa la consola (F12) para detalles técnicos.
                    </p>
                </div>
            }
        }
      </main>
    </div>
  `
})
export class AppComponent implements OnInit {
  animeService = inject(AnimeService);
  
  animes = signal<Anime[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  statusFilter = signal<'all' | 'completed' | 'skipping' | 'ruleta'>('all');

  filteredAnimes = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    let list = this.animes();
    
    // Filter by status
    if (status !== 'all') {
        list = list.filter(a => a.status === status);
    }

    // Filter by query
    if (!query) return list;
    return list.filter(a => a.title.toLowerCase().includes(query));
  });

  ngOnInit() {
    this.loadAnimes();
    
    // Listen for logs from service
    window.addEventListener('anime-log', (e: any) => {
        this.animeService.logs.push(e.detail);
    });

    // Listen for single anime updates (hydration)
    window.addEventListener('anime-update', (e: any) => {
        const updatedAnime = e.detail;
        this.animes.update(current => {
            return current.map(a => a.id === updatedAnime.id ? updatedAnime : a);
        });
    });
  }

  getCacheStatus(): string {
      const cached = localStorage.getItem('yossix_anime_cache');
      if (!cached) return 'Sin cache';
      const data = JSON.parse(cached);
      return `Cacheado hace ${Math.floor((Date.now() - data.timestamp) / 60000)} min`;
  }

  forceReload() {
      localStorage.removeItem('yossix_anime_cache');
      window.location.reload();
  }

  async loadAnimes() {
    this.loading.set(true);
    try {
      const data = await this.animeService.fetchAllAnimes();
      this.animes.set(data);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
