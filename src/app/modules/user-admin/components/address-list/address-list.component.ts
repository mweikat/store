import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShippingAddress } from '@models/shippingAddress.model';
import { ShippingService } from '@services/shipping.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
    selector: 'app-address-list',
    templateUrl: './address-list.component.html',
    styleUrl: './address-list.component.scss',
    standalone: false
})
export class AddressListComponent implements OnInit, OnDestroy{


  address:ShippingAddress[] = [];
  toShipDelete:ShippingAddress = {} as ShippingAddress;
  modalInstance: any;

  private detroyShipping?:Subscription;
  private destroyNewShipping?:Subscription;
  private destroyUpdatedShipping?:Subscription;
  private destroyDeleteShipping?:Subscription;

  constructor(private shipService:ShippingService){
    this.shipService.getShippingAdress();
  }

  ngOnInit(): void {
    
    this.detroyShipping = this.shipService.shippingAddress.subscribe(address => {
      this.address = address;
    });

    this.destroyNewShipping = this.shipService.newShippingAddress.subscribe(item => {
      if(item){
        this.address.push(item);
      }
    });

    this.destroyUpdatedShipping = this.shipService.updatedShippingAddress.subscribe(item=>{
      if(item){
        this.updateAddresses(item);
      }
    });

    this.destroyDeleteShipping = this.shipService.deleteShippingAddress.subscribe(item => {
      if(item){
        this.deleteAddress(item);
      }
    });

  }
  ngOnDestroy(): void {
    if(this.detroyShipping)
      this.detroyShipping.unsubscribe();
    if(this.destroyNewShipping)
      this.destroyNewShipping.unsubscribe();
    if(this.destroyUpdatedShipping)
      this.destroyUpdatedShipping.unsubscribe();
    if(this.destroyDeleteShipping)
      this.destroyDeleteShipping.unsubscribe();
  }

  delete(){
    
    this.shipService.delete(this.toShipDelete);
    this.modalHide();
  }

  edit(ship:ShippingAddress){
    this.shipService.initEdt(ship);
  }

  updateDefault(ship:ShippingAddress){
    
    this.shipService.updateDefalutAddress(ship.id);

  }

  modalShow(ship:ShippingAddress) {

    this.toShipDelete = ship;

    if (!this.modalInstance) {
      this.initializeModal(); // Inicializa el modal si no existe
    }
    this.modalInstance.show();
  }
  
  modalHide(){
    this.toShipDelete = {} as ShippingAddress;

    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }
  

  private updateAddresses(newItem: ShippingAddress) {
    // Eliminar el elemento con el ID especificado
    const updatedAddresses = this.address.filter((address) => address.id !== newItem.id);
  
    // Agregar el nuevo elemento al principio del arreglo
    updatedAddresses.unshift(newItem);
  }

  private deleteAddress(item:ShippingAddress){
    
    this.address = this.address.filter((address) => address.id !== item.id);
  }

  private initializeModal() {
    const modalElement = document.getElementById('staticBackdrop') as HTMLElement;
    this.modalInstance = new bootstrap.Modal(modalElement);
  }


}
