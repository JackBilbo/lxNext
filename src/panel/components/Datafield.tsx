import { FSComponent, DisplayComponent, VNode, ComponentProps, Subscribable, EventBus, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import { Units, vars, FSEvents, simUnits } from '../vars';

interface DatafieldProps extends ComponentProps {
  bus: EventBus,
  variable: any
}


export class Datafield extends DisplayComponent<DatafieldProps> {
  
  private readonly value: Subscribable<number>;
  private readonly varobj = vars.find((v) => v.name == this.props.variable);

  private unit = Subject.create<string>(Units[this.varobj!.unittype][simUnits].label);
  private readonly elementRef = FSComponent.createRef<HTMLDivElement>();

  constructor(props: DatafieldProps) {
    super(props);
    
    const subscriber = props.bus.getSubscriber<FSEvents>();
    const consumer = subscriber.on(this.props.variable).withPrecision(this.varobj!.precision);
    const unittype = subscriber.on('simUnits').whenChanged().handle((mu) => {
        this.unit.set(Units[this.varobj!.unittype][mu].label);  
    });
  
    this.value = ConsumerSubject.create(consumer, 0);
  }

  public render(): VNode {
    return (
      <div ref={this.elementRef} class="datafield">
        <span class="label">{this.varobj?.shortlabel}</span>
        <span class="value">
          <span class="number">{this.value}</span>
          <span class="unit">{this.unit}</span>
        </span>
        <a href="#" class="close">x</a>
      </div>
    );
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  

  }
 public formatValue(value: number): string {
  console.log(value);
    return value.toFixed(this.varobj!.precision);
  }
}