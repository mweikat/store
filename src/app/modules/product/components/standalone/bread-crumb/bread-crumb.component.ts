import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoryModel } from '@models/category.model';

@Component({
  selector: 'app-bread-crumb',
  imports: [CommonModule, RouterModule],
  templateUrl: './bread-crumb.component.html',
  styleUrl: './bread-crumb.component.scss'
})
export class BreadCrumbComponent {

  @Input('categories') categories:CategoryModel[] = []
}
