import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '@services/seo.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
  standalone: true
})
export class NotFoundComponent {

  constructor(private seoService:SeoService){

    this.seoService.setTitle('404 No encontrado');
    this.seoService.setCanonical();
    this.seoService.setIndexFallow(false);

  }

}
