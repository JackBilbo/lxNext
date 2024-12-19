import { FSComponent, DisplayComponent, NodeReference, VNode, EventBus,  } from  '@microsoft/msfs-sdk';
import { Waypoint, Task } from './navpanel';
import { localStorageGet, localStorageSet } from './localstorage';


interface TaskListProps {
    eventBus: EventBus
    taskref: Task
}

export interface Tasktemplate {
    name: string;
    distance: number;
    ruleset: string;
    waypoints: Waypoint[];
    taskref: Task;
}


export class Tasklist extends DisplayComponent<TaskListProps> {
    private eventBus = this.props.eventBus;
    private weGlideId: string = "";
    private weGlideApi = "https://corsproxy.io/?url=https://api.weglide.org/v1/task?starred_by=";
    private tasklist: Tasktemplate[] = [];
    private taskoutput = FSComponent.createRef<HTMLDivElement>();
    private taskref = this.props.taskref;
    

    constructor(props: TaskListProps) {
        super(props);

        localStorageGet("weGlideId").then((id) => {
            this.weGlideId = id as string;
            document.getElementById("weglideid")?.setAttribute("value", this.weGlideId);
            this.GetWeglideTasks();
        });
    }

    render(): VNode {
        return(
            <div>
                <h2>Tasklist</h2>
                <div class="idinput">
                    <input type="text" id="weglideid" placeholder="weglide ID" value={this.weGlideId}></input>
                     <button id="weglideidsubmit">Load Tasks</button>
                </div>

                <div id="weglidetasks" ref={this.taskoutput}>
                
                </div>
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        document.getElementById("weglideidsubmit")?.addEventListener("click", () => {
            this.GetWeglideTasks();
        });
    }
    GetWeglideTasks() {
        this.weGlideId = (document.getElementById("weglideid") as HTMLInputElement).value;

        fetch(this.weGlideApi + this.weGlideId).then((response) => {
            response.json().then((data) => {
                console.log(data);
                if(data.length > 0) {
                    localStorageSet("weGlideId", this.weGlideId);
                    this.taskoutput.instance.innerHTML = "";
                    data.forEach((t:{name: string, distance: number, ruleset: string, point_features:[]}) => {
                        let wp: Waypoint[] = [];
                        t["point_features"].forEach((p:PointFeature, i) => {
                            let obstype = "sector";
                            if(i == 0 || t.ruleset == "AA") {
                                obstype = "circle";
                            }
                            wp.push(new Waypoint(p.geometry.coordinates[1],p.geometry.coordinates[0], p.properties.elevation, obstype ,(p.properties.radius ? p.properties.radius * 1000 : 500), p.properties.name));
                        })
                        FSComponent.render(<Tasklistentry name={t["name"]} distance={t["distance"]} ruleset={t["ruleset"]} waypoints={wp} taskref={this.taskref} />, this.taskoutput.instance);
                    })
                } else {
                    this.taskoutput.instance.innerHTML = "Error: No tasks found";
                }
            });
        })
    }

}

class Tasklistentry extends DisplayComponent<Tasktemplate> {
    private name = this.props.name;
    private distance = this.props.distance;
    private ruleset = this.props.ruleset;
    private taskref = this.props.taskref;
    private entryref = FSComponent.createRef<HTMLDivElement>();   

    private task = this.props;
    constructor(props: Tasktemplate) {
        super(props);    
    }

    render(): VNode {
        return(
            <div class="tasklistentry" ref={this.entryref}>
                <div class="taskname">{this.name} ({this.ruleset})</div>
                <div class="taskdistance">{this.distance}</div>
            </div>
        )
    }

    onAfterRender(node: VNode): void {
        this.entryref.instance.addEventListener("click", () => {
            this.loadTask();
        })
    }
    loadTask() {
        document.getElementById("tasklist")?.classList.remove("active");
        this.taskref.create(this.name, this.task.waypoints);
    }
}



interface PointFeature {
    type: 'Feature';
    properties: {
      name: string;
      elevation: number;
      radius?: number;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }
  
  interface User {
    id: number;
    name: string;
  }
  
  interface BoundingBox {
    [key: number]: number;
  }
  
  interface WeglideTask {
    id: number;
    name: string;
    kind: string;
    distance: number;
    min_distance?: number;
    max_distance?: number;
    start_on_leg: boolean;
    closed: boolean;
    bbox: BoundingBox;
    stars: number;
    from_igcfile: boolean;
    user: User;
    ruleset: string;
    private: boolean;
    point_features: PointFeature[];
    locked: boolean;
    token: string;
    created: string;
    modified?: string;
    min_time?: number;
  }