import { Component, effect, inject} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@services/auth.service';

@Component({
    selector: 'app-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrl: './verify-email.component.scss',
    standalone: false
})
export class VerifyEmailComponent {

  //text:string = "Actualmente se está verificando su email. Favor espere un momento.";
  isLogged:boolean = false;

  private authService = inject(AuthService);
  isVerify = this.authService.verify_response;
  

  constructor(private route:ActivatedRoute){
      
      let url:any = this.route.snapshot.paramMap.get('token');   
    
      if(url!=null && url!=undefined &&url!=''){
        this.authService.verifyEmail(url);
      } 

      this.isLogged = this.authService.isLoggedIn();

      /*effect(()=>{
              //console.log('this.isVerify() ', this.isVerify());
              if(this.isVerify()){
                this.text = "Su email ha sido verificado correctamente, Gracias!";
              }
      });*/



  }
  
}
