import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.static(browserDistFolder, {
  maxAge: '1y'
}));

 // 1. INTERCEPTOR PARA SITEMAP.XML - DEBE IR ANTES DE LAS RUTAS ESTÁTICAS
app.get('/sitemap.xml', async (req, res): Promise<void> => {
    try {
        // Obtener el dominio desde el Host header
        const host = req.get('host') || '';
        let domain = host.replace(/www\./, ''); // Remover www si existe
        let domain_sin_punto = domain.replace('.cl', ''); // remover .cl
        
        console.log(`Generando sitemap para dominio: ${domain}`);

        // Manejo de localhost
        const isLocalhost = domain.includes('localhost');
        if (isLocalhost) {
            domain = 'localhost:4000'; // Usar puerto de desarrollo
            domain_sin_punto = 'mipatita'; // Default para desarrollo
        }

        // URL base para las APIs
        const apiBaseUrl = isLocalhost 
            ? `http://localhost:8000`  // HTTP para localhost
            : `https://backstore.lil.cl`; // HTTPS para producción

        // 1. OBTENER EL BUSINESS_ID SEGÚN EL DOMINIO
        const businessResponse = await fetch(
            `${apiBaseUrl}/api/v1/business/info/${domain_sin_punto}`
        );
        
        if (!businessResponse.ok) {
            throw new Error(`Error obteniendo business: ${businessResponse.status}`);
        }
        
        const businessData = await businessResponse.json();
        
        if (!businessData?.id) {
            res.status(404).send('Business no encontrado');
            return;  // ← AÑADE return EXPLÍCITO
        }

        //console.log('Business ID detectado: ',businessData.id);

        // 2. OBTENER EL SITEMAP DESDE TU BACKEND CON EL BUSINESS_ID
        const sitemapResponse = await fetch(
            `${apiBaseUrl}/api/v1/business/urls-pub/${businessData.id}`
        );
        
        if (!sitemapResponse.ok) {
            throw new Error(`Error del backend: ${sitemapResponse.status}`);
        }

        let xmlContent = await sitemapResponse.text();

        //console.log('xmlContent: ', xmlContent);

        // 3. ¡¡¡CRÍTICO: LIMPIAR EL XML!!!
        // ==================================
        // 1. Trim espacios al inicio y final
        xmlContent = xmlContent.trim();
        
        // 2. Eliminar Byte Order Mark (BOM) si existe
        if (xmlContent.charCodeAt(0) === 0xFEFF) {
            xmlContent = xmlContent.substring(1);
        }
        
        // 3. Encontrar dónde realmente empieza <?xml
        const xmlStartIndex = xmlContent.indexOf('<?xml');
        if (xmlStartIndex > 0) {
            // Hay contenido antes del XML, eliminarlo
            //console.warn(`⚠️  Encontrado ${xmlStartIndex} caracteres antes del XML. Limpiando...`);
            xmlContent = xmlContent.substring(xmlStartIndex);
        }
        
        // 4. Asegurar que empieza exactamente con <?xml
        if (!xmlContent.startsWith('<?xml')) {
            // Si no empieza con <?xml, forzarlo
            //console.warn('⚠️  XML no empieza correctamente. Ajustando...');
            xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + 
                        xmlContent.replace(/^[\s\S]*?(<urlset)/, '$1');
        }
        
        // 5. Debug: ver primeros caracteres (códigos ASCII)
        //console.log('Primeros 10 caracteres (códigos):');
        for (let i = 0; i < Math.min(10, xmlContent.length); i++) {
            console.log(`  [${i}]: '${xmlContent[i]}' (${xmlContent.charCodeAt(i)})`);
        }
        
        // 6. CONFIGURAR CACHE (IMPORTANTE PARA SEO)
        // Headers ANTES de enviar
        res.set({
            'Content-Type': 'application/xml; charset=UTF-8', // charset explícito
            'Cache-Control': 'public, max-age=21600', // 6 horas en segundos
            'Last-Modified': new Date().toUTCString(),
            'X-Sitemap-Domain': domain,
            'X-Business-Id': businessData.id
        });
        
        // 7. ENVIAR EL XML LIMPIO
        res.send(xmlContent);
        
    } catch (error) {
        console.error('Error generando sitemap:', error);
        res.status(500).send('Error generando sitemap');
    }
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
