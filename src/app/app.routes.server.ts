import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    {
        path: '',
        renderMode: RenderMode.Server,
    },
    {
        path: 'cart', 
        renderMode: RenderMode.Prerender,
    },
    {
        path: 'cart/info', 
        renderMode: RenderMode.Prerender,
    },
    {
        path: 'checkout',
        renderMode: RenderMode.Prerender,
    },
        {
        path: 'checkout/confirm/:param',
        renderMode: RenderMode.Server,
    },
    {
        path: 'info/*',
        renderMode: RenderMode.Server,
    },
    {
        path:'product/:param',
        renderMode: RenderMode.Server,
    },
    {
        path:'categories/:category',
        renderMode: RenderMode.Server
    },
    {
        path:'auth/*',
        renderMode: RenderMode.Server
    },
    {
        path:'**',
        renderMode: RenderMode.Client
    }
];