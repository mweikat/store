import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainHomeComponent } from './home/main-home/main-home.component';
import { SharedModule } from '@modules/shared/shared.module';
import { RouterLink } from '@angular/router';


@NgModule({
  declarations: [
    MainHomeComponent,
  ],
  imports: [
    CommonModule,
    RouterLink,
    SharedModule
  ]
})
export class HomeModule { }
