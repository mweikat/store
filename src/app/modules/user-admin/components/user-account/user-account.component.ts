import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { UserService } from '@services/user.service';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrl: './user-account.component.scss',
    standalone: false
})
export class UserAccountComponent implements OnInit {

  userModel:UserModel = {} as UserModel;
  userForm: FormGroup;
  isEmailVerified: boolean = true;
  email:string='';

  constructor(private fb: FormBuilder, private userService: UserService, private authService:AuthService ) {

    this.userService.getUserLoggedInfoFromServer();

    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,15}$/)]],
    });


  }

  ngOnInit(): void {
    
      this.loadUserData();
  
  }

  loadUserData(): void {

    this.userModel = this.authService.getUserFromLocalStorage();

    this.userForm.patchValue({
      firstName: this.userModel.name,
      lastName: this.userModel.lastName,
      phone: this.userModel.phone,
    });

    if(this.userModel.email_verified_at==null)
      this.isEmailVerified = false;

    this.email = this.userModel.email;
  }

  updateUserInfo(): void {

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.userModel.name = this.userForm.value.firstName;
    this.userModel.lastName = this.userForm.value.lastName;
    this.userModel.phone = this.userForm.value.phone;

    this.userService.updateUserInfo(this.userModel);
  }

  resendVerificationEmail(): void {
    this.userService.resendVerifiedEmail();
  }

}