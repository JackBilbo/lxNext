import { FSComponent, DisplayComponent, VNode, ComponentProps, Subscribable, EventBus, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
import { Units, FSEvents } from '../vars';

interface MyComponentProps extends ComponentProps {
  bus: EventBus,
  variable: any,
  unittype: any,
  threshold: number
}


export class MyComponent extends DisplayComponent<MyComponentProps> {

  private readonly value: Subscribable<number>;
  private unit = Subject.create<string>('kph');
  private readonly elementRef = FSComponent.createRef<HTMLDivElement>();

  constructor(props: MyComponentProps) {
    super(props);
  
    const subscriber = props.bus.getSubscriber<FSEvents>();
    const consumer = subscriber.on(this.props.variable).withPrecision(0);
    const unittype = subscriber.on('masterunits').whenChanged().handle((mu) => {
      if(mu == "metric") {
        this.unit.set(this.props.unittype.metric);
      } else {
        this.unit.set(this.props.unittype.imperial);  
      }
    });
  
  
    this.value = ConsumerSubject.create(consumer, 0);
  }

  public render(): VNode {
    return (
      <div ref={this.elementRef} class='my-component'>{this.value} {this.unit}</div>
    );
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  
    this.value.sub(airspeed => {
      if (airspeed < this.props.threshold) {
        this.elementRef.instance.classList.add('alert');
      } else {
        this.elementRef.instance.classList.remove('alert');
      }
    });
  }
}