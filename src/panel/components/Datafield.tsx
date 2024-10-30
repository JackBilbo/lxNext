import { FSComponent, DisplayComponent, VNode, ComponentProps, Subscribable, EventBus, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import { Units, vars, FSEvents, simUnits } from '../vars';

interface DatafieldProps extends ComponentProps {
  bus: EventBus,
  variable: any
}


export class Datafield extends DisplayComponent<DatafieldProps> {
  
  private value: Subscribable<number>;
  private readonly varobj = vars.find((v) => v.name == this.props.variable);

  private unit = Subject.create<string>(Units[this.varobj!.unittype][simUnits].label);
  private stringout = Subject.create<string>('00:00:00');
  private readonly elementRef = FSComponent.createRef<HTMLDivElement>();

  constructor(props: DatafieldProps) {
    super(props);
    
    const subscriber = props.bus.getSubscriber<FSEvents>();
    const consumer = subscriber.on(this.props.variable).withPrecision(this.varobj!.precision);
    const unittype = subscriber.on('simUnits').whenChanged().handle((mu) => {
        this.unit.set(Units[this.varobj!.unittype][mu].label);  
    });

    if(this.varobj!.unittype == 'time') {
      subscriber.on(this.props.variable).whenChanged().handle((value) => {
        this.stringout.set(this.formatValue(value));
      })
    
    }
  
    this.value = ConsumerSubject.create(consumer, 0);

  }

  public render(): VNode {
    return (
      <div ref={this.elementRef} class="datafield">
        <span class="label">{this.varobj?.shortlabel}</span>
        <span class="value">
          <span class="number">{this.varobj!.unittype == 'time' ? this.stringout : this.value}</span>
          <span class="unit">{this.unit}</span>
        </span>
        <a href="#" class="close">x</a>
      </div>
    );
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  

  }
 public formatValue(val: number): string {
    let prefix = val < 0 ? "-" : "";
    let time = Math.abs(val);
    let seconds = Math.floor(time % 60);
    let minutes = Math.floor((time / 60) % 60);
    let hours = Math.floor(Math.min(time / 3600, 99));
    return prefix + (val > 3600 ? hours + ":" : "") + ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2);
  }
}
