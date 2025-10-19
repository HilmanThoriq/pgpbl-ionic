import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import * as L from 'leaflet';
import { DataService } from '../data.service';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  constructor() {
    addIcons({ add });
  }

  map!: L.Map;
  private dataService = inject(DataService);
  private navCtrl = inject(NavController);

  ngOnInit() {
    if (!this.map) {
      setTimeout(() => {
        this.map = L.map('map').setView([-7.7956, 110.3695], 13);
        var osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
          }
        );
        osm.addTo(this.map);

        const iconRetinaUrl = 'assets/icon/marker-icon.png';
        const iconUrl = 'assets/icon/marker-icon.png';
        const shadowUrl = 'assets/icon/marker-shadow.png';
        const iconDefault = L.icon({
          iconRetinaUrl,
          iconUrl,
          shadowUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41],
        });
        L.Marker.prototype.options.icon = iconDefault;

        osm.addTo(this.map);
        L.marker([-7.7956, 110.3695])
          .addTo(this.map)
          .bindPopup('yogyakarta')
          .openPopup();
      });

      this.loadPoints();
    }
  }

  async loadPoints() {
    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates
          .split(',')
          .map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(
          this.map
        );
        marker.bindPopup(`
         <div class="popup-modern" style="min-width: 250px;">
    <div class="popup-header py-3 bg-light">
      <h6 class="mb-0 fw-bold text-center">${point.name}</h6>
    </div>
    <div class="d-flex gap-2 py-2">
      <button class="btn btn-sm btn-outline-primary edit-link col-6" data-key="${key}">
        <ion-icon name="create-outline"></ion-icon>
        <span>Edit</span>
      </button>
      <button class="btn btn-sm btn-outline-danger delete-link col-6" data-key="${key}">
        <ion-icon name="trash-outline"></ion-icon>
        <span>Hapus</span>
      </button>
    </div>
  </div>
        `);
      }
    }

    this.map.on('popupopen', (e) => {
      const popup = e.popup;
      const deleteLink = popup.getElement()?.querySelector('.delete-link');
      if (deleteLink) {
        deleteLink.addEventListener('click', (event) => {
          event.preventDefault();
          const key = (deleteLink as HTMLElement).dataset['key'];
          if (key) {
            this.deletePoint(key, popup.getLatLng());
          }
        });
      }

      const editLink = popup.getElement()?.querySelector('.edit-link');
      if (editLink) {
        editLink.addEventListener('click', (event) => {
          event.preventDefault();
          const key = (editLink as HTMLElement).dataset['key'];
          if (key) {
            this.navCtrl.navigateForward(`/editpoint/${key}`);
          }
        });
      }
    });
  }

  async deletePoint(key: string, latLng: L.LatLng | undefined) {
    await this.dataService.deletePoint(key);
    if (latLng) {
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          if (layer.getLatLng().equals(latLng)) {
            this.map.removeLayer(layer);
          }
        }
      });
    }
  }
}
