import { Component, Input, OnInit } from '@angular/core';

import { Feature, FeatureCollection, Geometry, MultiPolygon } from 'geojson';
import * as L from 'leaflet';
import * as d3 from 'd3';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  private map!: L.Map;
  private amenitiesLayer: L.LayerGroup<any> = L.layerGroup();
  private healthLocationsLayer: L.LayerGroup<any> = L.layerGroup();

  
  private legend = L.control({ position: "bottomleft" });

  private _amenities: {
    name: string;
    latitude: number;
    longitude: number;
  }[] = [];

  private _healthLocations: {
    name: string;
    latitude: number;
    longitude: number;
  }[] = [];



  get amenities(): { name: string; latitude: number; longitude: number }[] {
    return this._amenities;
  }

  get healthLocations(): { name: string; latitude: number; longitude: number }[] {
    return this._healthLocations;
  }

  @Input()
  set healthLocations(
    value: { name: string; latitude: number; longitude: number }[]
  ) {
    this._healthLocations = value;
    this.updateHealthLocationsLayer();
  }

  private updateHealthLocationsLayer() {
    if (!this.map) {
      return;
    }

    // remove old amenities
    this.map.removeLayer(this.healthLocationsLayer);

    // create a marker for each supplied amenity
    const markers = this.healthLocations.map((a) =>
      L.marker([a.latitude, a.longitude]).bindPopup(a.name)
    );

    // create a new layer group and add it to the map
    this.healthLocationsLayer = L.layerGroup(markers);
    markers.forEach((m) => m.addTo(this.healthLocationsLayer));
    this.map.addLayer(this.healthLocationsLayer);
  }

  /**
   * Often divs and other HTML element are not available in the constructor. Thus we use onInit()
   */
  ngOnInit(): void {
    // some settings for a nice shadows, etc.
    const iconRetinaUrl = './assets/marker-icon-2x.png';
    const iconUrl = './assets/marker-icon.png';
    const shadowUrl = './assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [20, 40],
      iconAnchor: [20, 40],
      popupAnchor: [1, -40],
      tooltipAnchor: [16, -40],
      shadowSize: [40, 40],
    });

    L.Marker.prototype.options.icon = iconDefault;

    // basic setup, create a map in the div with the id "map"
    this.map = L.map('map').setView([21.05, 92.29], 11);

    // set a tilelayer, e.g. a world map in the background
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  /**
   * Add a marker at the specified position to the map.
   * If a name is provided, also include a popup when marker is clicked.
   * @param latitude
   * @param longitude
   * @param name
   */
  public addMarker(latitude: number, longitude: number, name?: string): void {
    const marker = L.marker([latitude, longitude]);

    if (name) {
      marker.bindPopup(name);
    }

    marker.addTo(this.map);
  }

  /**
 * Add a GeoJSON FeatureCollection to this map
 * @param latitude
 */
public addGeoJSON(geojson: FeatureCollection, adminLevel: string, unitInterest: string): void {
  // find maximum numbars value in array



  let max = d3.max(
    geojson.features.map((f: Feature<Geometry, any>) => +f.properties.numbars)
  );

  // if max is undefined, enforce max = 1
  if (!max) {
    max = 1;
  }

  const colorscale = d3
    .scaleSequential()
    .domain([0, max])
    .interpolator(d3.interpolateViridis);

  console.log(colorscale);
  

 

  this.legend.onAdd = function(map: any) {
    this.map = map;
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += "<h4>Tegnforklaring</h4>";
    div.innerHTML += '<i style="background: #477AC2"></i><span>Water</span><br>';
    div.innerHTML += '<i style="background: #448D40"></i><span>Forest</span><br>';
    div.innerHTML += '<i style="background: #E6E696"></i><span>Land</span><br>';
    div.innerHTML += '<i style="background: #E8E6E0"></i><span>Residential</span><br>';
    div.innerHTML += '<i style="background: #FFFFFF"></i><span>Ice</span><br>';
    div.innerHTML += '<i class="icon" style="background-image: url(https://d30y9cdsu7xlg0.cloudfront.net/png/194515-200.png);background-repeat: no-repeat;"></i><span>Grænse</span><br>';
    
    
  
    return div;
  };
  
  this.legend.addTo(this.map);

    //console.log(this.map)


  // each feature has a custom style
  const style = (feature: Feature<Geometry, any> | undefined) => {
    const numbars = feature?.properties?.numbars
      ? feature.properties.numbars
      : 0;

    return {
      fillColor: colorscale(numbars),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.9,
    };
  };


  // each feature gets an additional popup!
  const onEachFeature = (feature: Feature<Geometry, any>, layer: L.Layer) => {
    if (
      feature.properties &&
      feature.properties.name &&
      typeof feature.properties.numbars !== 'undefined'
    ) {
      layer.bindPopup(
        `${adminLevel} ${feature.properties.name} has ${feature.properties.numbars} ${unitInterest}`
      );
    }
  };

  // create one geoJSON layer and add it to the map
  const geoJSON = L.geoJSON(geojson, {
    onEachFeature,
    style
  });
  geoJSON.addTo(this.map);
}
}
