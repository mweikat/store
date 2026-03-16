import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductRoutingModule } from './product-routing.module';
import { ProductLayoutComponent } from './product-layout/product-layout.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadCrumbComponent } from './components/standalone/bread-crumb/bread-crumb.component';
import { CategoryRelComponent } from './components/standalone/category-rel/category-rel.component';
import { DescriptionComponent } from './components/standalone/description/description.component';
import { ProductSkeletonComponent } from './components/standalone/product-skeleton/product-skeleton.component';
import { ProductNoticeComponent } from './components/standalone/product-notice/product-notice.component';
import { ProductBundlesComponent } from './components/standalone/product-bundles/product-bundles.component';
import { ProductAttributesComponent } from './components/standalone/product-attributes/product-attributes.component';


@NgModule({
  declarations: [
    ProductLayoutComponent,
    ProductDetailComponent
    
  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    BreadCrumbComponent,
    CategoryRelComponent,
    DescriptionComponent,
    ProductSkeletonComponent,
    ProductNoticeComponent,
    ProductBundlesComponent,
    ProductAttributesComponent
  ]
})
export class ProductModule { }
