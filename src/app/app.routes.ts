import { Routes } from '@angular/router';
import { LayoutauthComponent } from '@modules/auth/layoutauth/layoutauth.component';
import { AdminGuard } from './core/guard/admin.guard';
import { LogoutComponent } from '@modules/pages/logout/logout.component';
import { LayoutpagesComponent } from '@modules/pages/layoutpages/layoutpages.component';
import { CartLayoutComponent } from '@modules/cart/cart-layout/cart-layout.component';
import { CheckoutLayoutComponent } from '@modules/checkout/checkout-layout/checkout-layout.component';
import { ProductLayoutComponent } from '@modules/product/product-layout/product-layout.component';
import { UserAdminLayoutComponent } from '@modules/user-admin/user-admin-layout/user-admin-layout.component';
import { CatLayoutComponent } from '@modules/categories/cat-layout/cat-layout.component';
import { MainHomeComponent } from '@modules/home/home/main-home/main-home.component';
import { NotFoundComponent } from '@modules/globals/not-found/not-found.component';

export const routes: Routes = [

    {path:'', pathMatch:'full',component:MainHomeComponent, loadChildren:() => import('@modules/home/home.module').then(m => m.HomeModule)},
    {path:'auth', component:LayoutauthComponent,loadChildren:() => import('@modules/auth/auth.module').then(m => m.AuthModule) },
    {path:'info', component: LayoutpagesComponent, loadChildren:() => import('@modules/pages/pages.module').then(m => m.PagesModule)},
    {path:'cart',component:CartLayoutComponent,loadChildren:() => import('@modules/cart/cart.module').then( m => m.CartModule)},
    {path:'checkout', canActivate:[AdminGuard], component:CheckoutLayoutComponent,loadChildren:() => import('@modules/checkout/checkout.module').then( m => m.CheckoutModule)},
    {path:'product', component:ProductLayoutComponent,loadChildren:() => import('@modules/product/product.module').then( m => m.ProductModule)},
    {path:'admin',canActivate:[AdminGuard],component:UserAdminLayoutComponent,loadChildren:()=> import('@modules/user-admin/user-admin.module').then(m=>m.UserAdminModule)},
    {path:'logout',canActivate:[AdminGuard],component:LogoutComponent},
    {path:'categories',component:CatLayoutComponent, loadChildren:()=> import('@modules/categories/categories.module').then(m=>m.CategoriesModule)},
    {path:'404', component:NotFoundComponent}
    
    
];
