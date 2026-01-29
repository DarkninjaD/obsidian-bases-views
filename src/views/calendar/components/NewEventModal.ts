import { App, Modal, Setting } from 'obsidian';
import { format, parse, isValid } from 'date-fns';

/**
 * Modal for creating new calendar events with name and time.
 */
export class NewEventModal extends Modal {
  private eventName: string = '';
  private startTime: Date;
  private endTime: Date;
  private onSubmit: (name: string, startTime: Date, endTime: Date) => void | Promise<void>;

  constructor(
    app: App,
    defaultStartTime: Date,
    defaultEndTime: Date,
    onSubmit: (name: string, startTime: Date, endTime: Date) => void | Promise<void>
  ) {
    super(app);
    this.startTime = defaultStartTime;
    this.endTime = defaultEndTime;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'New event' });

    // Event name input
    new Setting(contentEl)
      .setName('Event name')
      .addText((text) => {
        text
          .setPlaceholder('Enter event name')
          .onChange((value) => {
            this.eventName = value;
          });
        // Focus the input
        setTimeout(() => text.inputEl.focus(), 10);
      });

    // Start time input
    new Setting(contentEl)
      .setName('Start time')
      .addText((text) =>
        text
          .setPlaceholder('09:30')
          .setValue(format(this.startTime, 'HH:mm'))
          .onChange((value) => {
            const parsed = parse(value, 'HH:mm', this.startTime);
            if (isValid(parsed)) {
              this.startTime = parsed;
            }
          })
      );

    // End time input
    new Setting(contentEl)
      .setName('End time')
      .addText((text) =>
        text
          .setPlaceholder('09:30')
          .setValue(format(this.endTime, 'HH:mm'))
          .onChange((value) => {
            const parsed = parse(value, 'HH:mm', this.endTime);
            if (isValid(parsed)) {
              this.endTime = parsed;
            }
          })
      );

    // Buttons
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText('Cancel')
          .onClick(() => {
            this.close();
          })
      )
      .addButton((btn) =>
        btn
          .setButtonText('Create')
          .setCta()
          .onClick(() => {
            this.close();
            // Validate times
            if (this.startTime > this.endTime) {
              // Swap if start is after end
              [this.startTime, this.endTime] = [this.endTime, this.startTime];
            }
            this.onSubmit(this.eventName.trim(), this.startTime, this.endTime);
          })
      );

    // Handle Enter key to submit
    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.close();
        if (this.startTime > this.endTime) {
          [this.startTime, this.endTime] = [this.endTime, this.startTime];
        }
        this.onSubmit(this.eventName.trim(), this.startTime, this.endTime);
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
