import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChangePasswordModel } from '@models/changePassword.model';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';

@Component({
    selector: 'app-user-change-pass',
    templateUrl: './user-change-pass.component.html',
    styleUrl: './user-change-pass.component.scss',
    standalone: false
})
export class UserChangePassComponent {

  passwordForm: FormGroup;
  user:UserModel = {} as UserModel;

  @ViewChild('passwordInput') passwordInput:ElementRef|any;
  @ViewChild('passwordInput1') passwordInput1:ElementRef|any;
  @ViewChild('passwordInput2') passwordInput2:ElementRef|any;

  eyeClass:string = 'visibility_off';
  isShowing:boolean = false;

  constructor(private fb: FormBuilder, private userService: UserService, private authService:AuthService){

    this.user = this.authService.getUserFromLocalStorage();

    if(this.user.g_user == '0')
      this.passwordForm = this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      });
    else
      this.passwordForm = this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      });
  }

  
  changePassword(): void {

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const changePassModel = {} as ChangePasswordModel;

    changePassModel.old_password = this.passwordForm.value.currentPassword;

    changePassModel.new_password = this.passwordForm.value.newPassword;
    changePassModel.new_password_confirmation = this.passwordForm.value.confirmPassword;

    this.userService.changePassword(changePassModel);/*.subscribe({
      next: () => alert('Contraseña cambiada correctamente.'),
      error: () => alert('Hubo un error al cambiar la contraseña.'),
    });*/
  }

showPass(){

  if(this.isShowing){
    this.passwordInput.nativeElement.type='password';
    this.passwordInput1.nativeElement.type='password';
    this.passwordInput2.nativeElement.type='password';
    this.eyeClass='visibility_off';
    this.isShowing=false;
  }else{
    this.passwordInput.nativeElement.type='text';
    this.passwordInput1.nativeElement.type='text';
    this.passwordInput2.nativeElement.type='text';
    this.eyeClass='visibility';
    this.isShowing=true;
  }
  
}

}
