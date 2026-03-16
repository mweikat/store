import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  $isLoading = signal(false);

  show() {
    if(isPlatformBrowser(this.platformId))
      this.$isLoading.set(true);
  }

  hide() {
    if(isPlatformBrowser(this.platformId))
      this.$isLoading.set(false);
  }

  
}
