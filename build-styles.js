// build-styles.js
const sass = require('sass');
const fs = require('fs');
const path = require('path');

console.log('🎨 Generando estilos para businesses...');

// 1. Leer tu archivo styles.scss actual
const mainStylesPath = path.join(__dirname, 'src', 'styles.scss');
const mainStylesContent = fs.readFileSync(mainStylesPath, 'utf8');

// 2. Lista de businesses - ESTOS DEBEN COINCIDIR CON LOS styleFile DE TU API
const businesses = [
  { name: 'mipatita' },
  { name: 'lil' },
  // Añade más según lo que devuelva tu API
];

async function borrarArchivo(ruta) {
  try {
    await fs.unlink(ruta);
    console.log('Archivo eliminado correctamente:', ruta);
  } catch (err) {
    console.error('Error al eliminar el archivo:', err);
  }
}

// 4. Generar CSS para cada business
businesses.forEach(business => {
  try {
    // Reemplazar la importación de variables
    const businessScssContent = mainStylesContent.replace(
      /@use ['"]src\/styles-var\.scss['"] as vars\s*;/,
      `@use 'app/shared/styles/variables/${business.name}' as vars;`
    );

    // Compilar SCSS a CSS
    const result = sass.compileString(businessScssContent, {
      loadPaths: [path.join(__dirname, 'src')],
      style: 'compressed'
    });

    //carpeta de salida
    const outputDir = path.join(__dirname, 'src', 'assets', 'styles',business.name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    //si el archivo existe se borra
    const ruta = outputDir+'/'+business.name+'.css';
    if (!fs.existsSync(ruta)) {
      borrarArchivo(ruta);
    }

    // Escribir archivo CSS
    const outputPath = path.join(outputDir, `${business.name}.css`);
    fs.writeFileSync(outputPath, result.css);
    
    console.log(`✅ Generado: ${business.name}.css`);
  } catch (error) {
    console.error(`❌ Error generando ${business.name}.css:`, error.message);
  }
});

console.log('🎨 Todos los estilos de businesses generados!');