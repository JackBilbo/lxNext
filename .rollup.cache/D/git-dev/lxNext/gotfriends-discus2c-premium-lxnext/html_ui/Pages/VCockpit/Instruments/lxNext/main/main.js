/// <reference types="@microsoft/msfs-types/Pages/VCockpit/Core/VCockpit" />
/// <reference types="@microsoft/msfs-types/JS/SimVar" />
import './styles.scss';
import { FSComponent, EventBus } from '@microsoft/msfs-sdk';
import { MyComponent } from './components/myComponent';
import { Units } from './vars';
import { Navmap } from './modules/map.js';
class lxnext extends BaseInstrument {
    constructor() {
        super();
        this.eventBus = new EventBus();
        this.unittype = 'metric';
        this.Navmap = new Navmap(this);
    }
    get templateID() {
        return 'lxnext';
    }
    get isInteractive() {
        return true;
    }
    connectedCallback() {
        super.connectedCallback();
        const unitswitch = document.querySelector('#unitswitch');
        unitswitch.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleUnits();
            unitswitch.innerHTML = Units.speed.pref;
        });
        this.Navmap.initMap();
        this.eventBus.getPublisher().pub('masterunits', Units.speed.imperial ? "metric" : "imperial");
        FSComponent.render(FSComponent.buildComponent(MyComponent, { bus: this.eventBus, variable: 'indicated_airspeed', unittype: Units.speed, threshold: 20 }), document.getElementById('mainframe'));
        FSComponent.render(FSComponent.buildComponent(MyComponent, { bus: this.eventBus, variable: 'altitude', unittype: Units.altitude, threshold: 20 }), document.getElementById('mainframe'));
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Update() {
        super.Update();
        this.Navmap.update();
        this.eventBus.getPublisher().pub('indicated_airspeed', SimVar.GetSimVarValue('AIRSPEED INDICATED', Units.speed[this.unittype]));
        this.eventBus.getPublisher().pub('altitude', SimVar.GetSimVarValue('INDICATED ALTITUDE', Units.altitude[this.unittype]));
    }
    toggleUnits() {
        this.unittype = this.unittype === "imperial" ? "metric" : "imperial";
        this.eventBus.getPublisher().pub('masterunits', this.unittype);
    }
}
registerInstrument('lx-next', lxnext);
//# sourceMappingURL=main.js.map