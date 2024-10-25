import {  EventBus } from "@microsoft/msfs-sdk";
import { GridStack } from 'gridstack';
import { vars, staticvars } from '../vars';

import L from "leaflet";

import 'leaflet/dist/leaflet.css';


interface Mapprops {
    bus: EventBus
    grid: GridStack
    root: HTMLElement
}

export class Mapcontainer {
    private root: HTMLElement;
    public map: any;
    private glidericon: any;
    public isvisible: boolean = false;

    private lastupdate: {
        lat: number,
        long: number
    }

    private trail: Trail | null;
    private climbtrail: Trail | null;
    private numlines: number = 0;

    constructor(props: Mapprops) {
        this.root = props.root;
        this.trail = null;
        this.climbtrail = null;
        this.lastupdate = { lat: 0, long: 0 };
    }

    initMap() {

        this.map = new L.Map('map', {
            center: new L.LatLng(0, 0),
            zoom: 12,
        });

        L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
            subdomains:['mt0','mt1','mt2','mt3']
        }).addTo(this.map);

        L.tileLayer('https://api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=7beacc9257a32efe75a26bcbcb222874', {
            maxZoom: 16
        }).addTo(this.map);

        const icon = L.divIcon({
            html: '<div id="ownship"><div id="ac_hdg"></div><div id="ac_trk"></div><svg id="symbol" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M247.989 307.923l.88.88-118.47 118.42c-22.74 22.79-76.09 54.47-76.09 54.47a17.21 17.21 0 0 1-22.18-26.16l181.72-181.71zm231.86-275.77a17.21 17.21 0 0 0-24.33 0l-181.72 181.72 34.1 34.1.88.88 118.42-118.43c22.74-22.74 54.47-76.09 54.47-76.09a17.21 17.21 0 0 0-1.82-22.18zm-52.44 319.24a32.78 32.78 0 0 0-23.25 9.62l-43.17 43.17a32.89 32.89 0 0 0 0 46.51l6 6 89.69-89.68-6-6a32.78 32.78 0 0 0-23.27-9.62zm-46.8 10.55l-18.69 18.69c-40.87-40.64-64.22-62-102.66-84l-39.27-39.32c-64-64-65.14-86.41-57.12-94.44 1.91-1.91 4.76-3.29 9-3.29 12.64 0 37.47 12.43 85.46 60.41l39.29 39.29c21.95 38.47 43.37 61.8 83.99 102.66zm-156.89-162.82c-34.3-29.84-49.85-33.11-53.79-29.17-2.7 2.7-1.91 8.38 2.33 16.9 4.91 9.84 13.88 22.21 26.79 36.94z"/></svg></div>',
            className: 'glidericon',
            iconSize: [64, 64],
            iconAnchor: [32,32]
        });

        this.glidericon = L.marker([0, 0], {
            icon: icon
        }).addTo(this.map);

    }

    public update() {
        let lat = staticvars.planelat as number; // vars.find((v) => v.name == "planelat")?.value as number;
        let long = staticvars.planelong as number; //vars.find((v) => v.name == "planelong")?.value as number;
        let hdg = staticvars.heading as number; //vars.find((v) => v.name == "heading")?.value as number;
        let grdtrk = staticvars.groundtrack as number; //vars.find((v) => v.name == "groundtrack")?.value as number;
        let te = staticvars.totalenergy as number; //vars.find((v) => v.name == "totalenergy")?.value as number;

        if(this.isvisible) {
            this.map.setView([lat, long]);
            this.glidericon.setLatLng([lat, long]);
            document.getElementById("ownship")!.style.transform = "rotate(" + hdg + "deg)";
            document.getElementById("ac_trk")!.style.transform = "rotate(" + (grdtrk - hdg) + "deg)";
        }
             

        if(!this.trail) {
            this.trail = new Trail(this.map, [lat, long], "#e3b146", {strokeWidth: 8});
        } else if(lat != this.lastupdate.lat || long != this.lastupdate.long && this.lastupdate.lat != 0 && this.lastupdate.long != 0) {
            this.trail.add(lat, long);
        }

        if(te > 0 || te < -1) {
            let color = te > 0 ? "#14852c" : "#cc0000";
            if(!this.climbtrail) {
                this.climbtrail = new Trail(this.map, [lat, long], color, {strokeWidth: 8});
                this.numlines++;
                if(document.querySelectorAll(".climb-trail").length > 20) {
                    document.querySelector(".climb-trail")?.remove();
                    this.numlines--;
                }
            } else if(lat != this.lastupdate.lat || long != this.lastupdate.long && this.lastupdate.lat != 0 && this.lastupdate.long != 0) {
                this.climbtrail.add(lat, long, "climb-trail");
            }
        } else {
            this.climbtrail = null;
        }

        this.lastupdate.lat = lat;
        this.lastupdate.long = long;
    }
    public checker() {
        this.map.invalidateSize()
    }

    public zoomIn() {
        this.map.zoomIn();
    }

    public zoomOut() {
        this.map.zoomOut();
    }

    public render(): void {
        const mapcontainer = document.createElement('div');
        const mapelement = document.createElement('div');
        mapelement.id = "map";
        mapelement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        mapcontainer.appendChild(mapelement);
        mapcontainer.classList.add('mapcontainer');
        
        this.root.appendChild(mapcontainer);
    }
}


export class Trail {
    private coords: [number, number][];
    private map: {};
    private color: string;
    private opts: any;
    private line: any;

    constructor(map: {}, pair: [number, number], color: string, opts = {}) {
      this.coords = [];
      this.map = map;
      if (pair) this.add(...pair);
      this.color = color ?? `blue`;
      this.opts = opts;
      this.line = undefined;
    }

    add(lat: number, long: number, trailtype:string = 'flight-trail') {
      if (!lat && !long) return;
      
  
      const { coords } = this;
      const pair = [lat, long];
      coords.push(pair  as [number, number]);

      if(coords.length > 3000) { coords.pop(); }
  
      const l = coords.length;
      if (l < 2) return;
  
      if (l === 2) {
        this.line = L.polyline([...coords], {
          className: trailtype,
          color: this.color,
          strokeWidth: 8,
          ...this.opts,
        });

        return this.line.addTo(this.map);
      }

      this.line.addLatLng(pair);
    }
  }