import { Component, computed, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-description',
  imports: [],
  templateUrl: './description.component.html',
  styleUrl: './description.component.scss'
})
export class DescriptionComponent {

  desc = input.required<string>();
  
  displayedDescription = computed(() => {
    return this.desc ? this._sanitizer.bypassSecurityTrustHtml(this.desc()) : null;
  });

  constructor(private _sanitizer: DomSanitizer){}

}
