import { Component, Input, Output, EventEmitter, signal, ElementRef, ViewChild, AfterViewInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AnimeTheme } from '../services/themes.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full max-w-5xl mx-auto">
      <!-- Main Content -->
      <div class="relative w-full">
        <!-- Video Container -->
        <div #videoContainer class="relative bg-black rounded-lg overflow-hidden shadow-2xl group/video">
          @if (loading()) {
            <div class="aspect-video flex items-center justify-center bg-[#2f3136]">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          }
          
          @if (error()) {
            <div class="aspect-video flex flex-col items-center justify-center bg-[#2f3136] text-red-500 z-30 absolute inset-0 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="font-bold mb-2">No se puede reproducir inline</p>
              
              @if (currentSource() === 'drive') {
                  <a [href]="currentVideoUrl()" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm font-bold flex items-center gap-2">
                    ABRIR EN DRIVE
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
              } @else {
                  <p class="text-sm text-gray-400">Prueba cambiando la fuente</p>
              }
            </div>
          }

          <!-- Source Switcher -->
          <div class="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity bg-black/60 p-1 rounded-lg backdrop-blur-sm">
             @if (themeSignal()?.driveUrl) {
                <button 
                  (click)="setSource('drive')" 
                  class="px-3 py-1 text-xs font-bold rounded transition-colors"
                  [class]="currentSource() === 'drive' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-300 hover:text-white'"
                >
                  DRIVE
                </button>
             }
             @if (themeSignal()?.webUrl) {
                <button 
                  (click)="setSource('web')" 
                  class="px-3 py-1 text-xs font-bold rounded transition-colors"
                  [class]="currentSource() === 'web' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-300 hover:text-white'"
                >
                  WEB
                </button>
             }
          </div>

          @if (currentSource() === 'drive') {
             <iframe
               class="w-full aspect-video border-0"
               [class.hidden]="loading() || error()"
               [src]="safeVideoSrc()"
               allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
               allowfullscreen="true"
               mozallowfullscreen="true"
               webkitallowfullscreen="true"
               (load)="loading.set(false)"
             ></iframe>
          } @else {
             <video
               #videoPlayer
               class="w-full aspect-video"
               [class.hidden]="loading() || error()"
               [src]="currentVideoUrl()"
               controls
               (loadstart)="loading.set(true)"
               (canplay)="loading.set(false)"
               (error)="onVideoError()"
               (ended)="onVideoEnded()"
             ></video>
          }
        </div>

        <!-- Info Panel -->
        <div class="mt-4 bg-[#2f3136] rounded-lg p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h2 class="text-xl font-bold text-white truncate">
                {{ themeSignal()?.name }} - OP de "{{ themeSignal()?.animeName }}"
              </h2>
              <p class="text-gray-400 font-semibold truncate">
                Interpretado por <span class="text-red-400">{{ themeSignal()?.artist }}</span>
              </p>
            </div>

            <div class="flex gap-2 flex-shrink-0">
              <!-- Random Button -->
              <button
                (click)="random.emit()"
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                RANDOM
              </button>

              <!-- Download Link -->
              <a
                [href]="currentVideoUrl()"
                target="_blank"
                download
                class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                DOWNLOAD
              </a>
            </div>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500">
            <span><kbd class="bg-gray-800 px-2 py-1 rounded">Space</kbd> Play/Pause</span>
            <span><kbd class="bg-gray-800 px-2 py-1 rounded">←</kbd> Previous</span>
            <span><kbd class="bg-gray-800 px-2 py-1 rounded">→</kbd> Next</span>
            <span><kbd class="bg-gray-800 px-2 py-1 rounded">R</kbd> Random</span>
            <span><kbd class="bg-gray-800 px-2 py-1 rounded">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VideoPlayerComponent implements AfterViewInit {
  themeSignal = signal<AnimeTheme | null>(null);
  
  @Input() hasPrevious = false;
  @Input() hasNext = false;

  @Output() close = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() random = new EventEmitter<void>();

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  sanitizer = inject(DomSanitizer);

  loading = signal(true);
  error = signal(false);
  currentSource = signal<'drive' | 'web'>('drive');
  currentVideoUrl = signal('');
  
  safeVideoSrc = computed(() => {
    const src = this.currentVideoUrl();
    if (this.currentSource() === 'drive') {
        const match = src.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return this.sanitizer.bypassSecurityTrustResourceUrl(`https://drive.google.com/file/d/${match[1]}/preview`);
        }
    }
    return null;
  });

  @Input() 
  set theme(value: AnimeTheme | null) {
    this.themeSignal.set(value);
    this.error.set(false);
    
    if (value) {
        // Default to Drive if available, else Web
        if (value.driveUrl) {
            this.setSource('drive');
        } else {
            this.setSource('web');
        }
    } else {
        this.currentVideoUrl.set('');
    }
  }

  setSource(source: 'drive' | 'web') {
    this.currentSource.set(source);
    this.loading.set(true);
    this.error.set(false);
    
    const t = this.themeSignal();
    if (t) {
        const url = source === 'drive' ? (t.driveUrl || t.webUrl) : (t.webUrl || t.driveUrl);
        this.currentVideoUrl.set(url);
    }
  }

  @ViewChild('videoContainer') videoContainer!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
  }

  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.close.emit();
        break;
      case 'ArrowLeft':
        if (this.hasPrevious) this.previous.emit();
        break;
      case 'ArrowRight':
        if (this.hasNext) this.next.emit();
        break;
      case 'r':
      case 'R':
        this.random.emit();
        break;
      case ' ':
        event.preventDefault();
        this.togglePlayPause();
        break;
    }
  }

  togglePlayPause() {
    const video = this.videoPlayer?.nativeElement;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  }

  onVideoError() {
    this.loading.set(false);
    this.error.set(true);
    console.error('Error loading video', this.currentVideoUrl());
  }

  onVideoEnded() {
    if (this.hasNext) {
      this.next.emit();
    }
  }
}
