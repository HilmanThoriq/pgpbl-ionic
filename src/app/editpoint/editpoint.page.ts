import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';

const iconRetinaUrl = 'assets/icon/marker-icon-2x.png';
const iconUrl = 'assets/icon/marker-icon.png';
const shadowUrl = 'assets/icon/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-editpoint',
  templateUrl: './editpoint.page.html',
  styleUrls: ['./editpoint.page.scss'],
  standalone: false,
})
export class EditpointPage implements OnInit {
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);

  map!: L.Map;
  point: any;
  name = '';
  coordinates = '';
  pointId = '';

  constructor() {}

  ngOnInit() {
    this.pointId = this.route.snapshot.paramMap.get('id')!;
    this.dataService.getPoint(this.pointId).then((point) => {
      this.point = point;
      this.name = this.point.name;
      this.coordinates = this.point.coordinates;
      this.setupMap();
    });
  }

  setupMap() {
    setTimeout(() => {
      const coords = this.coordinates.split(',').map(c => parseFloat(c));
      this.map = L.map('mapedit').setView(coords as L.LatLngExpression, 13);

      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });

      var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'ESRI',
      });

      osm.addTo(this.map);

      var baseMaps = {
        OpenStreetMap: osm,
        'Esri World Imagery': esri,
      };

      L.control.layers(baseMaps).addTo(this.map);

      var marker = L.marker(coords as L.LatLngExpression, { draggable: true });
      marker.addTo(this.map);

      marker.on('dragend', (e) => {
        let latlng = e.target.getLatLng();
        this.coordinates = `${latlng.lat},${latlng.lng}`;
      });
    });
  }

  async update() {
    if (this.name && this.coordinates) {
      try {
        await this.dataService.updatePoint(this.pointId, {
          name: this.name,
          coordinates: this.coordinates,
        });
        this.navCtrl.navigateBack('/tabs/maps');
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Update Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }
}