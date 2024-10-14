import { FSComponent, DisplayComponent, NodeReference, VNode, ComponentProps, Subscribable, Consumer, Subject, EventBus, FacilityLoader, FacilityRepository, AirportFacility, FacilitySearchType, FacilityType, GeoPoint } from '@microsoft/msfs-sdk';
import { simUnits, vars } from '../vars';
import { checkSimVarLoaded } from './utils';

interface NavPanelProps extends ComponentProps {
    bus: EventBus;
}

interface TaskProps extends ComponentProps {
    
}

interface AirportentryProps extends ComponentProps {
    airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number};
}

export const ownPosition:GeoPoint = new GeoPoint(0, 0);



export class Navpanel extends DisplayComponent<NavPanelProps> { 
    private eventBus: EventBus = this.props.bus;
    private facLoader: any;

    private tabsref = FSComponent.createRef<HTMLDivElement>();
    private taskbuttonref = FSComponent.createRef<HTMLButtonElement>();
    private airportbuttonref = FSComponent.createRef<HTMLButtonElement>();
    private taskpanelref = FSComponent.createRef<HTMLDivElement>();
    private airportpanelref = FSComponent.createRef<HTMLDivElement>();
    private airportlistref = FSComponent.createRef<HTMLUListElement>();
    private lastAirportlist = new Map<string, AirportFacility>();
    private taskref = FSComponent.createRef<Task>();

    constructor(props: NavPanelProps) {
        super(props);

        checkSimVarLoaded.then(() => {
            
        })
    }

    render(): VNode {
        return(
            <div id="navpanel" class="panel active">
                <div class="tabs" ref={this.tabsref}>
                    <button ref={this.taskbuttonref} class="active">Task</button>
                    <button ref={this.airportbuttonref}>Nearest Airports</button>
                </div>
                <div id="tabcontent">
                    <div ref={this.taskpanelref} class="active">
                        <Task ref={this.taskref} />
                    </div>
                    <div ref={this.airportpanelref}>
                        <ul ref={this.airportlistref}></ul>
                    </div>
                </div>      
            </div>
        )
   
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.taskbuttonref.instance.addEventListener('click', () => {
            this.taskbuttonref.instance.classList.add('active');
            this.airportbuttonref.instance.classList.remove('active');
            this.taskpanelref.instance.classList.add('active');
            this.airportpanelref.instance.classList.remove('active');
        });

        this.airportbuttonref.instance.addEventListener('click', () => {
            this.taskbuttonref.instance.classList.remove('active');
            this.airportbuttonref.instance.classList.add('active');
            this.taskpanelref.instance.classList.remove('active');
            this.airportpanelref.instance.classList.add('active');
        });

        ownPosition.set(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degree longitude"));
        let tempwp = new Waypoint(ownPosition.lat, ownPosition.lon, SimVar.GetSimVarValue("INDICATED ALTITUDE", "m"), "Home");
        this.taskref.instance.create("Basic Task", [ tempwp ]);

        this.loadAirports(this.eventBus);
    } 

    public update() {
        if(this.airportpanelref.instance.classList.contains('active')) {    
            this.renderAirports();
        }
    }

    async loadAirports(eventBus: EventBus) {
        
        this.facLoader = new FacilityLoader(FacilityRepository.getRepository(eventBus));

        const nearestAirports = new Map<string, AirportFacility>();
        const session = await this.facLoader.startNearestSearchSession(FacilitySearchType.Airport);

        setInterval(async () => {
            const lat = ownPosition.lat; 
            const lon = ownPosition.lon; 
          
            const distanceMeters = 100000;
            const diff = await session.searchNearest(lat, lon, distanceMeters, 25);
          
            for (let i = 0; i < diff.removed.length; i++) {
              nearestAirports.delete(diff.removed[i]);
            }
          
            await Promise.all(diff.added.map(async (icao: string) => {
              const airport = await this.facLoader.getFacility(FacilityType.Airport, icao);
              nearestAirports.set(icao, airport);
            }));
            
            if(nearestAirports != this.lastAirportlist) {
                this.lastAirportlist = nearestAirports;
                this.renderAirports();
            }
        }, 1000);
    }

    renderAirports() {
        let temparray: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number}[] = [];

        this.lastAirportlist.forEach((airport) => {
            let geo = new GeoPoint(airport.lat, airport.lon);
            let distance_m = geo.distance(ownPosition.lat, ownPosition.lon) * 6371000;
            let bearing = geo.bearingFrom(ownPosition.lat, ownPosition.lon);
            temparray.push({name: airport.name, icao: airport.icao, lat: airport.lat, lon: airport.lon, distance_m: distance_m, bearing: bearing});
        });

        temparray.sort((a, b) => {
            return a.distance_m - b.distance_m;
        });

        this.airportlistref.instance.innerHTML = "";
        temparray.forEach((airport) => {
            FSComponent.render(<Airportentry airport={airport} />, this.airportlistref.instance);
        })
    }

    airportclickhandler(icao: string) {
        console.log("Airport clicked: " + icao);
    }

};


class Airportentry extends DisplayComponent<AirportentryProps> {
    private airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number} = this.props.airport;
    private thisref = FSComponent.createRef<HTMLLIElement>();

    render(): VNode {
        return (
            <li ref={this.thisref}>{this.airport.icao.replace(/A\s*/,'')} - {Utils.Translate(this.airport.name)} - {this.airport.bearing.toFixed(0)}&deg; - {(this.airport.distance_m / 1000).toFixed(0)}km</li>
        )
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.thisref.instance.addEventListener('click', () => {
            console.log(this.airport.icao);
        })
    }
}

class Task extends DisplayComponent<TaskProps> {
    public name = Subject.create<string>("Task");
    public status = Subject.create<string>("Prestart");
    public waypoints = Subject.create<Waypoint[]>([]); // Waypoint[] = [];
    public current_waypoint_index: number = 0;
    private wpref = new Array<any>();

    create(name: string, waypoints: Waypoint[]) {
        this.name.set(name);
        this.waypoints.set(waypoints);
        this.current_waypoint_index = 0;
        console.log(this.waypoints.get()[0].name);
    }

    public current_wp() {
        return "foo";
    }

    update() {
        
    }
    render() {
        let check = new Waypoint(0,0,0,"foo");
        return (
            <div>
                <h2>{this.name} - ({this.status}) - {this.waypoints.get()[0]}</h2>
                {this.waypoints.get().map((el) => <WaypointDisplay waypoint={el} />)} 
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        let arr = this.waypoints.sub((ele) => {
            console.log(this.waypoints.map((wp) => wp));
        },true);
    }
} 

interface WaypointDisplayProps extends ComponentProps {
    waypoint: Waypoint;
}

class WaypointDisplay extends DisplayComponent<WaypointDisplayProps> {
    private waypoint: Waypoint = this.props.waypoint;
    private name = Subject.create<string>(this.waypoint.name);
    private distance = Subject.create<number>(0);
    render(): VNode {
        this.distance.set(this.waypoint.distance(ownPosition.lat, ownPosition.lon) * 6371);
        return (
            <div class="waypoint">Waypoint: {this.name} - {this.distance}km</div>
        )
    }
}

interface WaypointInterface extends GeoPoint {
    name: string;
    lat: number;
    lon: number;
    alt: number;
    max_alt: number | null;
    min_alt: number | null; 
}

class Waypoint extends GeoPoint implements WaypointInterface {
    public alt: number;
    public name: string;
    public max_alt: number | null;
    public min_alt: number | null;
    constructor(lat: number, lon: number, alt?: number, name?: string) {
        super(lat, lon);
        this.alt = alt ?? 0;
        this.name = name ?? "Waypoint";
        this.max_alt = alt ?? null;
        this.min_alt = alt ?? null;
    }

    update() {

    }
}

