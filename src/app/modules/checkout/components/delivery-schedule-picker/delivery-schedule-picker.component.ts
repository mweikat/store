import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { DeliveryScheduleDay, DeliveryScheduleSettings, DeliveryScheduleSlot } from '@models/deliverySchedule.model';
import { ShippingBusinessService } from '@services/shipping-business.service';

@Component({
  selector: 'app-delivery-schedule-picker',
  templateUrl: './delivery-schedule-picker.component.html',
  styleUrl: './delivery-schedule-picker.component.scss',
  standalone: false
})
export class DeliverySchedulePickerComponent implements OnInit {
  private shippingBusinessService = inject(ShippingBusinessService);

  @Input() selectedDate: string = '';
  @Input() selectedSlotId: number | string | null = null;

  @Output() scheduleSelected = new EventEmitter<{
    date: string;
    slot: DeliveryScheduleSlot;
  }>();

  settings = signal<DeliveryScheduleSettings | null>(null);
  days = signal<DeliveryScheduleDay[]>([]);
  selectedDay = signal<DeliveryScheduleDay | null>(null);
  selectedSlot = signal<DeliveryScheduleSlot | null>(null);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadScheduleSettingsAndAvailability();
  }

  loadScheduleSettingsAndAvailability(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.shippingBusinessService.getDeliveryScheduleSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        const { from, to } = this.calculateDateRange(settings);

        this.shippingBusinessService.getDeliveryScheduleAvailability(from, to).subscribe({
          next: (availabilityDays) => {
            const formattedDays = this.formatDays(availabilityDays || []);
            this.days.set(formattedDays);
            this.isLoading.set(false);

            if (formattedDays.length > 0) {
              const currentSelectedDate = this.selectedDate;
              const matchingDay = currentSelectedDate
                ? formattedDays.find(d => d.date === currentSelectedDate)
                : formattedDays[0];

              if (matchingDay) {
                this.selectDay(matchingDay);
              }
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('No se pudo cargar la disponibilidad de horarios. Por favor, intenta nuevamente.');
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('No se pudo cargar la configuración de despacho programado.');
      }
    });
  }

  private calculateDateRange(settings: DeliveryScheduleSettings): { from: string; to: string } {
    const timeZone = 'America/Santiago';
    const now = new Date();

    const getLocalDateStr = (d: Date): string => {
      // Intl format YYYY-MM-DD in America/Santiago
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(d);
    };

    const fromDate = new Date(now.getTime() + (settings.min_advance_minutes || 0) * 60 * 1000);
    const maxDays = settings.max_days_ahead || 7;
    const toDate = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

    return {
      from: getLocalDateStr(fromDate),
      to: getLocalDateStr(toDate)
    };
  }

  private formatDays(days: DeliveryScheduleDay[]): DeliveryScheduleDay[] {
    return days.map(day => {
      let dayName = day.day_name;
      if (!dayName && day.date) {
        try {
          const [year, month, dateNum] = day.date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, dateNum);
          dayName = new Intl.DateTimeFormat('es-CL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          }).format(dateObj);
          // Capitalize first letter
          dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        } catch {
          dayName = day.date;
        }
      }
      return {
        ...day,
        day_name: dayName
      };
    });
  }

  selectDay(day: DeliveryScheduleDay): void {
    this.selectedDay.set(day);
    this.selectedDate = day.date;

    // Check if current slot belongs to this day
    if (this.selectedSlotId) {
      const matchSlot = day.slots.find(s => String(s.id) === String(this.selectedSlotId) && s.available_quota > 0);
      if (matchSlot) {
        this.selectSlot(matchSlot);
        return;
      }
    }

    // Auto-select first available slot if any
    const firstAvailable = day.slots.find(s => s.available_quota > 0);
    if (firstAvailable) {
      this.selectSlot(firstAvailable);
    } else {
      this.selectedSlot.set(null);
      this.selectedSlotId = null;
    }
  }

  selectSlot(slot: DeliveryScheduleSlot): void {
    if (slot.available_quota <= 0) return;

    this.selectedSlot.set(slot);
    this.selectedSlotId = slot.id;

    if (this.selectedDay()) {
      this.scheduleSelected.emit({
        date: this.selectedDay()!.date,
        slot
      });
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    // Format HH:mm:ss to HH:mm if needed
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
}
