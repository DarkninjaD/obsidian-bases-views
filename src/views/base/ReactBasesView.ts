import { BasesView, BasesQueryResult, QueryController, HoverParent, HoverPopover } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import React from 'react';

/**
 * Abstract base class that bridges Obsidian's BasesView with React components.
 *
 * This class handles:
 * - React root creation and lifecycle management
 * - Data updates from Obsidian Bases API
 * - Cleanup on view close
 * - Hover preview support
 *
 * Subclasses must implement:
 * - type property (view type ID)
 * - getReactComponent() to provide their React component
 */
export abstract class ReactBasesView extends BasesView implements HoverParent {
  // Abstract type - must be implemented by subclasses
  abstract type: string;

  protected containerEl: HTMLElement;
  private root: Root | null = null;

  // Implement HoverParent interface
  hoverPopover: HoverPopover | null = null;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('ReactBasesView constructor called');
    super(controller);
    this.containerEl = containerEl;

    // Style container
    this.containerEl.addClass('bases-view-container');

    console.log('ReactBasesView constructor completed');
  }

  /**
   * Component lifecycle - called when view is loaded
   */
  override onload(): void {
    super.onload();
    console.log('ReactBasesView.onload() called');
    console.log('  this.data:', this.data);
    console.log('  this.data.data length:', this.data?.data?.length);
    console.log('  this.data.groupedData length:', this.data?.groupedData?.length);

    // Render if we have data
    if (this.data && this.data.data.length > 0) {
      this.render();
    } else {
      // Show loading message while waiting for data
      this.showLoadingMessage();
    }
  }

  /**
   * Show loading message while waiting for data
   */
  private showLoadingMessage(): void {
    this.containerEl.empty();
    const loadingDiv = this.containerEl.createDiv({ cls: 'bv-loading' });
    loadingDiv.createEl('div', { text: 'Loading data from Bases...' });
  }

  /**
   * Abstract method to be implemented by each view.
   * Returns the React component to render with current data.
   *
   * @param data - The data from Obsidian Bases API
   * @returns React element to render
   */
  protected abstract getReactComponent(data: BasesQueryResult): React.ReactElement;

  /**
   * Render or re-render the React component
   */
  private render(): void {
    console.log('ReactBasesView.render() called');
    console.log('  this.data:', this.data);
    console.log('  this.data.data length:', this.data?.data?.length);

    // Don't render if no data available yet
    if (!this.data || this.data.data.length === 0) {
      console.warn('ReactBasesView.render() skipped - no data available');
      this.showLoadingMessage();
      return;
    }

    // Create React root on first render
    if (!this.root) {
      this.root = createRoot(this.containerEl);
    }

    // Render React component with current data
    const component = this.getReactComponent(this.data);
    this.root.render(component);
  }

  /**
   * Called when Bases data is updated.
   * This is a notification - data is in this.data property.
   */
  onDataUpdated(): void {
    console.log('ReactBasesView.onDataUpdated() called');
    console.log('  this.data:', this.data);
    console.log('  this.data type:', typeof this.data);
    console.log('  this.data.data length:', this.data?.data?.length);
    console.log('  this.data.groupedData length:', this.data?.groupedData?.length);

    // Data is in this.data (inherited from BasesView)
    if (this.data && this.data.data.length > 0) {
      console.log('  ✓ Data is valid, rendering...');
      this.render();
    } else {
      console.warn('  ✗ No data available yet');
      this.showLoadingMessage();
    }
  }

  /**
   * Cleanup on view close.
   * Unmounts React component and cleans up resources.
   */
  override onunload(): void {
    console.log('ReactBasesView.onunload() called');
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    super.onunload();
  }
}
