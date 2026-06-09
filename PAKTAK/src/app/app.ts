import { Component, signal, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { SqliteService } from './sqlite.service';

const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy, AfterViewInit {
  constructor(private sqlite: SqliteService) {}

  public isAuthenticated = signal(false);
  public authScreen = signal<'SPLASH' | 'LOGIN' | 'REGISTER'>('SPLASH');
  public currentUser = signal<any>(null);
  
  public regUsername = '';
  public regPassword = '';
  public regClearance = 'LEVEL-1 OPERATOR';
  
  public loginUsername = '';
  public loginPassword = '';
  
  public authError = signal<string>('');
  public authSuccess = signal<string>('');
  public isLoading = signal(true);
  public currentTime = signal('');
  public currentMode = signal('SATELLITE');
  public signalStrength = signal(92);
  public batteryLevel = signal(85);
  public gpsStatus = signal('SEARCHING...');
  
  public map!: L.Map;
  public currentTileLayer?: L.TileLayer;
  public currentLabelLayer?: L.TileLayer;
  public startMarker?: L.Marker;
  public endMarker?: L.Marker;
  public routes: L.Polyline[] = [];
  public waterObstaclesShapes: L.LayerGroup = L.layerGroup();
  public forestShapes: L.LayerGroup = L.layerGroup();
  public waypointsLayer: L.LayerGroup = L.layerGroup();
  public offlineSyncLayer: L.LayerGroup = L.layerGroup();

  public currentLat = signal('WAITING');
  public currentLatNum = 0;
  public currentLng = signal('WAITING');
  public currentLngNum = 0;
  public targetLat = signal('--');
  public targetLng = signal('--');
  
  public systemStatusMsg = signal('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE');
  public waypointsVisible = false;
  public interactionMode = signal<'START' | 'HIT' | 'WAYPOINT'>('HIT');
  public routeOptions = signal<any[]>([]);
  public selectedRouteIndex = signal<number>(0);
  public waypoints = signal<Array<{ id: string; name: string; lat: number; lng: number; marker?: L.Marker<any> }>>([]);
  public sunTimes = signal({ sunrise: '--:--', sunset: '--:--', date: 'TODAY' });
  public journeyActive = signal(false);
  public journeyMarker?: L.Marker;
  public journeyPath?: L.Polyline;
  public selectedRouteCoordinates: L.LatLng[] = [];
  public hasOfflineMap = signal(false);

  public bearingValue = signal<string>('--');
  public directDistanceValue = signal<string>('--');

  public hasStartAndEnd(): boolean {
    return !!this.startMarker && !!this.endMarker;
  }

  public missionBriefing = {
    codeName: 'OP-DESERT-FOX',
    status: 'ACTIVE',
    objectives: [
      'Neutralize target ALPHA',
      'Secure extraction point ZULU',
      'Maintain radio silence'
    ]
  };

  public terrainAnalysis = signal({
    forestDensity: 'Scanning...',
    elevationGain: '--',
    waterObstacles: '--'
  });

  private timeInterval: any;
  private simulationInterval: any;
  private watchId?: number;
  private journeyWatchId?: number;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    
    // Restore custom mission code name from local storage if present
    const savedCode = localStorage.getItem('paktak_mission_code');
    if (savedCode) {
      this.missionBriefing.codeName = savedCode;
    }
    this.hasOfflineMap.set(!!localStorage.getItem('paktak_offline_cache'));

    // Splash screen timer
    setTimeout(() => {
      this.isLoading.set(false);
    }, 3500);
  }

  saveMissionCodeName() {
    localStorage.setItem('paktak_mission_code', this.missionBriefing.codeName);
    
    // Update active offline sync cache if it exists
    const cached = localStorage.getItem('paktak_offline_cache');
    if (cached) {
      try {
        const offlineData = JSON.parse(cached);
        offlineData.missionBriefing = this.missionBriefing;
        localStorage.setItem('paktak_offline_cache', JSON.stringify(offlineData));
      } catch (e) {
        console.warn(e);
      }
    }
  }

  ngAfterViewInit() {
    // Map initialization is delayed until user is authenticated
  }

  initiateSystemAccess() {
    this.authScreen.set('REGISTER');
    this.authError.set('');
    this.authSuccess.set('');
  }

  switchToLogin() {
    this.authScreen.set('LOGIN');
    this.authError.set('');
    this.authSuccess.set('');
  }

  switchToRegister() {
    this.authScreen.set('REGISTER');
    this.authError.set('');
    this.authSuccess.set('');
  }

  registerUser() {
    if (!this.regUsername.trim() || !this.regPassword.trim()) {
      this.authError.set('SQLITE_ERROR: Callsign and Access Code cannot be empty.');
      return;
    }
    try {
      this.sqlite.runSql('INSERT INTO users (username, password, clearance) VALUES (?, ?, ?)', [
        this.regUsername.trim(), this.regPassword, this.regClearance
      ]);
      this.authSuccess.set('REGISTRATION SUCCESSFUL. REDIRECTING TO ACCESS TERMINAL...');
      this.authError.set('');
      setTimeout(() => {
        this.switchToLogin();
      }, 2000);
    } catch (e: any) {
      if (e.message?.includes('UNIQUE constraint failed: users.username')) {
        this.authError.set('SQLITE_CONSTRAINT: Callsign already exists. Use ACCESS ACCOUNT to login.');
      } else {
        this.authError.set(e.message || 'Registration failed');
      }
    }
  }

  loginUser() {
    if (!this.loginUsername.trim() || !this.loginPassword.trim()) {
      this.authError.set('SQLITE_ERROR: Callsign and Access Code cannot be empty.');
      return;
    }
    try {
      const rows = this.sqlite.runSql('SELECT * FROM users WHERE username = ? AND password = ?', [
        this.loginUsername.trim(), this.loginPassword
      ]);
      if (rows && rows.length > 0) {
        const user = rows[0];
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.authError.set('');
        this.systemStatusMsg.set(`TACTICAL UPLINK SECURED: WELCOME OPERATIVE ${user.username.toUpperCase()} (${user.clearance})`);
        
        // Let the DOM render then initialize Leaflet
        setTimeout(() => {
          this.initMap();
          this.locateUser();
        }, 150);
      } else {
        this.authError.set('SQLITE_AUTH_ERROR: Invalid Callsign or Encryption Key.');
      }
    } catch (e: any) {
      this.authError.set(e.message || 'Login failed');
    }
  }

  logoutUser() {
    this.isAuthenticated.set(false);
    this.authScreen.set('SPLASH');
    this.currentUser.set(null);
    this.loginUsername = '';
    this.loginPassword = '';
    this.regUsername = '';
    this.regPassword = '';
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.watchId !== undefined) navigator.geolocation.clearWatch(this.watchId);
    if (this.map) this.map.remove();
  }

  updateTime() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour12: false }));
  }

  setMode(mode: string) {
    this.currentMode.set(mode);
    if (this.map) {
      if (this.currentTileLayer) {
        this.map.removeLayer(this.currentTileLayer);
      }
      if (this.currentLabelLayer) {
        this.map.removeLayer(this.currentLabelLayer);
        this.currentLabelLayer = undefined;
      }
      
      if (mode === 'SATELLITE') {
        this.currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 18
        }).addTo(this.map);

        // Add transparent boundaries & place name labels overlay
        this.currentLabelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Labels &copy; Esri',
          maxZoom: 18
        }).addTo(this.map);
      } else if (mode === 'NIGHT') {
        this.currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 18
        }).addTo(this.map);
      } else {
        // TOPO
        this.currentTileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
          maxZoom: 17
        }).addTo(this.map);
      }
    }
  }

  initMap() {
    this.map = L.map('tactical-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([33.6844, 73.0479], 13); // Default location (Islamabad)

    // Initial layer
    this.setMode('SATELLITE');

    this.waterObstaclesShapes.addTo(this.map);
    this.forestShapes.addTo(this.map);
    this.offlineSyncLayer.addTo(this.map);

    // Map click event to set start, endpoint, or waypoints based on active mode
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.interactionMode() === 'START') {
        this.setStartpoint(e.latlng);
      } else if (this.interactionMode() === 'WAYPOINT') {
        this.addWaypoint(e.latlng);
      } else {
        this.setEndpoint(e.latlng);
      }
    });

    // Check if offline cached mission data exists
    const cached = localStorage.getItem('paktak_offline_cache');
    if (cached) {
      try {
        const offlineData = JSON.parse(cached);
        if (offlineData.startPoint && offlineData.hitPoint) {
          this.systemStatusMsg.set('LOADED RESTORED SECURE MISSION PROFILE FROM OFFLINE CACHE.');
          
          // Clear any current markers
          if (this.startMarker) this.map.removeLayer(this.startMarker);
          if (this.endMarker) this.map.removeLayer(this.endMarker);

          // Clear current routes
          this.routes.forEach(r => this.map.removeLayer(r));
          this.routes = [];

          // Render Start Marker
          this.startMarker = L.marker([offlineData.startPoint.lat, offlineData.startPoint.lng], {
            icon: startIcon,
            draggable: true
          }).addTo(this.map).bindPopup('START POINT (OFFLINE RESTORED)');
          this.startMarker.on('dragend', () => this.updateRoute());

          // Render End Marker
          this.endMarker = L.marker([offlineData.hitPoint.lat, offlineData.hitPoint.lng], {
            icon: endIcon,
            draggable: true
          }).addTo(this.map).bindPopup('TARGET POINT (OFFLINE RESTORED)');
          this.endMarker.on('dragend', () => this.updateRoute());

          // Set lat/lng labels
          this.currentLat.set(offlineData.startPoint.lat.toFixed(4) + '° N');
          this.currentLng.set(offlineData.startPoint.lng.toFixed(4) + '° E');
          this.targetLat.set(offlineData.hitPoint.lat.toFixed(4) + '° N');
          this.targetLng.set(offlineData.hitPoint.lng.toFixed(4) + '° E');

          this.updateBearingAndDistance();

          // Restore routes if present
          if (offlineData.routes && offlineData.routes.length > 0) {
            offlineData.routes.forEach((route: any) => {
              const polyline = L.polyline(route.coords, {
                color: route.color,
                weight: route.weight,
                opacity: route.opacity,
                dashArray: route.dashArray
              });
              if (route.tooltipText) {
                polyline.bindTooltip(route.tooltipText, { permanent: false, sticky: true });
              }
              polyline.addTo(this.map);
              this.routes.push(polyline);
            });
          }

          if (offlineData.waypoints && Array.isArray(offlineData.waypoints)) {
            offlineData.waypoints.forEach((wp: any) => this.restoreWaypoint(wp));
            this.waypointsVisible = true;
            this.redrawWaypoints();
          }
          if (offlineData.routeOptions) {
            this.routeOptions.set(offlineData.routeOptions);
          }
          if (offlineData.selectedRouteIndex !== undefined) {
            this.selectedRouteIndex.set(offlineData.selectedRouteIndex);
          }
          if (offlineData.terrainAnalysis) {
            this.terrainAnalysis.set(offlineData.terrainAnalysis);
          }
          if (offlineData.missionBriefing) {
            this.missionBriefing = offlineData.missionBriefing;
          }

          this.offlineSyncLayer.clearLayers();
          const offlineBounds = offlineData.offlineBounds
            ? L.latLngBounds(
                [offlineData.offlineBounds.southWest.lat, offlineData.offlineBounds.southWest.lng],
                [offlineData.offlineBounds.northEast.lat, offlineData.offlineBounds.northEast.lng]
              )
            : this.buildOfflineBounds();
          L.rectangle(offlineBounds, {
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.12,
            dashArray: '0'
          }).addTo(this.offlineSyncLayer).bindPopup('<b>Offline Area Cached</b><br>Start, target and waypoints restored.');

          // Center view on restored coordinates
          const groupLayers: L.Layer[] = [this.startMarker, this.endMarker, ...this.waypointsLayer.getLayers(), ...this.routes];
          const group = new L.FeatureGroup(groupLayers);
          setTimeout(() => {
            this.map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 16 });
          }, 100);
        }
      } catch (err) {
        console.warn('Failed to restore cached offline data:', err);
      }
    }
  }

  locateUser() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.updateCurrentPosition(lat, lng, true);

          const latlng = new L.LatLng(lat, lng);
          this.map.setView(latlng, 15);

          if (this.startMarker) {
            this.startMarker.setLatLng(latlng);
          } else {
            this.startMarker = L.marker(latlng, { icon: startIcon }).addTo(this.map).bindPopup('START POINT').openPopup();
          }
          this.updateRoute();
        },
        (error) => {
          console.error("Geolocation error:", error);
          this.gpsStatus.set('ERROR');
        },
        { enableHighAccuracy: true }
      );
      
      // Watch position for continuous updates
      this.watchId = navigator.geolocation.watchPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.updateCurrentPosition(lat, lng, true);
          const latlng = new L.LatLng(lat, lng);
          if (this.startMarker) {
            this.startMarker.setLatLng(latlng);
            this.updateRoute();
          }
          if (this.journeyActive()) {
            this.updateJourneyPointer(latlng);
          }
      }, (error) => {
        console.error("Geolocation watch error:", error);
        this.gpsStatus.set('ERROR');
      }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
    } else {
      this.gpsStatus.set('UNAVAILABLE');
    }
  }

  updateCurrentPosition(lat: number, lng: number, locked: boolean) {
    if (locked) {
      this.gpsStatus.set('LOCKED');
    }
    this.currentLatNum = lat;
    this.currentLngNum = lng;
    this.currentLat.set(lat.toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S'));
    this.currentLng.set(lng.toFixed(4) + '° ' + (lng >= 0 ? 'E' : 'W'));
    this.computeSunTimes(lat, lng);
  }

  selectRouteOption(idx: number) {
    this.selectedRouteIndex.set(idx);
    this.routes.forEach((polyline, index) => {
      if (index === idx) {
        polyline.setStyle({ weight: 6, opacity: 0.95 });
        polyline.bringToFront();
      } else {
        polyline.setStyle({ weight: 3, opacity: 0.35 });
      }
    });
    this.updateSelectedRouteCoordinates();
    this.systemStatusMsg.set(`TACTICAL PATH MODIFIED: SELECTED OPTION ${String.fromCharCode(65 + idx)}`);
  }

  setInteractionMode(mode: 'START' | 'HIT' | 'WAYPOINT') {
    this.interactionMode.set(mode);
    const modeLabel = mode === 'START' ? 'START POINT' : mode === 'HIT' ? 'TARGET POINT' : 'WAYPOINT';
    this.systemStatusMsg.set(`INTERACTION MODE CHANGED: SET ${modeLabel}`);
    if (mode === 'WAYPOINT') {
      this.waypointsVisible = true;
      this.redrawWaypoints();
    }
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  addWaypoint(latlng: L.LatLng) {
    const waypointNumber = this.waypoints().length + 1;
    const waypoint = {
      id: `WP-${waypointNumber.toString().padStart(2, '0')}`,
      name: `Waypoint ${waypointNumber}`,
      lat: latlng.lat,
      lng: latlng.lng,
      marker: undefined
    };

    this.waypoints.update(list => [...list, waypoint]);
    this.createWaypointMarker(waypoint);
    this.waypointsVisible = true;
    this.redrawWaypoints();
    this.systemStatusMsg.set(`WAYPOINT ${waypoint.id} ADDED`);
    this.updateRoute();
  }

  removeWaypoint(index: number) {
    const waypoint = this.waypoints()[index];
    if (!waypoint) return;
    if (waypoint.marker) {
      this.waypointsLayer.removeLayer(waypoint.marker);
    }
    const newWaypoints = this.waypoints().filter((_, idx) => idx !== index).map((wp, idx) => {
      const updated = { ...wp, id: `WP-${(idx + 1).toString().padStart(2, '0')}`, name: `Waypoint ${idx + 1}` };
      if (updated.marker) {
        updated.marker.bindTooltip(`${updated.id}`, { permanent: true, direction: 'top' });
      }
      return updated;
    });
    this.waypoints.set(newWaypoints);
    this.redrawWaypoints();
    this.systemStatusMsg.set(`WAYPOINT ${waypoint.id} REMOVED`);
    this.updateRoute();
  }

  createWaypointMarker(waypoint: { id: string; name: string; lat: number; lng: number; marker?: L.Marker<any> }) {
    if (!this.map) return;
    const marker = L.marker([waypoint.lat, waypoint.lng], {
      draggable: true
    }).bindTooltip(`${waypoint.id}`, { permanent: true, direction: 'top' }).addTo(this.waypointsLayer);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      waypoint.lat = pos.lat;
      waypoint.lng = pos.lng;
      this.systemStatusMsg.set(`${waypoint.id} MOVED TO ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
      this.updateRoute();
    });
    waypoint.marker = marker;
  }

  restoreWaypoint(waypointData: any) {
    const waypoint = {
      id: waypointData.id || `WP-${(this.waypoints().length + 1).toString().padStart(2, '0')}`,
      name: waypointData.name || `Waypoint ${this.waypoints().length + 1}`,
      lat: waypointData.lat,
      lng: waypointData.lng,
      marker: undefined
    };
    this.waypoints.update(list => [...list, waypoint]);
    this.createWaypointMarker(waypoint);
  }

  getDistanceFromStart(lat: number, lng: number): string {
    if (this.startMarker) {
      const start = this.startMarker.getLatLng();
      const wpLatLng = L.latLng(lat, lng);
      const distanceMeters = start.distanceTo(wpLatLng);
      const distanceKm = distanceMeters / 1000;
      return `${distanceKm.toFixed(2)} km`;
    }
    return '--';
  }

  redrawWaypoints() {
    this.waypointsLayer.clearLayers();
    if (!this.waypointsVisible) {
      return;
    }
    this.waypoints().forEach((waypoint) => {
      if (waypoint.marker) {
        waypoint.marker.addTo(this.waypointsLayer);
      } else {
        this.createWaypointMarker(waypoint);
      }
    });
    if (this.waypointsLayer.getLayers().length > 0) {
      this.waypointsLayer.addTo(this.map);
    }
  }

  buildOfflineBounds() {
    if (!this.startMarker || !this.endMarker) {
      return L.latLngBounds([0, 0], [0, 0]);
    }
    const points: L.LatLngExpression[] = [
      this.startMarker.getLatLng(),
      this.endMarker.getLatLng(),
      ...this.waypoints().map(wp => [wp.lat, wp.lng] as L.LatLngExpression)
    ];
    return L.latLngBounds(points).pad(0.2);
  }

  getRoutePointList(start: L.LatLng, end: L.LatLng) {
    const points = [start];
    this.waypoints().forEach((waypoint) => {
      points.push(new L.LatLng(waypoint.lat, waypoint.lng));
    });
    points.push(end);
    return points;
  }

  buildOsrmWaypoints(start: L.LatLng, end: L.LatLng) {
    return this.getRoutePointList(start, end)
      .map(point => `${point.lng},${point.lat}`)
      .join(';');
  }

  computeFlankPoint(start: L.LatLng, end: L.LatLng, factor: number, left: boolean) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const perpX = -lngDiff;
    const perpY = latDiff;
    const length = Math.sqrt(perpX * perpX + perpY * perpY);
    if (length === 0) {
      return new L.LatLng((start.lat + end.lat) / 2, (start.lng + end.lng) / 2);
    }
    const normX = perpX / length;
    const normY = perpY / length;
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    const offset = factor * Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const direction = left ? 1 : -1;
    return new L.LatLng(midLat + normY * offset * direction, midLng + normX * offset * direction);
  }

  flattenLatLngs(latlngs: any): L.LatLng[] {
    if (!latlngs) return [];
    if (latlngs instanceof L.LatLng) return [latlngs];
    if (Array.isArray(latlngs)) {
      if (latlngs.length === 0) return [];
      if (latlngs[0] instanceof L.LatLng) {
        return latlngs as L.LatLng[];
      }
      return latlngs.reduce((acc, val) => acc.concat(this.flattenLatLngs(val)), []);
    }
    return [];
  }

  updateSelectedRouteCoordinates() {
    const selectedIndex = this.selectedRouteIndex();
    const selectedRoute = this.routes[selectedIndex];
    if (selectedRoute) {
      this.selectedRouteCoordinates = this.flattenLatLngs(selectedRoute.getLatLngs());
    } else {
      this.selectedRouteCoordinates = [];
    }
  }

  getRotationAngle(start: L.LatLng, end: L.LatLng): number {
    const lat1 = start.lat * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    const lon1 = start.lng * Math.PI / 180;
    const lon2 = end.lng * Math.PI / 180;
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  }

  startJourney() {
    if (this.journeyActive()) {
      return;
    }

    if (!navigator.geolocation) {
      this.systemStatusMsg.set('ERROR: GPS UNAVAILABLE. REAL-TIME NAVIGATION CANNOT START.');
      return;
    }

    this.journeyActive.set(true);
    this.systemStatusMsg.set('TACTICAL REAL-TIME NAVIGATION ACTIVE: MONITORING PHYSICAL MOVEMENT...');

    let lastLatLng: L.LatLng | undefined = undefined;
    if (this.currentLatNum && this.currentLngNum && this.currentLatNum !== 0) {
      lastLatLng = new L.LatLng(this.currentLatNum, this.currentLngNum);
      this.updateJourneyPointer(lastLatLng);
    }

    this.journeyWatchId = navigator.geolocation.watchPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const latlng = new L.LatLng(lat, lng);
      
      this.updateCurrentPosition(lat, lng, true);

      // Rotate pointer based on real movement heading
      this.updateJourneyPointer(latlng, lastLatLng);
      
      // Update starting point to user current location in real-time
      if (this.startMarker) {
        this.startMarker.setLatLng(latlng);
        this.updateRoute();
      }

      lastLatLng = latlng;
    }, (error) => {
      console.error("Journey geolocation error:", error);
      this.gpsStatus.set('ERROR');
      this.systemStatusMsg.set('ERROR: LIVE GPS NAVIGATION UPLINK FAILED');
      this.stopJourney();
    }, { 
      enableHighAccuracy: true, 
      maximumAge: 1000, 
      timeout: 15000 
    });
  }

  updateJourneyPointer(latlng: L.LatLng, lastLatlng?: L.LatLng) {
    if (!this.map) {
      return;
    }

    let angle = 0;
    if (lastLatlng) {
      angle = this.getRotationAngle(lastLatlng, latlng);
    }

    const journeyIcon = L.divIcon({
      className: 'tactical-journey-pointer-container',
      html: `<div class="pulsing-pointer"><div class="pointer-arrow" style="transform: rotate(${angle}deg)">▲</div><div class="pulse-ring"></div></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    if (!this.journeyMarker) {
      this.journeyMarker = L.marker(latlng, { icon: journeyIcon }).addTo(this.map).bindPopup('TACTICAL JOURNEY VECTOR').openPopup();
    } else {
      this.journeyMarker.setLatLng(latlng);
      this.journeyMarker.setIcon(journeyIcon);
    }

    if (!this.journeyPath) {
      this.journeyPath = L.polyline([latlng], {
        color: '#ffd700',
        weight: 4,
        opacity: 0.95
      }).addTo(this.map);
    } else {
      const path = this.journeyPath.getLatLngs() as L.LatLng[];
      const last = path[path.length - 1];
      if (!last || last.distanceTo(latlng) >= 1) {
        path.push(latlng);
        this.journeyPath.setLatLngs(path);
      }
    }
    this.map.panTo(latlng, { animate: true, duration: 0.3 });
  }

  stopJourney() {
    if (this.journeyWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.journeyWatchId);
      this.journeyWatchId = undefined;
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
    this.journeyActive.set(false);
    if (this.journeyMarker) {
      this.map.removeLayer(this.journeyMarker);
      this.journeyMarker = undefined;
    }
    if (this.journeyPath) {
      this.map.removeLayer(this.journeyPath);
      this.journeyPath = undefined;
    }
    this.systemStatusMsg.set('JOURNEY STOPPED');
  }

  computeSunTimes(lat: number, lng: number) {
    const date = new Date();
    const rad = Math.PI / 180;
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    const n1 = Math.floor(275 * month / 9);
    const n2 = Math.floor((month + 9) / 12);
    const n3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3));
    const N = n1 - (n2 * n3) + day - 30;
    const lngHour = lng / 15;

    const tRise = N + ((6 - lngHour) / 24);
    const tSet = N + ((18 - lngHour) / 24);

    const M_rise = (0.9856 * tRise) - 3.289;
    const M_set = (0.9856 * tSet) - 3.289;

    const L_rise = (M_rise + (1.916 * Math.sin(rad * M_rise)) + (0.020 * Math.sin(rad * 2 * M_rise)) + 282.634) % 360;
    const L_set = (M_set + (1.916 * Math.sin(rad * M_set)) + (0.020 * Math.sin(rad * 2 * M_set)) + 282.634) % 360;

    const RA_rise = Math.atan(0.91764 * Math.tan(rad * L_rise)) / rad;
    const RA_set = Math.atan(0.91764 * Math.tan(rad * L_set)) / rad;

    const Lquadrant_rise = Math.floor(L_rise / 90) * 90;
    const RAquadrant_rise = Math.floor(RA_rise / 90) * 90;
    const RA_rise_corrected = (RA_rise + (Lquadrant_rise - RAquadrant_rise)) / 15;
    const Lquadrant_set = Math.floor(L_set / 90) * 90;
    const RAquadrant_set = Math.floor(RA_set / 90) * 90;
    const RA_set_corrected = (RA_set + (Lquadrant_set - RAquadrant_set)) / 15;

    const sinDec_rise = 0.39782 * Math.sin(rad * L_rise);
    const cosDec_rise = Math.cos(Math.asin(sinDec_rise));
    const sinDec_set = 0.39782 * Math.sin(rad * L_set);
    const cosDec_set = Math.cos(Math.asin(sinDec_set));

    const cosH_rise = (Math.cos(rad * 90.833) - (sinDec_rise * Math.sin(rad * lat))) / (cosDec_rise * Math.cos(rad * lat));
    const cosH_set = (Math.cos(rad * 90.833) - (sinDec_set * Math.sin(rad * lat))) / (cosDec_set * Math.cos(rad * lat));

    const H_rise = 360 - (Math.acos(cosH_rise) / rad);
    const H_set = (Math.acos(cosH_set) / rad);

    const T_rise = H_rise / 15 + RA_rise_corrected - (0.06571 * tRise) - 6.622;
    const T_set = H_set / 15 + RA_set_corrected - (0.06571 * tSet) - 6.622;

    let UT_rise = (T_rise - lngHour) % 24;
    let UT_set = (T_set - lngHour) % 24;
    if (UT_rise < 0) UT_rise += 24;
    if (UT_set < 0) UT_set += 24;

    const hrRise = Math.floor(UT_rise);
    const minRise = Math.floor((UT_rise - hrRise) * 60);
    const hrSet = Math.floor(UT_set);
    const minSet = Math.floor((UT_set - hrSet) * 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timezoneOffset = Math.round(lng / 15);
    const toLocalTime = (utcHour: number, utcMinute: number) => {
      let totalMinutes = utcHour * 60 + utcMinute + timezoneOffset * 60;
      totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return `${pad(hour)}:${pad(minute)}`;
    };

    this.sunTimes.set({
      sunrise: toLocalTime(hrRise, minRise),
      sunset: toLocalTime(hrSet, minSet),
      date: date.toLocaleDateString()
    });
  }

  setStartpoint(latlng: L.LatLng) {
    this.currentLatNum = latlng.lat;
    this.currentLngNum = latlng.lng;
    this.currentLat.set(latlng.lat.toFixed(4) + '° ' + (latlng.lat >= 0 ? 'N' : 'S'));
    this.currentLng.set(latlng.lng.toFixed(4) + '° ' + (latlng.lng >= 0 ? 'E' : 'W'));
    this.gpsStatus.set('MANUAL LOCK');
    this.computeSunTimes(latlng.lat, latlng.lng);

    const popupContent = `
      <div style="font-family: monospace;">
        <b style="color: #9acd32">START POSITION LOCKED</b><br>
        <hr style="border-color: #333; margin: 4px 0;">
        <b>LAT:</b> ${latlng.lat.toFixed(4)}<br>
        <b>LNG:</b> ${latlng.lng.toFixed(4)}
      </div>
    `;

    if (this.startMarker) {
      this.startMarker.setLatLng(latlng).setPopupContent(popupContent).openPopup();
    } else {
      this.startMarker = L.marker(latlng, { icon: startIcon }).addTo(this.map).bindPopup(popupContent).openPopup();
    }
    this.updateRoute();
  }

  searchLocation(query: string) {
    if (!query) return;
    this.systemStatusMsg.set('CONNECTING TO GEOLOCATION DATA SERVICE...');
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const firstResult = data[0];
          const lat = parseFloat(firstResult.lat);
          const lng = parseFloat(firstResult.lon);
          const latlng = new L.LatLng(lat, lng);
          
          this.map.setView(latlng, 14);
          this.systemStatusMsg.set(`LOCATED: ${firstResult.display_name.toUpperCase().substring(0, 45)}...`);
          
          if (this.interactionMode() === 'START') {
            this.setStartpoint(latlng);
          } else {
            this.setEndpoint(latlng);
          }
        } else {
          this.systemStatusMsg.set('ERROR: LOCATION NOT FOUND');
        }
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 4000);
      })
      .catch(err => {
        console.error(err);
        this.systemStatusMsg.set('ERROR: GEOLOCATION SERVICE OFFLINE');
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 4000);
      });
  }

  setEndpoint(latlng: L.LatLng) {
    this.targetLat.set(latlng.lat.toFixed(4) + '° ' + (latlng.lat >= 0 ? 'N' : 'S'));
    this.targetLng.set(latlng.lng.toFixed(4) + '° ' + (latlng.lng >= 0 ? 'E' : 'W'));
    this.computeSunTimes(latlng.lat, latlng.lng);

    const structures = ['Civilian Compound', 'Industrial Facility', 'Communication Tower', 'Open Terrain', 'Abandoned Outpost'];
    const elevations = ['High Ground', 'Valley', 'Flat Terrain', 'Slope'];
    const detailStructure = structures[Math.floor(Math.random() * structures.length)];
    const detailElevation = elevations[Math.floor(Math.random() * elevations.length)];
    const threatLevel = Math.random() > 0.5 ? 'HIGH' : 'MODERATE';

    const popupContent = `
      <div style="font-family: monospace;">
        <b style="color: #9acd32">TARGET CONFIRMED</b><br>
        <hr style="border-color: #333; margin: 4px 0;">
        <b>Structure:</b> ${detailStructure}<br>
        <b>Terrain:</b> ${detailElevation}<br>
        <b>Threat Level:</b> <span style="color: ${threatLevel === 'HIGH' ? '#ff4444' : '#ffd700'}">${threatLevel}</span>
      </div>
    `;

    if (this.endMarker) {
      this.endMarker.setLatLng(latlng).setPopupContent(popupContent).openPopup();
    } else {
      this.endMarker = L.marker(latlng, { icon: endIcon }).addTo(this.map).bindPopup(popupContent).openPopup();
    }
    this.updateRoute();
  }

  updateBearingAndDistance() {
    if (this.startMarker && this.endMarker) {
      const start = this.startMarker.getLatLng();
      const end = this.endMarker.getLatLng();

      const lat1 = start.lat * Math.PI / 180;
      const lat2 = end.lat * Math.PI / 180;
      const lon1 = start.lng * Math.PI / 180;
      const lon2 = end.lng * Math.PI / 180;

      const dLon = lon2 - lon1;

      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

      let brng = Math.atan2(y, x) * 180 / Math.PI;
      brng = (brng + 360) % 360;

      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const idx = Math.round(brng / 22.5) % 16;
      const cardinal = directions[idx];

      this.bearingValue.set(`${brng.toFixed(1)}° (${cardinal})`);

      const distMeters = start.distanceTo(end);
      const distKm = distMeters / 1000;
      this.directDistanceValue.set(`${distKm.toFixed(2)} km`);
    } else {
      this.bearingValue.set('--');
      this.directDistanceValue.set('--');
    }
  }

  updateRoute() {
    this.updateBearingAndDistance();
    if (this.startMarker && this.endMarker) {
      const start = this.startMarker.getLatLng();
      const end = this.endMarker.getLatLng();
      
      // Clear previous routes
      this.routes.forEach(route => this.map.removeLayer(route));
      this.routes = [];

      this.systemStatusMsg.set('CALCULATING TACTICAL ROAD-BASED CORRIDORS...');
      
      // Calculate midpoints and flank offsets
      const latDiff = end.lat - start.lat;
      const lngDiff = end.lng - start.lng;
      const waypointCoords = this.buildOsrmWaypoints(start, end);
      const urlA = `https://router.project-osrm.org/route/v1/driving/${waypointCoords}?overview=full&geometries=geojson`;
      const leftFlank = this.computeFlankPoint(start, end, 0.25, true);
      const rightFlank = this.computeFlankPoint(start, end, 0.25, false);
      const urlB = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${leftFlank.lng},${leftFlank.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
      const urlC = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${rightFlank.lng},${rightFlank.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

      Promise.allSettled([
        fetch(urlA).then(res => res.json()),
        fetch(urlB).then(res => res.json()),
        fetch(urlC).then(res => res.json())
      ]).then(results => {
        const newOptions: any[] = [];
        
        results.forEach((res, idx) => {
          let color = '#9acd32';
          let dashArray = '10, 10';
          let name = 'Option B (Left Flank)';
          let badgeText = 'VIABLE';
          let badgeColor = '#ffd700';
          let weight = 3;
          let opacity = 0.35;
          let threat = 'MODERATE';
          let threatColor = '#ffd700';

          if (idx === 0) {
            color = '#00aaff';
            dashArray = '';
            name = 'Option A (Optimal)';
            badgeText = 'OPTIMAL';
            badgeColor = '#00aaff';
            weight = 6;
            opacity = 0.95;
            threat = 'LOW';
            threatColor = '#9acd32';
          } else if (idx === 2) {
            color = '#ff4444';
            dashArray = '5, 5';
            name = 'Option C (High Danger)';
            badgeText = 'HIGH RISK';
            badgeColor = '#ff4444';
            threat = 'HIGH';
            threatColor = '#ff4444';
          }

          if (res.status === 'fulfilled' && res.value && res.value.routes && res.value.routes.length > 0) {
            const routeData = res.value.routes[0];
            const coords = routeData.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
            
            const roadPolyline = L.polyline(coords, {
              color: color,
              weight: weight,
              opacity: opacity,
              dashArray: dashArray
            }).bindTooltip(name, { permanent: false, sticky: true }).addTo(this.map);
            
            this.routes.push(roadPolyline);

            // Calculate metrics from the OSRM route data
            const distanceKm = (routeData.distance / 1000).toFixed(1) + ' km';
            const durationMin = Math.round(routeData.duration / 60) + ' min';

            newOptions.push({
              name: name,
              badgeText: badgeText,
              badgeColor: badgeColor,
              distance: distanceKm,
              eta: durationMin,
              threat: threat,
              threatColor: threatColor
            });
          } else {
            // Fallback to simple curve lines only if that specific OSRM request fails completely
            let coords: L.LatLng[] = [start, end];
            if (idx === 1) coords = [start, leftFlank, end];
            if (idx === 2) coords = [start, rightFlank, end];

            const roadPolyline = L.polyline(coords, {
              color: color,
              weight: weight,
              opacity: opacity,
              dashArray: dashArray
            }).bindTooltip(name, { permanent: false, sticky: true }).addTo(this.map);
            
            this.routes.push(roadPolyline);

            const distanceKm = (start.distanceTo(end) / 1000 * (idx === 0 ? 1.0 : idx === 1 ? 1.25 : 1.35)).toFixed(1) + ' km';
            const durationMin = Math.round(parseFloat(distanceKm) * 1.5) + ' min';

            newOptions.push({
              name: name,
              badgeText: badgeText,
              badgeColor: badgeColor,
              distance: distanceKm,
              eta: durationMin,
              threat: threat,
              threatColor: threatColor
            });
          }
        });

        this.routeOptions.set(newOptions);
        this.selectedRouteIndex.set(0);
        this.selectRouteOption(0);
        this.updateSelectedRouteCoordinates();

        const group = new L.FeatureGroup(this.routes);
        this.map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 16 });

        this.systemStatusMsg.set('ROAD ROUTING GENERATED. AWAITING PATH SELECTION...');
        this.analyzeTerrainFeatures(start, end);
      }).catch(err => {
        console.warn('OSRM routing failed, using fallback generator:', err);
        this.generateFallbackRoutes(start, end);
        this.analyzeTerrainFeatures(start, end);
      });
    }
  }

  generateFallbackRoutes(start: L.LatLng, end: L.LatLng) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    const nx = -lngDiff;
    const ny = latDiff;
    
    const length = Math.sqrt(nx * nx + ny * ny);
    if (length === 0) return;
    const normX = nx / length;
    const normY = ny / length;

    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;

    const offset = distance * 0.25;

    const leftFlank = new L.LatLng(midLat + normY * offset, midLng + normX * offset);
    const rightFlank = new L.LatLng(midLat - normY * offset, midLng - normX * offset);

    const directRoute = L.polyline([start, end], {
      color: '#ff4444',
      weight: 3,
      opacity: 0.35,
      dashArray: '5, 5'
    }).bindTooltip('Option A (Direct)', { permanent: false, sticky: true }).addTo(this.map);
    
    const leftRoute = L.polyline([start, leftFlank, end], {
      color: '#9acd32',
      weight: 6,
      opacity: 0.95,
      dashArray: '10, 10'
    }).bindTooltip('Option B (Left Flank)', { permanent: false, sticky: true }).addTo(this.map);

    const rightRoute = L.polyline([start, rightFlank, end], {
      color: '#ffd700',
      weight: 3,
      opacity: 0.35,
      dashArray: '8, 8'
    }).bindTooltip('Option C (Right Flank)', { permanent: false, sticky: true }).addTo(this.map);

    this.routes.push(directRoute, leftRoute, rightRoute);

    const distanceVal = start.distanceTo(end) / 1000;

    this.routeOptions.set([
      {
        name: 'Option A (Direct)',
        badgeText: 'DIRECT',
        badgeColor: '#ff4444',
        distance: distanceVal.toFixed(1) + ' km',
        eta: Math.round(distanceVal * 1.5) + ' min',
        threat: 'HIGH',
        threatColor: '#ff4444'
      },
      {
        name: 'Option B (Left Flank)',
        badgeText: 'VIABLE',
        badgeColor: '#9acd32',
        distance: (distanceVal * 1.25).toFixed(1) + ' km',
        eta: Math.round(distanceVal * 1.25 * 1.5) + ' min',
        threat: 'LOW',
        threatColor: '#9acd32'
      },
      {
        name: 'Option C (Right Flank)',
        badgeText: 'MODERATE',
        badgeColor: '#ffd700',
        distance: (distanceVal * 1.35).toFixed(1) + ' km',
        eta: Math.round(distanceVal * 1.35 * 1.5) + ' min',
        threat: 'MODERATE',
        threatColor: '#ffd700'
      }
    ]);
    
    this.selectedRouteIndex.set(1); // Option B Left Flank is optimal fallback
    
    const group = new L.FeatureGroup(this.routes);
    this.map.fitBounds(group.getBounds().pad(0.1), { maxZoom: 16 });
  }

  analyzeTerrainFeatures(start: L.LatLng, end: L.LatLng) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;

    const distanceInKm = distance * 111;
    const elevation = Math.floor(Math.random() * 300) + (distanceInKm * 10);
    const water = Math.floor(distanceInKm / 5);
    
    let density = 'Light';
    if (distanceInKm > 5) density = 'Moderate';
    if (distanceInKm > 15) density = 'Heavy';

    this.terrainAnalysis.set({
      forestDensity: density,
      elevationGain: `+${elevation.toFixed(0)}m`,
      waterObstacles: water > 0 ? `${water} Minor` : 'None'
    });

    this.forestShapes.clearLayers();
    const numForests = density === 'Heavy' ? 6 : density === 'Moderate' ? 3 : 1;
    
    for (let i = 0; i < numForests; i++) {
      const randLat = midLat + (Math.random() - 0.5) * distance * 0.5;
      const randLng = midLng + (Math.random() - 0.5) * distance * 0.5;
      
      const radius = 250 + Math.random() * 500;
      const forestLength = (radius * 2 / 1000).toFixed(2);
      const threats = ['LOW', 'MODERATE', 'ELEVATED', 'HIGH'];
      const threatLevel = threats[Math.floor(Math.random() * threats.length)];

      const tooltipContent = `
        <div style="font-family: monospace;">
          <b>Detected Forest Zone</b><br>
          <b>Span:</b> ~${forestLength} km<br>
          <b>Threat Level:</b> <span style="color: ${threatLevel === 'HIGH' || threatLevel === 'ELEVATED' ? '#ff4444' : '#9acd32'}">${threatLevel}</span>
        </div>
      `;
      
      L.circle([randLat, randLng], {
        color: '#228B22',
        fillColor: '#228B22',
        fillOpacity: 0.4,
        radius: radius
      }).bindTooltip(tooltipContent, { permanent: false, direction: 'top' }).addTo(this.forestShapes);
    }

    this.waterObstaclesShapes.clearLayers();
    if (water > 0) {
      for (let i = 0; i < water; i++) {
        const wLat = midLat + (Math.random() - 0.5) * distance * 0.4;
        const wLng = midLng + (Math.random() - 0.5) * distance * 0.4;

        const waterPoly = L.polygon([
          [wLat - 0.002, wLng - 0.002],
          [wLat + 0.002, wLng - 0.001],
          [wLat + 0.001, wLng + 0.003],
          [wLat - 0.001, wLng + 0.002]
        ], {
          color: '#00aaff',
          fillColor: '#00aaff',
          fillOpacity: 0.5
        }).addTo(this.waterObstaclesShapes);

        const width = Math.floor(Math.random() * 50) + 20;
        const length = Math.floor(Math.random() * 200) + 100;
        const depth = (Math.random() * 5 + 1).toFixed(1);

        waterPoly.bindPopup(`<b>Water Obstacle Detected</b><br>Dimensions: ${length}m x ${width}m<br>Est. Depth: ${depth}m`);
      }
    }
  }

  showWaterObstacleDetails() {
    if (this.terrainAnalysis().waterObstacles === 'None') return;
    if (this.waterObstaclesShapes.getLayers().length > 0) {
      // Zoom to the first water obstacle
      const firstObstacle = this.waterObstaclesShapes.getLayers()[0] as L.Polygon;
      this.map.fitBounds(firstObstacle.getBounds().pad(0.5));
      firstObstacle.openPopup();
    }
  }

  triggerSOS() {
    this.systemStatusMsg.set('SOS SIGNAL BROADCASTING... STANDBY');
    const oldStatus = this.gpsStatus();
    this.gpsStatus.set('SOS TRANSMITTING');
    
    if (this.startMarker) {
      const pos = this.startMarker.getLatLng();
      L.circleMarker(pos, { radius: 30, color: 'red', className: 'sos-ping', weight: 4 }).addTo(this.map);
    }

    setTimeout(() => {
      this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE');
      this.gpsStatus.set(oldStatus);
    }, 4000);
  }

  openComms() {
    this.systemStatusMsg.set('COMMS CHANNEL OPEN. ENCRYPTING DATA...');
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  toggleWaypoints() {
    this.waypointsVisible = !this.waypointsVisible;
    if (this.waypointsVisible) {
      this.systemStatusMsg.set('WAYPOINTS ACTIVATED');
      if (this.startMarker && this.endMarker) {
         this.waypointsLayer.clearLayers();
         const start = this.startMarker.getLatLng();
         const end = this.endMarker.getLatLng();
         const midLat = (start.lat + end.lat) / 2;
         const midLng = (start.lng + end.lng) / 2;
         L.marker(new L.LatLng(midLat, midLng)).bindTooltip('WP Alpha', { permanent: true }).addTo(this.waypointsLayer);
         this.waypointsLayer.addTo(this.map);
      }
    } else {
      this.systemStatusMsg.set('WAYPOINTS DEACTIVATED');
      this.map.removeLayer(this.waypointsLayer);
    }
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  offlineSync() {
    if (!this.startMarker || !this.endMarker) {
      this.systemStatusMsg.set('ERROR: START OR TARGET MISSING FOR SYNC');
      setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
      return;
    }

    this.systemStatusMsg.set('DOWNLOADING MAP TILES: START, TARGET & WAYPOINTS (0%)...');
    
    const start = this.startMarker.getLatLng();
    const end = this.endMarker.getLatLng();
    const bounds = this.buildOfflineBounds(); 
    
    this.offlineSyncLayer.clearLayers();
    const rect = L.rectangle(bounds, { color: '#00ff00', weight: 2, fillOpacity: 0.1, dashArray: '10, 10' }).addTo(this.offlineSyncLayer);
    this.map.fitBounds(bounds, { maxZoom: 16 });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      this.systemStatusMsg.set(`DOWNLOADING MAP TILES: START, TARGET & WAYPOINTS (${progress}%)...`);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Serialize current routes
        const serializedRoutes = this.routes.map(polyline => {
          const latlngs = polyline.getLatLngs() as L.LatLng[];
          return {
            coords: latlngs.map(latlng => [latlng.lat, latlng.lng]),
            color: (polyline.options as any).color,
            weight: (polyline.options as any).weight,
            opacity: (polyline.options as any).opacity,
            dashArray: (polyline.options as any).dashArray,
            tooltipText: polyline.getTooltip()?.getContent()
          };
        });

        // Save complete offline payload to localStorage
        const offlineData = {
          startPoint: start,
          hitPoint: end,
          waypoints: this.waypoints().map(wp => ({ id: wp.id, name: wp.name, lat: wp.lat, lng: wp.lng })),
          routes: serializedRoutes,
          routeOptions: this.routeOptions(),
          selectedRouteIndex: this.selectedRouteIndex(),
          terrainAnalysis: this.terrainAnalysis(),
          missionBriefing: this.missionBriefing,
          offlineBounds: {
            southWest: bounds.getSouthWest(),
            northEast: bounds.getNorthEast()
          },
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('paktak_offline_cache', JSON.stringify(offlineData));
        this.hasOfflineMap.set(true);
        console.log('[OFFLINE CACHE] Saved complete mission & route details to local storage:', offlineData);

        this.systemStatusMsg.set('OFFLINE SYNC COMPLETE. START, TARGET, WAYPOINTS & ROUTES CACHED FOR OFFLINE USE.');
        rect.setStyle({ color: '#ffffff', fillOpacity: 0.2, dashArray: '0' });
        rect.bindPopup('<b>Offline Area Cached</b><br>Start, target, waypoints and routes saved successfully.').openPopup();
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.1 GB AVAILABLE'), 5000);
      }
    }, 500);
  }

  viewOfflineMap() {
    const cached = localStorage.getItem('paktak_offline_cache');
    if (!cached) {
      this.hasOfflineMap.set(false);
      this.systemStatusMsg.set('ERROR: NO OFFLINE SYNCED MAP FOUND');
      setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
      return;
    }

    try {
      const offlineData = JSON.parse(cached);
      if (!offlineData.startPoint || !offlineData.hitPoint) {
        this.systemStatusMsg.set('ERROR: OFFLINE MAP CACHE IS INCOMPLETE');
        return;
      }

      const bounds = offlineData.offlineBounds
        ? L.latLngBounds(
            [offlineData.offlineBounds.southWest.lat, offlineData.offlineBounds.southWest.lng],
            [offlineData.offlineBounds.northEast.lat, offlineData.offlineBounds.northEast.lng]
          )
        : this.buildOfflineBounds();

      this.offlineSyncLayer.clearLayers();
      L.rectangle(bounds, {
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.15,
        dashArray: '0'
      }).addTo(this.offlineSyncLayer).bindPopup('<b>Viewing Offline Synced Map</b><br>Cached start, target, waypoints and route area.').openPopup();

      this.map.fitBounds(bounds, { maxZoom: 16 });
      this.systemStatusMsg.set(`OFFLINE MAP VIEW ACTIVE: ${offlineData.missionBriefing?.codeName || 'SAVED OPERATION'}`);
    } catch (error) {
      console.error('Failed to view offline map:', error);
      this.systemStatusMsg.set('ERROR: FAILED TO LOAD OFFLINE SYNCED MAP');
    }
  }


}
