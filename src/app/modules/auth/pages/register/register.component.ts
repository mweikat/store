import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginModel } from '@models/login.model';
import { MessageModel } from '@models/message.model';
import { UserModel } from '@models/user.model';
import { AuthService } from '@services/auth.service';
import { CustomvalidationService } from '@services/customvalidation.service';
import { MessagesService } from '@services/messages.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss',
    standalone: false
})
export class RegisterComponent implements OnInit {

  @ViewChild('passwordInput') passwordInput: ElementRef|any;
  eyeClass: string = 'visibility_off';
  isShowing: boolean = false;
  errorOnRegister: string | null = null;

  // Variables para reCAPTCHA
  captchaResponse: string | null = null;
  isEnableRecaptcha: boolean = true;

  userModel: UserModel = {} as UserModel;

  private fb: FormBuilder = inject(FormBuilder);

  // Optimización: Definir mensajes de error en una constante
  private readonly ERROR_MESSAGES = {
    name: {
      required: '* Nombre es requerido'
    },
    lastName: {
      maxlength: '* Apellido no puede exceder 30 caracteres'
    },
    phone: {
      required: '* Teléfono es requerido',
      minlength: '* Teléfono debe tener 9 dígitos',
      maxlength: '* Teléfono debe tener 9 dígitos'
    },
    email: {
      required: '* Email es requerido',
      pattern: '* Email no es válido'
    },
    password: {
      required: '* Contraseña es requerida',
      minlength: '* Contraseña debe tener entre 6 y 20 caracteres',
      maxlength: '* Contraseña debe tener entre 6 y 20 caracteres'
    },
    terms: {
      required: 'Debe aceptar los Términos y Condiciones'
    }
  };

  // Formulario optimizado
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(30)]],
    lastName: ['', [Validators.maxLength(30)]],
    email: ['', [
      Validators.required,
      Validators.email // Usamos el validador de email nativo de Angular
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(20)
    ]],
    terms: [false, Validators.requiredTrue],
    phone: ['', [
      Validators.required,
      Validators.minLength(9),
      Validators.maxLength(9),
      Validators.pattern('^[0-9]*$') // Solo números
    ]]
  });

  constructor(
    private authService: AuthService,
    private messageService: MessagesService,
    private customValidator:CustomvalidationService
  ) {}

  ngOnInit(): void {}

  isLoggedIn(): boolean {
    if (this.authService.isLoggedIn()) {
      this.authService.goHomePage();
      return true;
    }
    return false;
  }

  showPass(): void {
    this.isShowing = !this.isShowing;
    this.passwordInput.nativeElement.type = this.isShowing ? 'text' : 'password';
    this.eyeClass = this.isShowing ? 'visibility' : 'visibility_off';
  }

  register(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEnableRecaptcha && !this.captchaResponse) {
      this.errorOnRegister = 'Por favor, completa el reCAPTCHA.';
      return;
    }

    this.errorOnRegister = null;
    this.executeAction();
  }

  // Método optimizado para obtener mensajes de error
  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    const errorMessages = this.ERROR_MESSAGES[controlName as keyof typeof this.ERROR_MESSAGES];

    // Buscar el primer error
    const errorKey = Object.keys(errors)[0];
    return errorMessages?.[errorKey as keyof typeof errorMessages] || '';
  }

  activeRecaptcha($event: boolean): void {
    this.isEnableRecaptcha = $event;
  }

  responseToken($event: string): void {
    this.captchaResponse = $event;
  }

  allowOnlyNumbers(event: KeyboardEvent){
    return this.customValidator.allowOnlyNumbers(event);
  }

  private executeAction(): void {
    // Crear objeto usuario
    this.userModel = {
      ...this.form.value,
      recaptcha: this.captchaResponse
    };

    this.authService.register(this.userModel).subscribe({
      next: () => {
        this.errorOnRegister = '';
        
        const loginModel: LoginModel = {
          user: {
            email: this.userModel.email,
            password: this.userModel.password
          }
        };

        this.authService.login(loginModel, false);

        const msgModel: MessageModel = {
          msg: "Registro exitoso, le hemos enviado un correo electrónico para que confirme su cuenta.",
          active: 1,
          duration: 6,
          title: "Register User",
          icon: "ok",
          vertical: "top-0",
          dataObject: '',
          horizontal: ''
        };

        this.messageService.sendMessage(msgModel);
      },
      error: (error) => {
        this.handleRegistrationError(error);
      }
    });
  }

  private handleRegistrationError(error: any): void {
    if (error.error?.email) {
      this.errorOnRegister = error.error.email;
    } else if (error.status === 429) {
      this.errorOnRegister = "Usted es un robot, si no lo es vuelva a intentar";
    } else if (error.status === 409) {
      this.errorOnRegister = "El correo ya está siendo utilizado";
    } else if (error.status === 400) {
      this.errorOnRegister = "Datos inválidos. Por favor, verifica la información";
    } else {
      this.errorOnRegister = "Error en el registro. Por favor, intenta nuevamente";
    }
  }
}