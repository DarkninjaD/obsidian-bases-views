import { TFile, Component, App } from 'obsidian';

declare module 'obsidian' {
  interface Plugin {
    registerView(viewType: string, factory: BasesViewFactory, config?: BasesViewRegistration): void;
  }

  // Bases View Factory
  export type BasesViewFactory = (controller: QueryController, containerEl: HTMLElement) => BasesView;

  // Bases View Registration Config
  export interface BasesViewRegistration {
    name: string;
    icon: string;
    factory: BasesViewFactory;
    options?: () => BasesViewOption[];
  }

  // Query Controller - manages query execution
  export class QueryController extends Component {
    app: App;
  }

  // Base class for all Bases views
  export abstract class BasesView extends Component {
    abstract type: string;
    app: App;
    config: BasesViewConfig;
    allProperties: BasesPropertyId[];
    data: BasesQueryResult;

    protected constructor(controller: QueryController);
    abstract onDataUpdated(): void;
  }

  // Bases View Config
  export class BasesViewConfig {
    name: string;
    icon: string;
    options?: BasesViewOption[];
  }

  // Query Result - contains both flat and grouped data
  export class BasesQueryResult {
    data: BasesEntry[];
    get groupedData(): BasesEntryGroup[];
    get properties(): BasesPropertyId[];
  }

  // View Option
  export interface BasesViewOption {
    id: string;
    name: string;
    type: 'text' | 'number' | 'toggle' | 'dropdown' | 'property-selector';
    defaultValue?: unknown;
    filter?: string;
  }

  // Entry Group - a group of entries
  export interface BasesEntryGroup {
    key: unknown;
    entries: BasesEntry[];
    hasKey: () => boolean;
  }

  // Entry - a single note/file in the base
  export interface BasesEntry {
    file: TFile;
    getValue(property: string): unknown;
  }

  // Property ID
  export type BasesPropertyId = string;

  // Hover support
  export interface HoverParent {
    hoverPopover: HoverPopover | null;
  }

  export interface HoverPopover extends Component {
    targetEl: HTMLElement;
  }

  interface Workspace {
    trigger(name: 'hover-link', data: HoverLinkEvent): void;
  }

  interface HoverLinkEvent {
    event: MouseEvent;
    source: string;
    hoverParent: HoverParent;
    targetEl: HTMLElement;
    linktext: string;
    sourcePath: string;
  }
}
