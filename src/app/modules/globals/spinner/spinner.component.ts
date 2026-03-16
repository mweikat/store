import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { SpinnerService } from '@services/spinner.service';

@Component({
    selector: 'app-spinner',
    standalone:true,
    imports: [CommonModule],
    templateUrl: './spinner.component.html',
    styleUrl: './spinner.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush 
})
export class SpinnerComponent {

  showSpinner = computed(() => this.spinnerService.$isLoading());

  constructor(public spinnerService:SpinnerService){}
  
}
