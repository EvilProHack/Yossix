import { Injectable } from '@angular/core';
import { AnimeParserLogic } from './anime.parser.logic';

@Injectable({ providedIn: 'root' })
export class AnimeParser {
    private logic = new AnimeParserLogic();

    parseTotalCount(html: string): number {
        return this.logic.parseTotalCount(html);
    }

    parseSearchResult(html: string): any | null {
        return this.logic.parseSearchResult(html);
    }

    parseHtml(html: string): any[] {
        return this.logic.parseHtml(html);
    }
}
