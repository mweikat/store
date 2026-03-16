import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomvalidationService {

  constructor() { }

  telefono9Digitos(){
    return '^\\d{9}$';
  }
  integerPattern(){
    return '^([1-9][0-9]*)$';
  }

  integerPatternWithOneBlank(){
    return '^([1-9][0-9]*)((\\s)?([0-9]))*$'
  }

  integerPatternCero(){
    return '^((0)|([1-9][0-9]*))$';
  }

  urlPatternBusiness(){
    return '^[a-z\d]+(-[a-z\d]+)*$';
  }

  namePatterBusiness(){
    return '^[a-zA-z]+((\\s[a-zA-Z\\d]+)+)?$';
  }

  categoryPatternName(){
    return '^[\\w\-\\s\\ñ\\áéíóúýÁÉÍÓÚ]+$';
  }

  emailValidation(){
    return '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'
  }

  booleanValidation(){
    return '^(0|1)$';
  }

  wspUrlApi(){
    return '^(https:\/\/api.whatsapp.com\/message\/).*$';
  }

  instagramValidation(){
    return '^(https:\/\/www.instagram.com\/).*$';
  }

  facebookValidation(){
    return '^(https:\/\/www.facebook.com\/).*$'
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    // Permitir: números, teclas de control y teclas de navegación
    const allowedKeys = [
      'Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight',
      'Home', 'End'
    ];

    // Si es una tecla permitida, no prevenir
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Solo permitir números (0-9)
    const charCode = event.key.charCodeAt(0);
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }
  
}
