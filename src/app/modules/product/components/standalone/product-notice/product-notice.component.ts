import { CommonModule } from '@angular/common';
import { Component, effect, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationAlarmModel } from '@models/notificationAlarm.model';
import { ProductModel } from '@models/product.model';
import { AuthService } from '@services/auth.service';
import { CustomvalidationService } from '@services/customvalidation.service';
import { ProductsService } from '@services/products.service';

@Component({
  selector: 'app-product-notice',
  standalone: true,
  templateUrl: './product-notice.component.html',
  styleUrl: './product-notice.component.scss',
  imports:[CommonModule, FormsModule, ReactiveFormsModule]
})
export class ProductNoticeComponent {

  product = input.required<ProductModel>();
  private fb:FormBuilder = inject(FormBuilder);
  private customValidator = inject(CustomvalidationService);
  private authService = inject(AuthService);
  private productService =  inject(ProductsService);
  isSubmitting = false;
  isUserLogged = false;

  private currentUser = this.authService.getUserFromLocalStorage();

  statusNoti = this.productService.$status_noti;

  form:FormGroup = this.fb.group({
    email: [{value:'', disabled: false},[Validators.required,Validators.pattern(this.customValidator.emailValidation()), Validators.maxLength(200)]],
    name: [{value:'', disabled: false},[Validators.required, Validators.maxLength(100)]],
    phone:[{value:'', disabled: false},[Validators.required, Validators.pattern(this.customValidator.telefono9Digitos())]]
  });

  constructor(){
    
    this.productService.statusNotificationAlarm();

    effect(()=>{
      
      if(this.currentUser.email!=undefined && this.statusNoti().value==='1'){
        this.fillForm();
        this.isUserLogged = true;
      }
    });
  }

  fillForm(){

    this.form.setValue({
        name  : this.currentUser.name,
        email : this.currentUser.email,
        phone : this.currentUser.phone
    });


  }

  onSubmit(){
   this.form.markAllAsTouched();
    
    if(!this.form.valid){
         return;
    }

    if(!this.isSubmitting){

      let noti = {} as NotificationAlarmModel;

      if(this.currentUser.email!=undefined)
        noti.clientId=this.currentUser.id;

      noti.client_name=this.form.value.name;
      noti.email=this.form.value.email;
      noti.phone = this.form.value.phone;
      noti.productId = this.product().id;
      noti.product_name = this.product().name;

      this.productService.saveNotificationAlarm(noti);


      this.isSubmitting =  true;
    }
    
  }

  allowOnlyNumbers(event: KeyboardEvent){
    return this.customValidator.allowOnlyNumbers(event);
  }

  getErrorMessage(term:string) {

    if (term=='name'&&this.form.get('name')?.hasError('required')) 
      return 'Su nombre es requerido';

    if (term=='email'&&this.form.get('email')?.hasError('required')) 
      return 'Su email es requerido';
    
    if (term=='email'&&this.form.get('email')?.hasError('pattern')) 
      return 'Su email no es válido';

    if (term=='phone'&&this.form.get('phone')?.hasError('required')) 
      return 'Su Teléfono es requerido';

    if (term=='phone'&&this.form.get('phone')?.hasError('pattern')) 
      return 'Su Teléfono no es válido';

    return '';
  }


}
