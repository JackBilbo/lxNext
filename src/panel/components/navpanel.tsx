import { FSComponent, DisplayComponent, NodeReference, VNode, ComponentProps, Subscribable, ConsumerSubject, Subject, EventBus, FacilityLoader, FacilityRepository, AirportFacility, FacilitySearchType, FacilityType, GeoPoint, UnitType } from '@microsoft/msfs-sdk';
import { FSEvents, simUnits, Units, staticvars, earthradius, colors } from '../vars';
import { checkSimVarLoaded, pref } from './utils';
import { calculateArrivalheight, calculateTimeToFly } from './customvars';
import { Navmap } from './interface';
import * as L from "leaflet";
import { Tasklist, Tasktemplate } from './tasklist';
import { Semicircle } from '@mirei/leaflet-semicircle-ts';
import { stat } from 'fs';



interface NavPanelProps extends ComponentProps {
    eventBus: EventBus; 
}

interface TaskProps extends ComponentProps {
    eventBus: EventBus;
}

interface AirportentryProps extends ComponentProps {
    airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number, altitude: number };
    task: Task;
}

export const ownPosition:GeoPoint = new GeoPoint(0, 0);



export class Navpanel extends DisplayComponent<NavPanelProps> { 
    private eventBus: EventBus = this.props.eventBus;
    private facLoader: any;

    private panelref = FSComponent.createRef<HTMLDivElement>();
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
            <div id="navpanel" class="panel" ref={this.panelref}>
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
                <a href="#" id="tabclose">x</a>      
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

        setTimeout(() => {
            ownPosition.set(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degree longitude"));
            // let testwp = new Waypoint(53.45, 10.3, 1000, 750, "Test WP");
            let tempwp = new Waypoint(ownPosition.lat, ownPosition.lon, staticvars.alt as number, "circle", 500, "Home");
            this.taskref.instance.create("Basic Task", [ tempwp ]);
        },1000);

        this.panelref.instance.querySelector('#tabclose')!.addEventListener('click', () => {
            this.closePanel();
        })
        

        this.loadAirports(this.eventBus);
    } 

    public closePanel() {
        this.panelref.instance.classList.remove('active');
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
            const diff = await session.searchNearest(lat, lon, distanceMeters, 20);
          
            for (let i = 0; i < diff.removed.length; i++) {
              nearestAirports.delete(diff.removed[i]);
              if( this.airportrefs[diff.removed[i]]){
                this.airportrefs[diff.removed[i]].instance.remove();
              }
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
    private airport: {name: string, icao: string, lat: number, lon: number, distance_m: number, bearing: number, altitude: number } = this.props.airport;
    private thisref = FSComponent.createRef<HTMLDivElement>();
    private currentDistance = Subject.create<number>(0);
    private currentBearing = Subject.create<string>("");
    private currentHeading = Subject.create<number>(0);
    private altitude = Subject.create<number>(Math.round(pref('altitude', 'm', this.airport.altitude) as number));
    private unit = Subject.create<string>(Units.distance[simUnits].label);
    private altunit = Subject.create<string>(Units.altitude[simUnits].label);
    private task = this.props.task;

    constructor(props: AirportentryProps) {
        super(props);
        this.airport = this.props.airport;

    }
    render(): VNode {
        return (
            <div ref={this.thisref} class="ap_entry">
                <div class="ap_icao">{this.airport.icao.replace(/A\s*/,'')}</div>
                <div class="ap_name">{Utils.Translate(this.airport.name)} ({this.altitude} {this.altunit})</div>
                <div class="ap_bearing">{this.currentHeading}&deg; <span style={this.currentBearing}>&uarr;</span></div>
                <div class="ap_distance">{this.currentDistance} {this.unit}</div>
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.thisref.instance.addEventListener('click', () => {
            document.querySelectorAll('.ap_entry.selected').forEach((el) => { el.classList.remove('selected') });
            this.thisref.instance.classList.add('selected');
            let alt = this.airport.altitude !== undefined ? this.airport.altitude : 0;
            this.task.create("DTO", [ new Waypoint(this.airport.lat, this.airport.lon, alt, "circle", 500, Utils.Translate(this.airport.name)) ]);
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

export class Task extends DisplayComponent<TaskProps> {
    private eventBus = this.props.eventBus;
    public name = Subject.create<string>("Task");
    public status = Subject.create<string>("Prestart");
    public waypoints = Subject.create<Waypoint[]>([]); // Waypoint[] = [];
    public current_waypoint_index = Subject.create<number>(0);
    private waypointentries: NodeReference<WaypointDisplay>[] = [];
    public waypointlistref = FSComponent.createRef<HTMLDivElement>();
    public tasksearchref = FSComponent.createRef<HTMLDivElement>();
    private totaldistance_m = 0;
    private taskaverage = 0;
    private distancetogo_m = Subject.create<number>(0);

    public isStarted: boolean = false;
    public starttime: number = 0;
    public endtime: number = 0;
    public startindex: number = 0;
    public finishindex: number = 0;

    constructor(props: TaskProps) {
        super(props);

        const subscriber = this.eventBus.getSubscriber<FSEvents>();
        const lat_consumer = subscriber.on('simtime').onlyAfter(500).whenChanged().handle((simtime) => {
            if(this.isStarted) {
                SimVar.SetSimVarValue("L:LXN_TASKTIME", "number", simtime - this.starttime);

                let togo = 0
                for (let i = this.current_waypoint_index.get(); i <= this.finishindex; i++ ) {
                    togo += this.waypointentries[i].instance.distance_m;
                }
                this.distancetogo_m.set(Math.round(togo));
                this.taskaverage = (this.totaldistance_m - togo) / (simtime - this.starttime);

                SimVar.SetSimVarValue("L:LXN_TASKAVERAGE", "m/s", this.taskaverage); 
            }
        });
    }

    create(name: string, waypoints: Waypoint[]) {
        this.waypointentries.forEach((w) => { if (w.instance) w.instance.destroy(); });
        this.finishindex = waypoints.length -1;
        this.name.set(name);
        this.waypoints.set(waypoints);
        this.current_waypoint_index.set(0);
        this.isStarted = false;
        SimVar.SetSimVarValue("L:LXN_TASKTIME", "number", 0);

                
    }

    public current_wp() {
        return this.waypoints.get()[this.current_waypoint_index.get()];
    }

    public get_wp(i:number) {
        return this.waypoints.get()[i];
    }

    public next_wp() {
        if(this.waypoints.get().length > this.current_waypoint_index.get()) {
            this.current_waypoint_index.set(this.current_waypoint_index.get() + 1);
        }
    }

    public prev_wp() {
        if(this.current_waypoint_index.get() > 0) {
            this.current_waypoint_index.set(this.current_waypoint_index.get() - 1);
        }
    }

    public starttask() {
        this.isStarted = true;
        this.starttime = staticvars.simtime as number;
        this.status.set("Started");  
    }

    public endtask() {
        this.isStarted = false;
        this.endtime = staticvars.simtime as number;
        this.status.set("Finished");
    }

    update() {
                
    }
    render() {
        return (
            <div>
                <div class="taskheader">
                    <h2>{this.name} - {this.status} - {this.distancetogo_m} m to go</h2>
                    <div class="taskbuttons">
                        <button id="wpprev">WP -</button>
                        <button id="wpnext">WP +</button>
                        <button id="tasksearch">Search</button>
                    </div>
                    
                </div>
                
                <div id="waypointlist" ref={this.waypointlistref}></div>
                <div id="tasklist" ref={this.tasksearchref}>
                    <Tasklist eventBus={this.eventBus} taskref={this} />
                </div>
            </div>
        )
    }

    showTasklist() {
       this.tasksearchref.instance.classList.toggle('active');
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
        this.waypointlistref.instance.innerHTML = ""; //

        this.waypoints.sub((ele) => {
            // this.waypointlistref.instance.innerHTML = "";
            
            ele.forEach((wp,i) => {       
                const wpref = FSComponent.createRef<WaypointDisplay>();
                FSComponent.render(<WaypointDisplay ref={wpref} task={this} waypoint={wp} eventBus={this.eventBus} index={i} />, this.waypointlistref.instance);
                this.waypointentries[i] = wpref;
            })

            if(this.startindex != this.finishindex) {
                this.totaldistance_m = 0;
                for (let i = this.startindex + 1; i <= this.finishindex; i++ ) {
                    console.log(i + ": " + this.waypointentries[i].instance.name.get() + ": " + this.waypointentries[i].instance.distance_m);
                    this.totaldistance_m += this.waypointentries[i].instance.distance_m;
                }
                this.distancetogo_m.set(Math.round(this.totaldistance_m));
            }
        })

        document.getElementById('tasksearch')?.addEventListener('click', () => this.showTasklist());
        document.getElementById('wpprev')?.addEventListener('click', () => this.prev_wp());
        document.getElementById('wpnext')?.addEventListener('click', () => this.next_wp());
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
    public waypoint: Waypoint = this.props.waypoint;
    private waypointclass = Subject.create<string>("waypoint");
    public name = Subject.create<string>(this.waypoint.name);
    public alt = Subject.create<number>(Math.round(this.waypoint.alt));
    public distance = Subject.create<number>(0);
    public distance_m:number = 0;
    private bearing = Subject.create<number>(0);
    public arrivalheight = Subject.create<number>(0);
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
    private distancetofly: number = 0;
    private isChecked: boolean = false;

    private waypointmapmarker: any;
    private waypointlegline: any;

    constructor(props: WaypointDisplayProps) {
        super(props);

        const subscriber = this.eventBus.getSubscriber<FSEvents>();
        const unittype = subscriber.on('simUnits').whenChanged().handle((mu) => {
            this.unit.set(Units.distance[mu].label);  
        });

        const lat_consumer = subscriber.on('planelat').onlyAfter(500).whenChanged().handle((lat) => {
            this.planeLat = lat;
            this.updateWaypointvars();
        });

        const long_consumer = subscriber.on('planelong').onlyAfter(500).whenChanged().handle((long) => {
            this.planeLong = long;
        });

        this.waypointclass.set("waypoint");
                
        if(this.index > 0) {
            this.coursetofly = this.task.get_wp(this.index - 1).bearingTo(this.waypoint.lat, this.waypoint.lon);
            this.distancetofly = this.task.get_wp(this.index - 1).distance(this.waypoint.lat, this.waypoint.lon) * earthradius[Units.distance[simUnits].simunit];
            this.distance_m = this.task.get_wp(this.index - 1).distance(this.waypoint.lat, this.waypoint.lon) * earthradius['m'];
            this.distance.set(Math.round(this.distancetofly));
            this.bearing.set(Math.round(this.coursetofly));
        }

        this.addMapfeatures();
        this.updateWaypointvars();
        
    }
    render(): VNode {
        return (
            <div ref={this.htmlref} class={this.waypointclass}>
               <div class="wp_name">{this.index} {this.name} ({this.alt} {this.altunit}) {this.index == this.task.finishindex ? "Finish" : ""}{this.index == this.task.startindex ? "Start" : ""}</div>
               <div class="wp_minmax">min. {this.waypoint.min_alt} / max.{this.waypoint.max_alt}</div>
               <div class="wp_bearing">{this.bearing}&deg; <span style={this.currentBearing}>&uarr;</span></div>
               <div class="wp_distance">{this.distance} {this.unit}</div>
               <div class="wp_ete">ETE {this.ete} min</div>
               <div class="wp_arrivalheight">Arr. {this.arrivalheight} {this.altunit}</div>
            </div>
        )
    }

    addMapfeatures() {
        
        this.waypointlegline = L.polyline([[this.index > 0 ? this.task.get_wp(this.index - 1).lat : this.planeLat, this.index > 0 ? this.task.get_wp(this.index - 1).lon : this.planeLong],[this.waypoint.lat, this.waypoint.lon]], { 
            color: colors.flightplanleg,
            weight: 3 
        }).addTo(Navmap!.map);

        let angle, direction;
        if(this.index == 0 ||  this.task.get_wp(this.index + 1) == null) {
            angle = 360;
            direction = 0;    
        } else if(this.waypoint.obstype === "sector") {
            let a = this.waypoint.bearingTo(this.task.get_wp(this.index - 1));
            let b = this.waypoint.bearingTo(this.task.get_wp(this.index + 1));
            let tempdir = 0;
            if(Math.abs(a-b) < 180) {
                let diff = Math.abs(a-b);
                tempdir = a < b ? a + diff / 2 : b + diff / 2;    
            } else {
                let diff = 360 - Math.abs(a-b);
                tempdir = a < b ? a - diff / 2 : b - diff / 2;
            } 
            
            direction = (tempdir + 180) % 360;
            angle = 90;
            this.waypoint.radius = 20000;
        } else {
            angle = 360;
            direction = 0;     
        }

        this.waypointmapmarker = new Semicircle([this.waypoint.lat, this.waypoint.lon])
            .setStyle({ color: colors.flightplanleg, fillColor: colors.flightplanleg, fillOpacity: 0.3, radius: this.waypoint.radius })
            .setDirection(direction, angle)
            .addTo(Navmap!.map);

    }
    updateWaypointvars() {
        this.currentBearing.set("transform: rotate(" + Math.round(this.bearing.get() - (staticvars.heading as number)) + "deg");
        
        if(this.isCurrentwaypoint()) {
            this.distance.set(Math.round(this.waypoint.distance(this.planeLat, this.planeLong) * earthradius[Units.distance[simUnits].simunit]));
            this.distance_m = this.waypoint.distance(this.planeLat, this.planeLong) * earthradius['m'];
            this.bearing.set(Math.round(this.waypoint.bearingFrom(this.planeLat, this.planeLong)));

            this.waypointlegline
                .setLatLngs([[this.planeLat, this.planeLong],[this.waypoint.lat, this.waypoint.lon]])
                .setStyle({ color: colors.activeleg });

            this.waypointmapmarker.setStyle({ color: colors.activeleg, fillColor: colors.activeleg });

            SimVar.SetSimVarValue("L:LXN_WP_DIST", "km", this.distance.get());
            SimVar.SetSimVarValue("L:LXN_WP_HEADING", "deg", this.bearing.get());
            this.waypointclass.set("waypoint wp_current");

            this.startaltitude = staticvars.alt as number;
            this.coursetofly = this.bearing.get();
            this.distancetofly = this.distance.get();

            if(this.planeInsideWaypoint()) {
                this.task.next_wp();
                this.isChecked = true;
                if(this.index === this.task.startindex && this.index !== this.task.finishindex) {
                    this.task.starttask();
                }
                if(this.index !== this.task.startindex && this.index === this.task.finishindex) {
                    this.task.endtask();
                }
            }

        } else {
            if(this.index > this.task.current_waypoint_index.get()) {
            
                this.startaltitude = this.task.get_wp(this.index - 1).arrivalheight;
            } else {
                this.waypointlegline.remove();
                this.waypointmapmarker.setStyle({ color: (this.isChecked ? colors.validwaypoint : colors.missedwaypoint), fillColor: (this.isChecked ? colors.validwaypoint : colors.missedwaypoint) });
                this.waypointclass.set("waypoint passed");
                this.arrivalheight.set(0);
                this.ete.set(this.formatValue(0));
                return;
            }
            
        }
        
        let ete_s: number;
        /* Calculate ETE and Arrivalheight */
        if(simUnits === 0) {
            /* Imperial units, so convert */
            this.arrivalheight.set(Math.round((calculateArrivalheight(this.distancetofly * 1852, this.coursetofly, this.startaltitude / 3.281)) * 3.281));
            ete_s = calculateTimeToFly(this.distancetofly * 1852, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            if(this.isCurrentwaypoint()) {
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "ft", this.arrivalheight.get());
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT_AGL", "ft", this.arrivalheight.get() - (this.alt.get() * 3.281));
            }
        } else if(simUnits === 1) {
            /* hybrid */
            this.arrivalheight.set(Math.round(calculateArrivalheight(this.distancetofly * 1000, this.coursetofly, this.startaltitude / 3.281) * 3.281));
            ete_s = calculateTimeToFly(this.distancetofly * 1000, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            if(this.isCurrentwaypoint()) {
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "m", this.arrivalheight.get());
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT_AGL", "m", this.arrivalheight.get() - this.alt.get());
            }
        } else {
            /* metric */
            
            this.arrivalheight.set(Math.round(calculateArrivalheight(this.distancetofly * 1000, this.coursetofly, this.startaltitude)));
            ete_s = calculateTimeToFly(this.distancetofly * 1000, this.coursetofly);
            this.ete.set(this.formatValue(ete_s));
            if(this.isCurrentwaypoint()) {
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT", "m", this.arrivalheight.get());
                SimVar.SetSimVarValue("L:LXN_WP_ARRIVAL_HEIGHT_AGL", "m", this.arrivalheight.get() - this.alt.get());
            }
        }

        this.task.get_wp(this.index).arrivalheight = this.arrivalheight.get();

        if(this.isCurrentwaypoint()) {
            SimVar.SetSimVarValue("L:LXN_WP_ETE", "s", ete_s);
        }

    
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
    }

    planeInsideWaypoint() {
        if(this.distance_m <= 0) return false;

        let pos = Navmap!.map.latLngToLayerPoint(L.latLng(this.planeLat, this.planeLong));
        let isInside = this.waypointmapmarker._containsPoint(pos);

        return isInside;
    }
}

interface WaypointInterface extends GeoPoint {
    name: string;
    alt: number;
    obstype: string;
    radius: number;
    max_alt: number | null;
    min_alt: number | null; 
}

export class Waypoint extends GeoPoint implements WaypointInterface {
    public alt: number;
    public radius: number;
    public name: string;
    public obstype: string;
    public max_alt: number | null;
    public min_alt: number | null;
    public arrivalheight: number;
    constructor(lat: number, lon: number, alt: number, obstype: string, radius?: number, name?: string) {
        super(lat, lon);
        this.alt = alt;
        this.name = name ?? "Waypoint";
        this.radius = radius ?? 500;
        this.obstype = obstype;
        this.max_alt = alt ?? null;
        this.min_alt = alt ?? null;
        this.arrivalheight = alt;
    }

    update() {

    }
}

