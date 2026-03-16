import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { BrandService } from '@services/brand.service';

@Component({
    selector: 'app-brands',
    templateUrl: './brands.component.html',
    styleUrl: './brands.component.scss',
    imports:[CommonModule, SharedModule],
    standalone: true
})
export class BrandsComponent {

    @Input() title?: string;
    @Input() desc?: string;

    private brandService = inject(BrandService);
    brands = this.brandService.brandArraySignal;

    constructor(){
        this.brandService.getBrands();
    }

    getBrandChunks() {
        const brandsArray = this.brands();
        const chunkSize = 4;
        const chunks = [];
        
        for (let i = 0; i < brandsArray.length; i += chunkSize) {
        chunks.push(brandsArray.slice(i, i + chunkSize));
        }
        
        return chunks;
    }
}
