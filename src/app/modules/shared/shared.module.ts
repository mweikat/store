import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImgBrokenDirective } from '@directives/img-broken.directive';
import { ComaToDotPipe } from '@pipes/coma-to-dot.pipe';
import { HtmlSanitizePipe } from '@pipes/html-sanitize.pipe';
import { RecaptchaComponent } from './recaptcha/recaptcha.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { CartMenuComponent } from './cart-menu/cart-menu.component';
import { SearchComponent } from './search/search.component';
import { OrderStatus } from '@pipes/orderStatus.pipe';
import { CheckoutStepsComponent } from './checkout-steps/checkout-steps.component';



@NgModule({
  declarations: [
    ImgBrokenDirective,
    ComaToDotPipe,
    OrderStatus,
    HtmlSanitizePipe,
    RecaptchaComponent,
    UserMenuComponent,
    CartMenuComponent,
    SearchComponent,
    CheckoutStepsComponent
  ],
  imports: [
    CommonModule,
    RouterLink,
    NgOptimizedImage
  ],
  exports:[
    CartMenuComponent,
    ImgBrokenDirective,
    ComaToDotPipe,
    OrderStatus,
    HtmlSanitizePipe,
    RecaptchaComponent,
    NgOptimizedImage,
    SearchComponent,
    UserMenuComponent,
    CheckoutStepsComponent,
    RouterLink
  ]
})
export class SharedModule { }
