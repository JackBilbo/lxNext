import { FSComponent, DisplayComponent, NodeReference, VNode, ComponentProps, Subscribable, ConsumerSubject, Subject, EventBus, FacilityLoader, FacilityRepository, AirportFacility, FacilitySearchType, FacilityType, GeoPoint, UnitType } from '@microsoft/msfs-sdk';
import { FSEvents, simUnits, Units, staticvars, earthradius } from '../vars';
import { checkSimVarLoaded } from './utils';
import { calculateArrivalheight, calculateTimeToFly } from './customvars';
import { Navmap } from './interface';
import L from "leaflet";

interface NavPanelProps extends ComponentProps {
    eventBus: EventBus; 
}

interface TaskProps extends ComponentProps {
    eventBus: EventBus;
}

interface AirportentryProps extends ComponentProps {
    airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number};
    task: Task;
}

export const ownPosition:GeoPoint = new GeoPoint(0, 0);



export class Navpanel extends DisplayComponent<NavPanelProps> { 
    private eventBus: EventBus = this.props.eventBus;
    private facLoader: any;

    private tabsref = FSComponent.createRef<HTMLDivElement>();
    private taskbuttonref = FSComponent.createRef<HTMLButtonElement>();
    private airportbuttonref = FSComponent.createRef<HTMLButtonElement>();
    private taskpanelref = FSComponent.createRef<HTMLDivElement>();
    private airportpanelref = FSComponent.createRef<HTMLDivElement>();
    private airportrefs: {[key: string]: NodeReference<Airportentry>} = {};
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
                        <Task eventBus={this.eventBus} ref={this.taskref} />
                    </div>
                    <div ref={this.airportpanelref} class="airportlist">
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
        let tempwp = new Waypoint(ownPosition.lat, ownPosition.lon, SimVar.GetSimVarValue("INDICATED ALTITUDE", "m"), 500, "Home");
        this.taskref.instance.create("Basic Task", [ tempwp ]);

        this.loadAirports(this.eventBus);
    } 

    public update() {

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
              this.airportrefs[diff.removed[i].icao].instance.remove();
            }
          
            await Promise.all(diff.added.map(async (icao: string) => {
              const airport = await this.facLoader.getFacility(FacilityType.Airport, icao);
              nearestAirports.set(icao, airport);
              let thisref = FSComponent.createRef<Airportentry>();
              this.airportrefs[icao] = thisref;
              FSComponent.render(<Airportentry ref={thisref} airport={airport} task={this.taskref.instance} />, this.airportpanelref.instance);
            }));
            
            let temp = Array.from(nearestAirports.values());
            temp.sort((a, b) => {
                return this.getDistance(a) - this.getDistance(b);
            });

            temp.forEach((airport,index) => {
                this.airportrefs[airport.icao].instance.update(this.getDistance(airport), ownPosition.bearingTo(airport.lat, airport.lon));
                this.airportrefs[airport.icao].instance.setOrder(index);
            })
        }, 1000);
    }

    getDistance(airport: AirportFacility) {
        let geo = new GeoPoint(airport.lat, airport.lon);
        let distance_m = geo.distance(ownPosition.lat, ownPosition.lon) * earthradius[Units.distance[simUnits].simunit];
        return distance_m;
    }

};


class Airportentry extends DisplayComponent<AirportentryProps> {
    private airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number} = this.props.airport;
    private thisref = FSComponent.createRef<HTMLDivElement>();
    private currentDistance = Subject.create<number>(0);
    private currentBearing = Subject.create<string>("");
    private currentHeading = Subject.create<number>(0);
    private unit = Subject.create<string>(Units.distance[simUnits].label);
    private task = this.props.task;

    constructor(props: AirportentryProps) {
        super(props);

    }
    render(): VNode {
        return (
            <div ref={this.thisref} class="ap_entry">
                <div class="ap_icao">{this.airport.icao.replace(/A\s*/,'')}</div>
                <div class="ap_name">{Utils.Translate(this.airport.name)}</div>
                <div class="ap_bearing">{this.currentHeading}&deg; <span style={this.currentBearing}>&uarr;</span></div>
                <div class="ap_distance">{this.currentDistance} {this.unit}</div>
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.thisref.instance.addEventListener('click', () => {
            this.task.create("DTO", [ new Waypoint(this.airport.lat, this.airport.lon, 0, 500, Utils.Translate(this.airport.name)) ]);
        })
    }

    setOrder(order: number) {
        this.thisref.instance.style.order = order.toString();
    }

    update(distance: number, bearing: number) {
        this.unit.set(Units.distance[simUnits].label);  
        this.currentDistance.set(Math.round(distance));
        this.currentHeading.set(Math.round(bearing));
        this.currentBearing.set("transform: rotate(" + Math.round(bearing - (staticvars.heading as number)) + "deg)");
    }

    remove() {
        this.thisref.instance.remove();
    }
}

class Task extends DisplayComponent<TaskProps> {
    private eventBus = this.props.eventBus;
    public name = Subject.create<string>("Task");
    public status = Subject.create<string>("Prestart");
    public waypoints = Subject.create<Waypoint[]>([]); // Waypoint[] = [];
    public current_waypoint_index = Subject.create<number>(0);
    private waypointentries: NodeReference<WaypointDisplay>[] = [];
    public waypointlistref = FSComponent.createRef<HTMLDivElement>();

    create(name: string, waypoints: Waypoint[]) {
        this.waypointentries.forEach((w) => { console.log(w); w.instance.destroy(); });
        this.name.set(name);
        this.waypoints.set(waypoints);
        this.current_waypoint_index.set(0);
        
    }

    public current_wp() {
        return this.waypoints.get()[this.current_waypoint_index.get()];
    }

    public get_wp(i:number) {
        return this.waypoints.get()[i];
    }

    update() {
        
    }
    render() {
        return (
            <div>
                <div class="taskheader">
                    <h2>{this.name} - {this.current_waypoint_index} / {this.waypoints.get().length}</h2>
                </div>
                
                <div id="waypointlist" ref={this.waypointlistref}></div>
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.waypointlistref.instance.innerHTML = ""; //

        console.log(this.waypoints.get());
        this.waypoints.sub((ele) => {
            // this.waypointlistref.instance.innerHTML = "";
            ele.forEach((wp,i) => {       
                const wpref = FSComponent.createRef<WaypointDisplay>();
                FSComponent.render(<WaypointDisplay ref={wpref} task={this} waypoint={wp} eventBus={this.eventBus} index={i} />, this.waypointlistref.instance);
                this.waypointentries.push(wpref);
            })
        })

    }
} 

interface WaypointDisplayProps extends ComponentProps {
    task: Task;
    waypoint: Waypoint;
    eventBus: EventBus;
    index: number;
}

class WaypointDisplay extends DisplayComponent<WaypointDisplayProps> {
    private task = this.props.task;
    private eventBus = this.props.eventBus;
    private waypoint: Waypoint = this.props.waypoint;
    private waypointclass = Subject.create<string>("waypoint");
    private name = Subject.create<string>(this.waypoint.name);
    private distance = Subject.create<number>(0);
    private bearing = Subject.create<number>(0);
    private arrivalheight = Subject.create<number>(0);
    private ete = Subject.create<string>('00:00:00');
    private currentBearing = Subject.create<string>("");
    private planeLat: number = staticvars.planelat as number;
    private planeLong: number = staticvars.planelong as number;
    private index = this.props.index;
    private unit = Subject.create<string>(Units.distance[simUnits].label);
    private altunit = Subject.create<string>(Units.altitude[simUnits].label);
    private htmlref = FSComponent.createRef<HTMLDivElement>();
    private startaltitude: number = 0;
    private coursetofly: number = 0;

    private waypointmapmarker: L.Circle;
    private waypointlegline: L.Polyline;

    constructor(props: WaypointDisplayProps) {
        super(props);

        this.waypointmapmarker = L.circle([this.waypoint.lat, this.waypoint.lon], this.waypoint.radius, {
            color: '#C60AC6',
            fillColor: '#C60AC6',
            fillOpacity: 0.3
        }).addTo(Navmap!.map);

        this.waypointlegline = L.polyline([[this.planeLat, this.planeLong],[this.waypoint.lat, this.waypoint.lon]], { 
            color: '#ffcc00',
            weight: 3 
        }).addTo(Navmap!.map);

        const subscriber = this.eventBus.getSubscriber<FSEvents>();
        const unittype = subscriber.on('simUnits').whenChanged().handle((mu) => {
            this.unit.set(Units.distance[mu].label);  
        });

        const lat_consumer = subscriber.on('planelat').onlyAfter(1000).whenChanged().handle((lat) => {
            this.planeLat = lat;
            this.distance.set(Math.round(this.waypoint.distance(this.planeLat, this.planeLong) * earthradius[Units.distance[simUnits].simunit]));
            this.bearing.set(Math.round(this.waypoint.bearingFrom(this.planeLat, this.planeLong)));
            if(this.index === this.task.current_waypoint_index.get()) {
                this.updateWaypointvars();
            }
        });

        const long_consumer = subscriber.on('planelong').onlyAfter(1000).whenChanged().handle((long) => {
            this.planeLong = long;
            this.distance.set(Math.round(this.waypoint.distance(this.planeLat, this.planeLong) * earthradius[Units.distance[simUnits].simunit]));
            this.bearing.set(Math.round(this.waypoint.bearingFrom(this.planeLat, this.planeLong)));
        });

        if(this.isCurrentwaypoint()) {
            this.updateWaypointvars();
        }
        
        
    }
    render(): VNode {
        return (
            <div ref={this.htmlref} class={this.waypointclass}>
               <div class="wp_name">{this.name} ({this.waypoint.alt})</div>
               <div class="wp_minmax">min. {this.waypoint.min_alt} / max.{this.waypoint.max_alt}</div>
               <div class="wp_bearing">{this.bearing}&deg; <span style={this.currentBearing}>&uarr;</span></div>
               <div class="wp_distance">{this.distance} {this.unit}</div>
               <div class="wp_ete">ETE {this.ete} min</div>
               <div class="wp_arrivalheight">Arr. {this.arrivalheight} {this.altunit}</div>
            </div>
        )
    }

    updateWaypointvars() {
        this.currentBearing.set("transform: rotate(" + Math.round(this.bearing.get() - (staticvars.heading as number)) + "deg");
        this.waypointlegline.setLatLngs([[this.planeLat, this.planeLong],[this.waypoint.lat, this.waypoint.lon]]);

        if(this.isCurrentwaypoint()) {
            SimVar.SetSimVarValue("L:LXN_WP_DIST", "km", this.distance.get());
            SimVar.SetSimVarValue("L:LXN_WP_HEADING", "deg", this.bearing.get());
            this.waypointclass.set("waypoint wp_current");

            this.startaltitude = staticvars.alt as number;
            this.coursetofly = this.bearing.get();
        } else {
            this.waypointclass.set("waypoint");
            this.startaltitude = this.task.get_wp(this.index - 1).alt;
            this.coursetofly = this.task.get_wp(this.index - 1).bearingTo(this.waypoint.lat, this.waypoint.lon);
        }
        
        let ete_s: number;
        /* Calculate ETE and Arrivalheight */
        if(simUnits === 0) {
            /* Imperial units, so convert */
            this.arrivalheight.set(Math.round((calculateArrivalheight(this.distance.get() * 1852, this.coursetofly, this.startaltitude / 3.281)) * 3.281));
            ete_s = calculateTimeToFly(this.distance.get() * 1852, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "nmiles", this.arrivalheight.get());
        } else if(simUnits === 1) {
            /* hybrid */
            this.arrivalheight.set(Math.round(calculateArrivalheight(this.distance.get() * 1000, this.coursetofly, this.startaltitude / 3.281) * 3.281));
            ete_s = calculateTimeToFly(this.distance.get() * 1000, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "m", this.arrivalheight.get());
        } else {
            /* metric */
            console.log(calculateArrivalheight(this.distance.get(), this.coursetofly, this.startaltitude));
            this.arrivalheight.set(Math.round(calculateArrivalheight(this.distance.get() * 1000, this.coursetofly, this.startaltitude)));
            ete_s = calculateTimeToFly(this.distance.get() * 1000, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "m", this.arrivalheight.get());
        }

        SimVar.SetSimVarValue("L:LXN_WP_ETE", "s", ete_s);
    }

    private formatValue(val: number): string {
        let time = Math.abs(val);
        let seconds = Math.floor(time % 60);
        let minutes = Math.floor((time / 60) % 60);
        let hours = Math.floor(Math.min(time / 3600, 99));
        return hours + ":" + ("0" + minutes).substr(-2);
      }

    isCurrentwaypoint() {
        return this.index === this.task.current_waypoint_index.get();
    }

    destroy(): void {
        super.destroy();
        this.index = -1;
        this.waypointmapmarker.remove();
        this.waypointlegline.remove();
        this.htmlref.instance.remove();
        console.log("waypoint destroying");
    }
}

interface WaypointInterface extends GeoPoint {
    name: string;
    alt: number;
    radius: number;
    max_alt: number | null;
    min_alt: number | null; 
}

class Waypoint extends GeoPoint implements WaypointInterface {
    public alt: number;
    public radius: number;
    public name: string;
    public max_alt: number | null;
    public min_alt: number | null;
    constructor(lat: number, lon: number, alt: number, radius?: number, name?: string) {
        super(lat, lon);
        this.alt = alt;
        this.name = name ?? "Waypoint";
        this.radius = radius ?? 500;
        this.max_alt = alt ?? null;
        this.min_alt = alt ?? null;
    }

    update() {

    }
}

