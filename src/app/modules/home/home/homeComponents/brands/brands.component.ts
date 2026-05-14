import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { BrandService } from '@services/brand.service';

@Component({
    selector: 'app-brands',
    templateUrl: './brands.component.html',
    styleUrl: './brands.component.scss',
    imports:[CommonModule, SharedModule],
    standalone: true
})
export class BrandsComponent implements OnChanges{

    @Input() title?: string;
    @Input() desc?: string;
    @Input() ttl: string = '';

    private brandService = inject(BrandService);
    brands = this.brandService.brandArraySignal;

    constructor(){}

    ngOnChanges(changes: SimpleChanges): void {
        if(changes['ttl'].currentValue !== undefined && changes['ttl'].currentValue !== ''){
            this.brandService.getBrands(this.ttl);
        }
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
