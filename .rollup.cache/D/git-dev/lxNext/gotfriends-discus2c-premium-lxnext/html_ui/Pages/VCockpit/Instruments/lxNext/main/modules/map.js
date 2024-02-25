import { Map, TileLayer, LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
export class Navmap {
    constructor(instrument) {
        this.mapZoom = 12;
        this.tileserverUrl = 'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    }
    initMap() {
        SimVar.SetSimVarValue("L:LX_Knob_3", "percent", 0.5);
        let pos = this.getPosition();
        this.map = new Map('map').setView(pos, this.mapZoom);
        new TileLayer(this.tileserverUrl, {
            maxZoom: 16,
            minZoom: 6,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(this.map);
        new TileLayer('https://{s}.api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=7beacc9257a32efe75a26bcbcb222874', {
            maxZoom: 16,
            minZoom: 6,
            subdomains: ['a', 'b', 'c']
        }).addTo(this.map);
    }
    update() {
        this.mapZoom = 6 + (10 * SimVar.GetSimVarValue("L:LX_Knob_3", "percent"));
        this.update_map_center();
    }
    update_map_center() {
        this.map.setView(this.getPosition(), this.mapZoom);
    }
    getPosition() {
        let lat = parseFloat(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degrees latitude"));
        let long = parseFloat(SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degrees longitude"));
        let pos = new LatLng(lat, long);
        return pos;
    }
}
//# sourceMappingURL=map.js.map