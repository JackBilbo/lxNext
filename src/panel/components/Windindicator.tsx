import { DisplayComponent, EventBus, FSComponent, VNode, Subscribable, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import { FSEvents, Units, simUnits, vars } from '../vars';


interface WindindicatorProps {
    bus: EventBus
}

export class Windindicator extends DisplayComponent<WindindicatorProps> {

    private readonly elementRef = FSComponent.createRef<HTMLDivElement>();
    private readonly heading: Subscribable<number>;
    private readonly windspeed: Subscribable<number>;
    private readonly winddirection: Subscribable<number>;

    private windrosestyle = Subject.create<string>('');
    private arrowstyle = Subject.create<string>('');
    private textfieldstyle = Subject.create<string>('');

    private unit = Subject.create<string>(Units["windspeed"][simUnits].label);

    constructor(props: WindindicatorProps) {
        super(props);

        const subscriber = props.bus.getSubscriber<FSEvents>();
        const hdgconsumer = subscriber.on('heading').withPrecision(0);
        const windspeed = subscriber.on('windspeed').withPrecision(1);
        const winddirection = subscriber.on('winddirection').withPrecision(0);

        const rosestyle = subscriber.on('heading').withPrecision(0).whenChanged().handle((hdg) => {
            this.windrosestyle.set(`transform: rotate(${-1 * hdg}deg);`);
        });

        const arrowstyle = subscriber.on('winddirection').withPrecision(0).whenChanged().handle((wd) => {
            this.arrowstyle.set(`transform: rotate(${wd - 180}deg);`);
        });

        const textfieldstyle = subscriber.on('heading').withPrecision(0).whenChanged().handle((hdg) => {
            try {
                this.textfieldstyle.set(`transform: rotate(${-1 * (this.winddirection.get() - hdg + 180)}deg);`);
            } catch (e) {
                
            }
        });

        const unittype = subscriber.on('simUnits').whenChanged().handle((mu) => {
            this.unit.set(Units["windspeed"][mu].label);  
        });

        this.heading = ConsumerSubject.create(hdgconsumer, 0);
        this.windspeed = ConsumerSubject.create(windspeed, 0);    
        this.winddirection = ConsumerSubject.create(winddirection, 0); 
    }

    public render(): VNode {

        return (
            <div ref={this.elementRef} class="windindicator">
                <div class="heading">{this.heading}</div>
                <div class="windrose" style={this.windrosestyle}>
                    <div class="arrow" style={this.arrowstyle}><svg id="windtriangle" viewBox="0 0 100 100"><polygon points="50 100, 100 15, 0 15"/></svg>
                        <div class="direction" style={this.textfieldstyle}>{this.winddirection}&deg;</div>
                        <div class="velocity" style={this.textfieldstyle}>{this.windspeed}<span>{this.unit}</span></div>
                    </div>
                </div>
                <a href="#" class="close">x</a>
            </div>
        ) 
    }

    onAfterRender(node: VNode): void {
        this.buildhtml();
        const target = this.elementRef.instance.querySelector(".windrose") as HTMLDivElement;
        const arrow = this.elementRef.instance.querySelector(".windrose .arrow") as HTMLDivElement;
        const dirfield = this.elementRef.instance.querySelector(".direction") as HTMLDivElement;
        const speedfield = this.elementRef.instance.querySelector(".velocity") as HTMLDivElement;

        

        this.winddirection.sub(winddir => {
            dirfield.style.transform = `rotate(-${winddir - this.heading.get() +180}deg)`;
            speedfield.style.transform = `rotate(-${winddir - this.heading.get() +180}deg)`;
        })
    }

    private buildhtml(): void {
        const target = this.elementRef.instance.querySelector(".windrose") as HTMLDivElement;

        for(let i= 0; i<24; i++) {
            let tick = document.createElement("div");
            tick.classList.add("tick");

            switch(i) {
                case 0:     tick.innerText = "N"; tick.classList.add("isNorth"); break;
                case 6:     tick.innerText = "E"; break;
                case 12:    tick.innerText = "S"; break;
                case 18:    tick.innerText = "W"; break;
                case 3:     tick.classList.add("longempty");
                case 9:     tick.classList.add("longempty");
                case 15:     tick.classList.add("longempty");
                case 21:     tick.classList.add("longempty");
                default: tick.classList.add("shortempty");
            }

            tick.style.transform = "rotate(calc(15 * " + i + "deg))";
            target.appendChild(tick);

        }

    }

    private meanAngleDeg(a: number[]) {
        return 180 / Math.PI * Math.atan2(
            this.sum(a.map(this.degToRad).map(Math.sin)) / a.length,
            this.sum(a.map(this.degToRad).map(Math.cos)) / a.length
        );
    }

    private sum(a: number[]) {
        var s = 0;
        for (var i = 0; i < a.length; i++) s += a[i];
        return s;
    } 
    
    private degToRad(a: number) {
        return Math.PI / 180 * a;
    }
}