import { DisplayComponent, ComponentProps, FSComponent, VNode, EventBus} from '@microsoft/msfs-sdk';
import { GridStack } from 'gridstack';
import autocomplete, { AutocompleteItem } from 'autocompleter';
import { vars } from '../vars';
import { resetDatafield } from './interface';

export class Datafieldcontentpanel  {

    private panel = document.createElement('div');
    private thisform: any = {};
    private thisstyle: any = {};
    private currentDatafield: HTMLElement | null = null;
    private grid: any;
    private eventBus: any;

    constructor() {

    }

    init(grid: GridStack,eventBus: EventBus) {
        this.grid = grid;
        this.eventBus = eventBus;
        
        this.panel.innerHTML = `
            <div id="DatafieldConfigPanel">
                <label for="variable">Variable:</label>
                <input type="text" id="variable" placeholder="Variable" />
                <hr />
                <label for="variable">Background:</label>
                <input type="text" id="bgcolor" />
                <label for="variable">Textcolor:</label>
                <input type="text" id="textcolor" />
                <label for="bgopacity">Opacity:</label>
                <input type="range" id="bgopacity" min="0" max="1" step="0.1" value="0.5" />
                <hr />
                <button id="setdata">Set Datafield</button>
                <button id="resetdata">Cancel</button>
            </div>
        `
        document.getElementById('CustomPanel')?.appendChild(this.panel);
        this.panel.style.display = "none";

        this.addautocomplete();

        this.thisform.varinput = this.panel.querySelector('#variable')!;
        this.thisform.bgcolor = this.panel.querySelector('#bgcolor')!;
        this.thisform.textcolor = this.panel.querySelector('#textcolor')!;
        this.thisform.opacity = this.panel.querySelector('#bgopacity')!;

        this.panel.querySelector('#setdata')?.addEventListener('click', () => {
            if(this.currentDatafield) {
                this.updateDatafield();
                this.currentDatafield = null;
            }
        })

        this.panel.querySelector('#resetdata')?.addEventListener('click', () => {
            this.panel.style.display = "none";
        })
    }

    public editDatafield(df: HTMLElement) {
        this.currentDatafield = df;
        this.panel.style.display = "block";

        this.thisform.varinput.value = vars.filter( (v) => v.name == df.getAttribute('data-variable'))[0].label;
        this.thisform.bgcolor.value = df.style.backgroundColor;
        this.thisform.textcolor.value = df.style.color;
        
    }

    private updateDatafield() {
        if(this.currentDatafield) {
            this.currentDatafield.style.backgroundColor = this.thisform.bgcolor.value;
            this.currentDatafield.style.color = this.thisform.textcolor.value;

            if(this.currentDatafield.dataset.variable != vars.filter( (v) => v.label == this.thisform.varinput.value)[0].name) {
                this.currentDatafield.dataset.variable = vars.filter( (v) => v.label == this.thisform.varinput.value)[0].name;
                resetDatafield(vars.filter( (v) => v.label == this.thisform.varinput.value)[0].name, this.currentDatafield, this.grid, this.eventBus);
            }
        }

        this.panel.style.display = "none";
    }
    addautocomplete(): void {
        const autocontainer: HTMLDivElement = document.createElement('div');
        autocontainer.classList.add('autocontainer');
        document.querySelector("#CustomPanel")?.appendChild(autocontainer);

        type MyItem = AutocompleteItem;
        const varinput: HTMLInputElement | HTMLTextAreaElement = document.querySelector('#variable')!;

        autocomplete<MyItem>({
            input: varinput,
            emptyMsg: 'No elements found',
            fetch: (text: string, update: (items: AutocompleteItem[]) => void) => {
              text = text.toLowerCase();
              var sugg = vars.filter((v) => v.label.toLowerCase().match(text));
              update(sugg.map((v) => ({ label: v.label, value: v.name })));
            },
            onSelect: function (item: AutocompleteItem) {
                
                varinput.value = item.label ?? '';             
            },
            container: autocontainer
        })
    }


}
