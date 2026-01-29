import { App, Modal, Setting } from 'obsidian';
import { format, parse, isValid } from 'date-fns';

/**
 * Modal for creating new Gantt tasks with name and dates.
 */
export class NewTaskModal extends Modal {
  private taskName: string = '';
  private startDate: Date;
  private endDate: Date;
  private onSubmit: (name: string, startDate: Date, endDate: Date) => void;

  constructor(
    app: App,
    defaultStartDate: Date,
    defaultEndDate: Date,
    onSubmit: (name: string, startDate: Date, endDate: Date) => void
  ) {
    super(app);
    this.startDate = defaultStartDate;
    this.endDate = defaultEndDate;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'New task' });

    // Task name input
    new Setting(contentEl)
      .setName('Task name')
      .addText((text) =>
        text
          .setPlaceholder('Enter task name')
          .onChange((value) => {
            this.taskName = value;
          })
      );

    // Start date input
    new Setting(contentEl)
      .setName('Start date')
      .addText((text) =>
        text
          .setPlaceholder('2024-01-15')
          .setValue(format(this.startDate, 'yyyy-MM-dd'))
          .onChange((value) => {
            const parsed = parse(value, 'yyyy-MM-dd', new Date());
            if (isValid(parsed)) {
              this.startDate = parsed;
            }
          })
      );

    // End date input
    new Setting(contentEl)
      .setName('End date')
      .addText((text) =>
        text
          .setPlaceholder('2024-01-15')
          .setValue(format(this.endDate, 'yyyy-MM-dd'))
          .onChange((value) => {
            const parsed = parse(value, 'yyyy-MM-dd', new Date());
            if (isValid(parsed)) {
              this.endDate = parsed;
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
            // Validate dates
            if (this.startDate > this.endDate) {
              // Swap if start is after end
              [this.startDate, this.endDate] = [this.endDate, this.startDate];
            }
            this.onSubmit(this.taskName.trim(), this.startDate, this.endDate);
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
