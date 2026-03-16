import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ShippingAddress } from '@models/shippingAddress.model';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { OrderService } from '@services/order.service';
import { ShippingService } from '@services/shipping.service';
import { Subscription } from 'rxjs';

declare var bootstrap: any;

@Component({
    selector: 'app-address',
    templateUrl: './address.component.html',
    styleUrl: './address.component.scss',
    standalone: false
})
export class AddressComponent implements OnInit, OnDestroy{

  newAddressSelected:boolean = false;
  @Output() addressSelected = new EventEmitter<ShippingAddress>();
  @Output() whatsappUpdated = new EventEmitter<string>();

  shippingAddress:ShippingAddress[] = [];
  wspPhone:string='';

  destroyShippinAddress?:Subscription;
  destroyNewShippingAddress?:Subscription;
  destroyLastOrder?:Subscription;

  userModel:UserModel = {} as UserModel;

  showPhoneError:boolean = false;
  showSelectedAddressError:boolean =  true;
  addressSelectedCombo:string = '1';

  constructor(private authService:AuthService, 
              private shippingService:ShippingService,
            private orderService:OrderService){
    
      if(this.authService.isLoggedIn()){
        this.shippingService.getShippingAdress();
        this.userModel = this.authService.getUserFromLocalStorage();
      }
    
  }
  ngOnDestroy(): void {
    if(this.destroyShippinAddress)
      this.destroyShippinAddress.unsubscribe();
    if(this.destroyNewShippingAddress)
      this.destroyNewShippingAddress.unsubscribe();
    if(this.destroyLastOrder)
      this.destroyLastOrder.unsubscribe();
  }
  ngOnInit(): void {

    this.setPhoneWsp(this.userModel.phone);
    
    this.destroyShippinAddress = this.shippingService.shippingAddress.subscribe(items => {
      
      this.shippingAddress = items;
      this.setAddress(this.shippingAddress[0]);
      this.showSelectedAddressError = false;

      if(this.shippingAddress[0].contact){
        this.setPhoneWsp(this.shippingAddress[0].contact);
        this.addressSelectedCombo = this.shippingAddress[0].id;
      }

      this.destroyLastOrder = this.orderService.lastOrder.subscribe( lastOrder => {
        //console.log('new phone aaa ', this.shippingAddress);
        this.shippingAddress.forEach( addre =>{
          
          if(addre.id===lastOrder.shipping_address_id){
            this.setAddress(addre);
            this.addressSelectedCombo = addre.id;
            this.setPhoneWsp(lastOrder.contact);
            return;
          }
        });
      });
     

    });

    this.destroyNewShippingAddress = this.shippingService.newShippingAddress.subscribe(newItem => {
      
      if(newItem.id!=undefined){

        this.shippingAddress.push(newItem);
        this.addressSelectedCombo = newItem.id;
        this.setAddress(newItem);
        
        if(newItem.contact)
          this.setPhoneWsp(newItem.contact);
        
      }
    });


  }

  setAddress(newAddress: ShippingAddress) {

    if(newAddress.id=='' || newAddress.id==undefined)
      this.showSelectedAddressError = true;
    else
      this.showSelectedAddressError = false;
    
    this.addressSelected.emit(newAddress);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const charCode = event.key.charCodeAt(0);
    // Permitir números (0–9) y teclas especiales como retroceso (Backspace)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onBlurPhone(){
    this.updateWhatsapp(this.wspPhone);
  }

  newAddress = {
    name: '',
    address: '',
    number: '',
    houseNumber: '',
    phone: ''
  };

  handleAddressSelection(event: Event) {
    
    const selectedValue = (event.target as HTMLSelectElement).value;

    if(selectedValue=='1')
      this.setAddress({} as ShippingAddress);
    else{
      let sel:ShippingAddress|undefined = this.shippingAddress.find(address => address.id === selectedValue);
      if(sel!=undefined)
        this.setAddress(sel);
    }
    //set number
    this.shippingAddress.forEach(item => {
      
      if(item.id === selectedValue){
        if(item.contact=='' || item.contact==undefined)
          this.setPhoneWsp(this.userModel.phone);
        else
          this.setPhoneWsp(item.contact);
        
      }
    })
    
  }

  saveNewAddress() {
    this.newAddress = { name: '', address: '', number: '', houseNumber: '', phone: '' };
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAddressModal') as HTMLElement);
    modal?.hide();
  }

  private setPhoneWsp(phone:string){
    this.wspPhone = phone;
    this.updateWhatsapp(phone);
  }

  private updateWhatsapp(newNumber: string) {
    if(newNumber=='')
      this.showPhoneError = true;
    else
      this.showPhoneError = false;
    this.whatsappUpdated.emit(newNumber);
  }
}
