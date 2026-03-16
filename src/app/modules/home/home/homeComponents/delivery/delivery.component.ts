import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TenantService } from 'src/app/core/tenants/tenants.service';

@Component({
    selector: 'app-delivery',
    templateUrl: './delivery.component.html',
    styleUrl: './delivery.component.scss',
    imports:[CommonModule],
    standalone: true
})
export class DeliveryComponent {

    @Input() title?: string;
    @Input() desc?: string;
    private tenantService = inject(TenantService);
    business = this.tenantService.getCurrentBusiness();
    
}
