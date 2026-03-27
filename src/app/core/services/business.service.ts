import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, REQUEST } from '@angular/core';
import { BusinessModel } from '@models/business.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {
  private readonly URL = environment.api_business;
  private readonly defaultBusinessName = environment.defaultBusinessName;

  constructor(
    private httpClient: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(REQUEST) private request: any
  ) {}

  getBusinessHost(domain: string): Observable<BusinessModel> {
    return this.httpClient.get<BusinessModel>(`${this.URL}/info/${domain}`);
  }

  getNameHost(): string {
    let host: string | null = null;

    if (isPlatformBrowser(this.platformId)) {
      host = window.location.hostname;
    } else if (isPlatformServer(this.platformId) && this.request) {
      host = this.request.headers?.get('host') || null;
    }

    if (!host || host.includes('localhost')) {
      return this.defaultBusinessName;
    }

    // Clean up host: remove 'www.' and domain extensions
    return host.replace(/^www\./, '').split('.')[0];
  }
}
