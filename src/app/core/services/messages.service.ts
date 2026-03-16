import { Injectable, signal } from '@angular/core';
import { MessageModel } from '@models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private msgModel = signal<MessageModel>({} as MessageModel);
  public readonly msgModelSignal = this.msgModel.asReadonly(); 
  
  sendMessage(msg:MessageModel){
    const msgAux = msg;
    this.msgModel.set(msgAux);
  }

  clearMessage() {
    this.msgModel.set({ ...this.msgModel(), active: 0 });
  }
}
