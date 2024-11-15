/// <reference types="@microsoft/msfs-types/Pages/VCockpit/Core/VCockpit" />
/// <reference types="@microsoft/msfs-types/JS/SimVar" />
import 'gridstack/dist/gridstack.min.css';
import './styles.scss';

import { FSComponent, Subject, EventBus } from '@microsoft/msfs-sdk';
import { Datafield } from './components/Datafield';
import { Units, vars, staticvars, FSEvents, setSimUnits, simUnits } from './vars';


import { GridStack } from 'gridstack';
import { defaultgrid, resizeWidget } from './components/interface';

import { localStorageGet, localStorageSet } from './components/localstorage';
import { lxnWidget } from './components/interface';
import { updateCustomVars, initAircraft } from './components/customvars';

import { Datafieldeditor } from './components/interface';
import { Navmap } from './components/interface';

import { Navpanel, ownPosition } from './components/navpanel';

import { Keybinds } from './components/keybinds';

var isVR = false;

class lxnext  {
    private readonly eventBus = new EventBus();
    private selectedunits = 'metric';  
    private grid;
    private root: HTMLElement = document.getElementById('CustomPanel')!;
    public keybinds: Keybinds = new Keybinds(this.eventBus);

    private Navpanelref = FSComponent.createRef<Navpanel>();

    constructor() {
        this.grid = GridStack.init({
            float: true,
            margin: 0,
            cellHeight: '2rem',
            column: 24,
            resizable: {
                handles: 'se,sw'
            }
        });
    }

    public connectedCallback(): void {

        localStorageGet('lxn_layout').then((layout) => {
            if(layout && layout != "reset") {
                this.grid.load(JSON.parse(layout as string))
            } else {
                this.grid.load(defaultgrid);
            }
        
            this.grid.getGridItems().forEach((item) => {
                item.style.setProperty('--rootsize', item.clientHeight + 'px');
                item.style.setProperty('--rootwidth', item.clientWidth + 'px');
                item.style.setProperty('--rootheight', item.clientHeight + 'px');
                const container = item.querySelector(".lxnwidget") as HTMLElement;
                if(container && container.dataset.type) {
                    const variable = container.dataset.variable? container.dataset.variable : null;
                    lxnWidget(container.dataset.type, variable, container, this.grid, this.eventBus);
                }
            })

            document.querySelector(".grid-stack")?.addEventListener("click", (e) => {
                if(document.getElementById('CustomPanel')!.classList.contains('interact')) {
                const target = e.target as HTMLElement;
                
                    if(target.classList.contains("close") && target.closest(".grid-stack-item")) {
                        this.grid.removeWidget(target.closest(".grid-stack-item") as HTMLElement);
                    } else if(target.closest(".lxnwidget")?.getAttribute("data-type") == "datafield") {
                        Datafieldeditor.instance.editDatafield(target.closest(".lxnwidget") as HTMLElement);
                    } 
                }
            })

            this.grid.on("resizestop", (e: Event, el: HTMLElement) => {
                el.style.setProperty('--rootsize', el.clientHeight + 'px');
                el.style.setProperty('--rootwidth', el.clientWidth + 'px');
                el.style.setProperty('--rootheight', el.clientHeight + 'px');
                resizeWidget(el, this.grid);
            })

            Navmap?.checker();

            FSComponent.render(<Navpanel eventBus={this.eventBus} ref={this.Navpanelref} />, this.root);
            this.keybinds.listen();

            initAircraft();
        })
      }

    public async Update(): Promise<void> {
        updateCustomVars();

        vars.map(v => {
            let val = SimVar.GetSimVarValue(v.simvar, Units[v.unittype][simUnits].simunit);
            this.eventBus.getPublisher<FSEvents>().pub(v.name as keyof FSEvents, val);
            staticvars[v.name] = val;
        })  

        if(Navmap) { 
            Navmap?.update();
        }

        ownPosition.set(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degrees"), SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degrees"));
        
        const n = await SimVar.GetSimVarValue("E:UNITS OF MEASURE", "number");
        if(simUnits != n) {
            this.eventBus.getPublisher<FSEvents>().pub('simUnits', n);
            setSimUnits(n);
        }

        const vr = await SimVar.GetSimVarValue("E:IS IN VR", "boolean");
        if(isVR != vr) {
            if(vr == 1) {
                this.root.classList.add('vr');
            } else {
                this.root.classList.remove('vr');
            }
            isVR = vr;
        }

        this.Navpanelref.instance?.update();
    }



}


const p = new lxnext();

setTimeout(() => p.connectedCallback(), 100);
setInterval(() => p.Update(), 100);

