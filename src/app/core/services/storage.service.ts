import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly oneDay = 24 * 60 * 60 * 1000;
  private readonly oneMonth = 24 * 60 * 60 * 1000 * 30;
  private readonly oneYear = 24 * 60 * 60 * 1000 * 30 * 12;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  setWithExpiry(key: string, value: any, time: string): void {
    
    if (!this.isBrowser()) return;

    let ttl = 0;
    
    switch (time) {
      case '1d':
        ttl = this.oneDay; 
        break;
      case '1m':
        ttl = this.oneMonth;
        break;
      case '1y':
        ttl = this.oneYear;
        break;
    }


    const item = {
      data: value,
      timestamp: new Date().getTime(),
      ttl: ttl
    };

    sessionStorage.setItem(key, JSON.stringify(item));
  }

  getWithExpiry<T>(key: string): T | null {
    if (!this.isBrowser()) return null;

    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();

      if (!item.timestamp || (now - item.timestamp > item.ttl)) {
        sessionStorage.removeItem(key);
        return null;
      }

      return item.data as T;

    } catch (error) {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isBrowser()) return;
    sessionStorage.removeItem(key);
  }
}