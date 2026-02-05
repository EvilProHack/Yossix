import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ThemesService, AnimeTheme } from '../../services/themes.service';
import { VideoPlayerComponent } from '../../components/video-player.component';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule, VideoPlayerComponent],
  template: `
    <div class="min-h-screen bg-[#1e2124] flex items-center justify-center p-4">
      @if (themesService.loading()) {
        <div class="flex flex-col items-center justify-center gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p class="text-gray-400 font-bold">Cargando...</p>
        </div>
      } @else if (currentTheme()) {
        <app-video-player
          [theme]="currentTheme()"
          [hasPrevious]="false"
          [hasNext]="false"
          (close)="close()"
          (random)="playRandom()"
        />
      } @else {
        <div class="text-center text-red-500">
            <h1 class="text-2xl font-bold mb-4">Opening no encontrado</h1>
            <button (click)="close()" class="bg-gray-700 text-white px-4 py-2 rounded">Volver</button>
        </div>
      }
    </div>
  `
})
export class WatchComponent {
  themesService = inject(ThemesService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  titleService = inject(Title);
  
  targetId = signal<string | null>(null);

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.targetId.set(params.get('id'));
    });

    effect(() => {
        const id = this.targetId();
        const themes = this.themesService.themes();
        
        if (id === 'random' && themes.length > 0) {
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            this.router.navigate(['/watch', randomTheme.id], { replaceUrl: true });
        }

        const current = this.currentTheme();
        if (current) {
            this.titleService.setTitle(`${current.name} - YossixThemes`);
        } else {
            this.titleService.setTitle('Reproductor - YossixThemes');
        }
    });
  }

  currentTheme = computed(() => {
    const id = this.targetId();
    const themes = this.themesService.themes();
    
    if (!id || id === 'random') return null;
    
    return themes.find(t => t.id.toString() === id) || null;
  });

  playRandom() {
    const themes = this.themesService.themes();
    if (themes.length > 0) {
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        this.router.navigate(['/watch', randomTheme.id]);
    }
  }

  close() {
    this.router.navigate(['/']);
  }
}
