import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CitiesModel } from '@models/cities.model';
import { RegionModel } from '@models/regions.model';
import { ShippingAddress } from '@models/shippingAddress.model';
import { ShippingBusinessService } from '@services/shipping-business.service';
import { ShippingService } from '@services/shipping.service';
import { isPlatformBrowser } from '@angular/common';

declare var bootstrap: any;

@Component({
    selector: 'app-address-add-edt',
    templateUrl: './address-add-edt.component.html',
    styleUrls: ['./address-add-edt.component.scss'],
    standalone: false
})
export class AddressAddEdtComponent implements OnInit, OnDestroy {

  @Input('btnPluss') btnPluss:boolean = false;

  regions: RegionModel[] = [];
  cities: CitiesModel[] = [];
  shippingModel: ShippingAddress = {} as ShippingAddress;
  addressForm!: FormGroup;
  modalInstance: any;
  action: string = 'new';
  initiatedForm:boolean = false;
  

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private shipService: ShippingService,
    private shippingBusinessService: ShippingBusinessService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    
  }

  ngOnInit(): void {
    
    

    this.shipService.edtShippingAddress
      .pipe(takeUntil(this.destroy$))
      .subscribe(item => this.handleEditShippingAddress(item));

    this.shippingBusinessService.regions
      .pipe(takeUntil(this.destroy$))
      .subscribe(regions => (this.regions = regions));

    this.shippingBusinessService.cities
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => (this.cities = cities));


    if(isPlatformBrowser(this.platformId)){ 
      this.initializeForm();
      this.initializeModal();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize FormGroup
  private async initializeForm() {
    this.addressForm = await this.fb.group({
      region: [0, [Validators.min(1)]],
      city: [0, [Validators.min(1)]],
      name: ['', [Validators.required, Validators.maxLength(30)]],
      address: ['', [Validators.required, Validators.maxLength(100)]],
      number: ['', [Validators.required, Validators.maxLength(10)]],
      houseNumber: ['', [Validators.maxLength(100)]],
      phone: ['', [Validators.pattern('^[0-9]{0,9}$')]],
      obs: ['', [Validators.maxLength(200)]]
    });

    this.initiatedForm = true;
  }

  // Handle editing an address
  private handleEditShippingAddress(item: ShippingAddress | null): void {
    if (item) {
      this.modalShow();
      this.action = 'edt';
      this.shippingModel = item;
      this.fillForm();
      this.getCities('edt');
      this.shippingBusinessService.getRegions();
    }
  }

  // Form controls getter
  get f() {
    return this.addressForm.controls;
  }

  // Modal management
  private initializeModal(): void {
    const modalElement = document.getElementById('addAddressModal') as HTMLElement;
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
    }
  }

  modalShow(): void {
    this.modalInstance?.show();
  }

  modalHide(): void {
    this.modalInstance?.hide();
  }

  modalShowNew(): void {
    this.action = 'new';
    this.clearForm();
    this.modalShow();
    this.shippingBusinessService.getRegions();
  }

  // Save Address
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const formValues = this.addressForm.value;
    Object.assign(this.shippingModel, {
      name: formValues.name,
      address_line1: formValues.address,
      address_line2: formValues.number,
      nro: formValues.houseNumber,
      contact: formValues.phone,
      obs: formValues.obs,
      default: '1',
      region_id: +formValues.region,
      city_id: +formValues.city
    });

    if (this.action === 'new') {
      this.shipService.storeShippingAddress(this.shippingModel);
    } else {
      this.shipService.updateShippingAddress(this.shippingModel);
    }

    this.modalHide();
    this.clearForm();
  }

  // Form Utilities
  clearForm(): void {
    this.initializeForm();
    this.shippingModel = {} as ShippingAddress;
  }

  fillForm(): void {
    if (!this.shippingModel) return;

    this.addressForm.patchValue({
      region: this.shippingModel.region_id || 0,
      city: this.shippingModel.city_id || 0,
      name: this.shippingModel.name || '',
      address: this.shippingModel.address_line1 || '',
      number: this.shippingModel.address_line2 || '',
      houseNumber: this.shippingModel.nro || '',
      phone: this.shippingModel.contact || '',
      obs: this.shippingModel.obs || ''
    });
  }

  getCities(changeFrom:string): void {

    const regionId = this.addressForm.value.region;
    if (regionId!=0) {
      
      if(changeFrom=='dropdown')
        this.addressForm.get('city')?.setValue(0);

      this.shippingBusinessService.getCities(regionId);
    }
  }

  // Event Handlers
  allowOnlyNumbers(event: KeyboardEvent): void {
    if (event.key < '0' || event.key > '9') {
      event.preventDefault();
    }
  }
}
