import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { MessageModel } from '@models/message.model';
import { SharedModule } from '@modules/shared/shared.module';
import { MessagesService } from '@services/messages.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-message-toast',
    standalone:true,
    imports: [CommonModule, SharedModule],
    templateUrl: './message-toast.component.html',
    styleUrl: './message-toast.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageToastComponent {

  showToast = false;
  messageModel: MessageModel = {} as MessageModel;
  private timeoutId?: number;

  constructor(private messageService: MessagesService, private cdr: ChangeDetectorRef, @Inject(PLATFORM_ID) private platformId: Object) {
    // Reemplazamos la suscripción por un effect
    effect(() => {
      const msg = this.messageService.msgModelSignal();
      this.messageModel = msg;
      
      if (msg.active === 1) {
        // Establecemos valores por defecto
        this.messageModel = {
          ...msg,
          duration: msg.duration ?? 3,
          horizontal: msg.horizontal ?? 'end-0',
          vertical: msg.vertical ?? 'bottom-0'
        };

        this.showToast = true;

      }
      
        this.cdr.detectChanges(); // Forzar detección de cambios
        
        this.setAutoCloseTimer();
    });
  }

   private setAutoCloseTimer() {
    // Limpiar timer anterior si existe
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Configurar nuevo timer
    if(isPlatformBrowser(this.platformId))
    this.timeoutId = window.setTimeout(() => {
      this.close();
      this.messageService.clearMessage(); // Limpiar el estado en el servicio
      this.cdr.detectChanges(); // Forzar actualización
    }, this.messageModel.duration * 1000);
  }

  close() {
    this.showToast = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.cdr.detectChanges(); // Forzar actualización
  }
  

}
