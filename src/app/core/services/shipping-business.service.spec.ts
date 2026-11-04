import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ShippingBusinessService } from './shipping-business.service';
import { environment } from 'src/environments/environment';
import { PickupLocationModel } from '@models/pickupLocation.model';
import { DeliveryScheduleDay, DeliveryScheduleSettings } from '@models/deliverySchedule.model';

describe('ShippingBusinessService', () => {
  let service: ShippingBusinessService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ShippingBusinessService]
    });
    service = TestBed.inject(ShippingBusinessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPickupLocations should call GET /api/v1/shipping_business/pickup-locations', () => {
    const mockLocations: PickupLocationModel[] = [
      { id: 1, name: 'Sucursal Central', address: 'Av. Providencia 1234', is_active: true }
    ];

    service.getPickupLocations().subscribe(locations => {
      expect(locations.length).toBe(1);
      expect(locations[0].name).toBe('Sucursal Central');
    });

    const req = httpMock.expectOne(`${environment.api_shipping_business}/pickup-locations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLocations);
  });

  it('getDeliveryScheduleSettings should call GET /api/v1/shipping_business/delivery-schedule/settings', () => {
    const mockSettings: DeliveryScheduleSettings = {
      min_advance_minutes: 120,
      max_days_ahead: 7
    };

    service.getDeliveryScheduleSettings().subscribe(settings => {
      expect(settings.min_advance_minutes).toBe(120);
      expect(settings.max_days_ahead).toBe(7);
    });

    const req = httpMock.expectOne(`${environment.api_shipping_business}/delivery-schedule/settings`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSettings);
  });

  it('getDeliveryScheduleAvailability should call GET /api/v1/shipping_business/delivery-schedule/availability?from=...&to=...', () => {
    const from = '2026-11-05';
    const to = '2026-11-12';
    const mockAvailability: DeliveryScheduleDay[] = [
      {
        date: '2026-11-05',
        slots: [
          { id: 10, date: '2026-11-05', start_time: '09:00', end_time: '12:00', available_quota: 3 }
        ]
      }
    ];

    service.getDeliveryScheduleAvailability(from, to).subscribe(days => {
      expect(days.length).toBe(1);
      expect(days[0].slots[0].available_quota).toBe(3);
    });

    const req = httpMock.expectOne(`${environment.api_shipping_business}/delivery-schedule/availability?from=${from}&to=${to}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAvailability);
  });
});
