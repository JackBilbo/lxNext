import { GridStack } from 'gridstack';
import { DisplayComponent, EventBus, FSComponent, ComponentProps,VNode } from '@microsoft/msfs-sdk';
import { Datafield } from './Datafield';
import { Datafieldcontentpanel  } from './DatafieldConfigPanel';
import { FSEvents, selectedUnit } from '../vars';

import { Mapcontainer } from './mapcontainer';
import { Windindicator } from './Windindicator';
import { localStorageGet, localStorageSet } from './localstorage';


interface gridstring {
  content: string,
  w: number,
  h: number,
  x: number,
  y: number
}

export var Navmap: Mapcontainer|null = null;

export const Datafieldeditor = FSComponent.createRef<Datafieldcontentpanel>();

export const defaultgrid: gridstring[] = [
    {content: '<div class="lxnwidget" data-type="toolbar"></div>', w: 1, h: 2, x:0, y:0},
    {content: '<div class="lxnwidget" data-type="map"></div>', w: 3, h: 16, x:16, y:12},
    {content: '<div class="lxnwidget" data-type="datafield" data-variable="ias" style="background-color: rgba(0, 0, 0, 0.1); color: rgb(255, 255, 255);"></div>', w: 2, h: 3, x:0, y:8}
  ];

interface ToolbarProps extends ComponentProps {
    bus: EventBus
    grid: GridStack
}

export class Toolbar extends DisplayComponent<ToolbarProps> {

    private readonly eventBus = this.props.bus;

    constructor(props: ToolbarProps) {
      super(props);
    }

    private interact(): void {
      document.getElementById('CustomPanel')?.classList.toggle('interact');

      if(parseInt(document.querySelector('.toolbar')!.closest('.grid-stack-item')!.getAttribute('gs-y')!) < 10) {
        document.getElementById('widgetmenu')?.classList.add('istop');
      } else {    
        document.getElementById('widgetmenu')?.classList.remove('istop');
      }

      document.getElementById('widgetmenu')?.classList.toggle('active');
      if(!document.getElementById('CustomPanel')?.classList.contains('interact')) {
        this.saveLayout();
      }
    }

    public render(): VNode  {
        return (
            <div class="toolbar">
                <button id="interact">Edit</button>
                <button id="nav">Nav</button>
                <button id="config" disabled>Cfg.</button>
                <button id="mapswitch">Map</button>
                <button id="hideswitch">Hide</button>
                <div id="widgetmenu">
                  <h6>Add:</h6>
                  <button id="adddatafield">Datafield</button>
                  <button id="windindicator">Windindicator</button>
                  <button id="addTaskbar" disabled>Taskbar</button>
                  <button id="resetAll">Reset Interface</button>
                </div>
            </div>
          )
    }

    private saveLayout(): void {
      let currentgrid:  gridstring[] = []

      this.props.grid.getGridItems().forEach((item) => {
        const container = item.querySelector(".lxnwidget")?.cloneNode() as HTMLElement;
        container.innerHTML = '';
        currentgrid.push(
          {content: container.outerHTML, w: parseInt(item.getAttribute('gs-w')!), h: parseInt(item.getAttribute('gs-h')!), x: parseInt(item.getAttribute('gs-x')!), y: parseInt(item.getAttribute('gs-y')!)}
        );
      })

      localStorageSet("lxn_layout", JSON.stringify(currentgrid));
    }

    public onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        FSComponent.render(<Datafieldcontentpanel ref={Datafieldeditor} grid={this.props.grid} eventBus={this.eventBus} />, document.getElementById('CustomPanel')!);
                
        document.getElementById('interact')?.addEventListener('click', () => this.interact());
        document.getElementById('add')?.addEventListener('click', () => document.getElementById('widgetmenu')?.classList.toggle('active'));
        document.getElementById('nav')?.addEventListener('click', () =>document.getElementById('navpanel')?.classList.toggle('active'));
        document.getElementById('config')?.addEventListener('click', () => console.log("configpanel"));
        document.getElementById('mapswitch')?.addEventListener('click', () => toggleMap());
        document.getElementById('hideswitch')?.addEventListener('click', () => toggleVisibility());

        document.getElementById('adddatafield')?.addEventListener('click', () => addLxnWidget('datafield','alt_agl', this.props.grid, this.eventBus));
        document.getElementById('windindicator')?.addEventListener('click', () => addLxnWidget('windindicator', null, this.props.grid, this.eventBus));

        document.getElementById('resetAll')?.addEventListener('click', () => {
          localStorageSet("lxn_layout", "reset");
        });

    }
  }

export function lxnWidget(widget: string, variable: string|null, container: HTMLElement, grid: GridStack, eventBus: EventBus): void {
    if(widget == "datafield") {
        FSComponent.render(<Datafield bus={eventBus} variable={variable as keyof FSEvents} />, container);
    } else if (widget == "toolbar") {
        FSComponent.render(<Toolbar bus={eventBus} grid={grid} />, container);
    } else if (widget == "map") {
        Navmap = new Mapcontainer({bus: eventBus, grid: grid, root: container});
        Navmap.render();
        Navmap.initMap();
    } else if (widget == "windindicator") {
        FSComponent.render(<Windindicator bus={eventBus} />, container);
    }
}

export function resetDatafield(variable: string, container: HTMLElement, grid: GridStack, eventBus: EventBus): void {
  container.innerHTML = '';  
  lxnWidget('datafield', variable, container, grid,eventBus);
    
}

export function addLxnWidget(type: string, variable: string | null, grid: GridStack, eventBus: EventBus): void {
    if(document.getElementById('CustomPanel')!.classList.contains('interact')) {
  
      const newWidget = grid.addWidget(`<div><div class="grid-stack-item-content"><div class="lxnwidget" data-type="${type}" data-variable="${variable}" style="background-color: rgba(0, 0, 0, 0); color: rgb(255, 255, 255);"></div></div></div>`, {w: 2, h: 3, x:6, y:6, id: "widget-"+variable});
      lxnWidget(type, variable, newWidget.querySelector(".lxnwidget")!, grid, eventBus);  
      newWidget.style.setProperty('--rootsize', newWidget.clientHeight + 'px');
      newWidget.style.setProperty('--rootwidth', newWidget.clientWidth + 'px');
      newWidget.style.setProperty('--rootheight', newWidget.clientHeight + 'px');
      
      if(type == "datafield") {
        Datafieldeditor.instance.editDatafield(newWidget.querySelector(".lxnwidget")!);
      }
    }
}


export function resizeWidget(widget: HTMLElement, grid: GridStack): void {
  if(widget.querySelector(".mapcontainer")?.classList.contains('active')) {
    Navmap?.checker();
  }
}

export function toggleMap(): void {
    document.querySelector('.mapcontainer')?.classList.toggle('active');
    if(document.querySelector('.mapcontainer')?.classList.contains('active')) {
      Navmap?.checker();
      Navmap!.isvisible = true;
    } else {
      Navmap!.isvisible = false;
    }
} 

function toggleVisibility(): void {
    document.getElementById('CustomPanel')!.classList.toggle('ishidden');
}