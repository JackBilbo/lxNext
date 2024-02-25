import { FSComponent, DisplayComponent, ConsumerSubject, Subject } from '@microsoft/msfs-sdk';
export class MyComponent extends DisplayComponent {
    constructor(props) {
        super(props);
        this.unit = Subject.create('kph');
        this.elementRef = FSComponent.createRef();
        const subscriber = props.bus.getSubscriber();
        const consumer = subscriber.on(this.props.variable).withPrecision(0);
        const unittype = subscriber.on('masterunits').whenChanged().handle((mu) => {
            if (mu == "metric") {
                this.unit.set(this.props.unittype.metric);
            }
            else {
                this.unit.set(this.props.unittype.imperial);
            }
        });
        this.value = ConsumerSubject.create(consumer, 0);
    }
    render() {
        return (FSComponent.buildComponent("div", { ref: this.elementRef, class: 'my-component' },
            this.value,
            " ",
            this.unit));
    }
    onAfterRender(node) {
        super.onAfterRender(node);
        this.value.sub(airspeed => {
            if (airspeed < this.props.threshold) {
                this.elementRef.instance.classList.add('alert');
            }
            else {
                this.elementRef.instance.classList.remove('alert');
            }
        });
    }
}
//# sourceMappingURL=myComponent.js.map