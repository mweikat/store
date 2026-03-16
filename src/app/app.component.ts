import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '@modules/globals/footer/footer.component';
import { HeaderComponent } from '@modules/globals/header/header.component';
import { MessageToastComponent } from '@modules/globals/message-toast/message-toast.component';
import { SpinnerComponent } from '@modules/globals/spinner/spinner.component';
import { Top2Component } from '@modules/globals/top-2/top-2.component';
import { TopComponent } from '@modules/globals/top/top.component';

@Component({
    selector: 'app-root',
    standalone:true,
    imports: [RouterOutlet, SpinnerComponent, MessageToastComponent, FooterComponent, TopComponent, HeaderComponent, Top2Component],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  
}
