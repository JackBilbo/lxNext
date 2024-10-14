import { DisplayComponent, ComponentProps, FSComponent, VNode, EventBus} from '@microsoft/msfs-sdk';
import { GridStack } from 'gridstack';
import { Variable,vars, varfamilies } from '../vars';
import { resetDatafield } from './interface';

interface Datafieldcontentpanelprops extends ComponentProps {
    grid: GridStack;
    eventBus: EventBus;
}

export class Datafieldcontentpanel extends DisplayComponent<Datafieldcontentpanelprops> {

    private panelref = FSComponent.createRef<HTMLDivElement>();
    public varinputref = FSComponent.createRef<HTMLInputElement>();
    private bginputref = FSComponent.createRef<HTMLInputElement>();
    private textcolorref = FSComponent.createRef<HTMLInputElement>();
    private bgopacityref = FSComponent.createRef<HTMLInputElement>();
    private setdataref = FSComponent.createRef<HTMLButtonElement>();    
    private resetdataref = FSComponent.createRef<HTMLButtonElement>();
    private varselectorref = FSComponent.createRef<Varselector>();

    private currentDatafield: HTMLElement | null = null;
    private grid: any;
    private eventBus: any;

    constructor(props: Datafieldcontentpanelprops) {
        super(props);
        this.grid = this.props.grid;
        this.eventBus = this.props.eventBus;
    }

    onAfterRender() {

        this.setdataref.instance.addEventListener('click', () => {
            if(this.currentDatafield) {
                this.updateDatafield();
                this.currentDatafield = null;
            }
        })

        this.resetdataref.instance.addEventListener('click', () => {
            this.panelref.instance.style.display = "none";
        })

        this.varinputref.instance.addEventListener('click', () => {
            this.varselectorref.instance.show();
        })
    }

    public editDatafield(df: HTMLElement) {
        this.currentDatafield = df;
        this.panelref.instance.style.display = "block";

        this.varinputref.instance.value = vars.filter( (v) => v.name == df.getAttribute('data-variable'))[0].label;
        this.bginputref.instance.value = df.style.backgroundColor;
        this.textcolorref.instance.value = df.style.color;
        
    }

    private updateDatafield() {
        if(this.currentDatafield) {
            this.currentDatafield.style.backgroundColor = this.bginputref.instance.value;
            this.currentDatafield.style.color = this.textcolorref.instance.value;

            if(this.currentDatafield.dataset.variable != vars.filter( (v) => v.label == this.varinputref.instance.value)[0].name) {
                this.currentDatafield.dataset.variable = vars.filter( (v) => v.label == this.varinputref.instance.value)[0].name;
                resetDatafield(vars.filter( (v) => v.label == this.varinputref.instance.value)[0].name, this.currentDatafield, this.grid, this.eventBus);
            }
        }

        this.panelref.instance.style.display = "none";
    }
    
    render(): VNode {
        return (
            <div id="DatafieldConfigPanel" style="display: none" ref={this.panelref}>
                <label for="variable">Variable:</label>
                    <Varselector ref={this.varselectorref} parent={this} />
                <input ref={this.varinputref} type="text" id="variable" placeholder="Variable" readonly />
                <hr />
                <label for="variable">Background:</label>
                <input ref={this.bginputref} type="text" id="bgcolor" />
                <label for="variable">Textcolor:</label>
                <input ref={this.textcolorref} type="text" id="textcolor" />
                <label for="bgopacity">Opacity:</label>
                <input ref={this.bgopacityref} type="range" id="bgopacity" min="0" max="1" step="0.1" value="0.5" />
                <hr />
                <button ref={this.setdataref} id="setdata">Set Datafield</button>
                <button ref={this.resetdataref} id="resetdata">Cancel</button>
            </div>
        )
    }
}

interface varselectorprops extends ComponentProps {
    parent: Datafieldcontentpanel;
}
class Varselector extends DisplayComponent<varselectorprops> {
    private panel = FSComponent.createRef<HTMLDivElement>();
    private parent = this.props.parent;
    private variablelist: Variable[][] = [];
    constructor(props: varselectorprops) {
        super(props);
        this.init();
    }

    init() {
        
    }

    onAfterRender(node: VNode): void {
        this.panel.instance.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if(target.getAttribute('data-variable') != null) {
                this.parent.varinputref.instance.value = target.getAttribute('data-variable')!;    
            }

            this.panel.instance.style.display = "none";
        })
    }

    public show() {
        this.panel.instance.style.display = "flex";
    }
    render(): VNode {
        let list = '';
        varfamilies.forEach( (v) => {
            if(v.name == "none") return;
            list += `<div><h5>${v.label}</h5><ul>`;
            let templist = vars.filter( (va) => va.family == v.name);
            templist.sort( (a, b) => a.label.localeCompare(b.label));
            templist.forEach( (va) => {
                list += `<li data-variable="${va.label}">${va.label}</li>`
            })
            list += `</ul></div>`;
        })

        return (
            <div ref={this.panel} class="varselector" id="varselector">
                {list}
            </div>
        )
    }
}
