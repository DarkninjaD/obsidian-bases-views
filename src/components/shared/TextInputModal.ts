import { App, Modal, Setting } from 'obsidian';

/**
 * Simple modal for text input.
 * Used for creating new groups/columns.
 */
export class TextInputModal extends Modal {
  private result: string = '';
  private onSubmit: (result: string) => void;
  private title: string;
  private placeholder: string;

  constructor(
    app: App,
    title: string,
    onSubmit: (result: string) => void,
    placeholder: string = ''
  ) {
    super(app);
    this.title = title;
    this.onSubmit = onSubmit;
    this.placeholder = placeholder;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: this.title });

    new Setting(contentEl)
      .setName('Name')
      .addText((text) =>
        text
          .setPlaceholder(this.placeholder)
          .onChange((value) => {
            this.result = value;
          })
      );

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
            if (this.result.trim()) {
              this.onSubmit(this.result.trim());
            }
          })
      );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
