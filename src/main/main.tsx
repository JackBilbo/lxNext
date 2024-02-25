/// <reference types="@microsoft/msfs-types/Pages/VCockpit/Core/VCockpit" />
/// <reference types="@microsoft/msfs-types/JS/SimVar" />

import './styles.scss';

import { FSComponent, Subject, EventBus } from '@microsoft/msfs-sdk';
import { MyComponent } from './components/myComponent';
import { Units, FSEvents } from './vars';

class lxnext extends BaseInstrument {
    constructor() {
      super();
    }

    private readonly eventBus = new EventBus();
    private unittype = 'metric';

    get templateID(): string {
      return 'lxnext';
    }

    get isInteractive() {
      return true;
    }  

    public connectedCallback(): void {
        super.connectedCallback();

        const unitswitch = document.querySelector('#unitswitch') as HTMLElement;

        unitswitch.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleUnits();
          unitswitch.innerHTML = Units.speed.pref;
        })

        this.eventBus.getPublisher<FSEvents>().pub('masterunits', Units.speed.imperial ? "metric" : "imperial");
      
        FSComponent.render(<MyComponent bus={this.eventBus} variable={'indicated_airspeed'} unittype={Units.speed} threshold={20} />, document.getElementById('mainframe'));
        FSComponent.render(<MyComponent bus={this.eventBus} variable={'altitude'} unittype={Units.altitude} threshold={20} />, document.getElementById('mainframe'));
      }

    public disconnectedCallback(): void {
        super.disconnectedCallback();
    }

    public Update(): void {
        super.Update();
        
        this.eventBus.getPublisher<FSEvents>().pub('indicated_airspeed', SimVar.GetSimVarValue('AIRSPEED INDICATED', Units.speed[this.unittype]));
        this.eventBus.getPublisher<FSEvents>().pub('altitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', Units.altitude[this.unittype]));
    }

    private toggleUnits(): void {
        this.unittype = this.unittype === "imperial" ? "metric" : "imperial";
        this.eventBus.getPublisher<FSEvents>().pub('masterunits', this.unittype);
    }
}
  
registerInstrument('lx-next', lxnext);