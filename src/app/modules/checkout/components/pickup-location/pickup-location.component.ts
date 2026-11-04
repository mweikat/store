import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { PickupLocationModel } from '@models/pickupLocation.model';
import { ShippingBusinessService } from '@services/shipping-business.service';

@Component({
  selector: 'app-pickup-location',
  templateUrl: './pickup-location.component.html',
  styleUrl: './pickup-location.component.scss',
  standalone: false
})
export class PickupLocationComponent implements OnInit {
  private shippingBusinessService = inject(ShippingBusinessService);

  @Input() selectedLocationId: number | string | null = null;
  @Input() contactPhone: string = '';
  @Output() locationSelected = new EventEmitter<PickupLocationModel>();
  @Output() contactPhoneChange = new EventEmitter<string>();

  locations = signal<PickupLocationModel[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.shippingBusinessService.getPickupLocations().subscribe({
      next: (items) => {
        const activeLocations = (items || []).filter(item => item.is_active !== false);
        this.locations.set(activeLocations);
        this.isLoading.set(false);

        if (activeLocations.length > 0) {
          const preselected = this.selectedLocationId
            ? activeLocations.find(l => String(l.id) === String(this.selectedLocationId))
            : activeLocations[0];

          if (preselected) {
            this.selectLocation(preselected);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No fue posible cargar los puntos de retiro. Por favor, reintenta más tarde.');
      }
    });
  }

  selectLocation(location: PickupLocationModel): void {
    this.selectedLocationId = location.id;
    this.locationSelected.emit(location);
  }

  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.contactPhone = input.value;
    this.contactPhoneChange.emit(this.contactPhone);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    if ((charCode < 48 || charCode > 57) && event.key !== '+') {
      event.preventDefault();
    }
  }
}
