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
  public interactionMode = signal<'START' | 'HIT'>('HIT');
  public routeOptions = signal<any[]>([]);
  public selectedRouteIndex = signal<number>(0);

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

  public targets = [
    { id: 'T-01', type: 'STRUCTURE', coord: '33.6922° N, 73.0537° E', lat: 33.6922, lng: 73.0537, status: 'IDENTIFIED' },
    { id: 'T-02', type: 'VEHICLE', coord: '33.7015° N, 73.0640° E', lat: 33.7015, lng: 73.0640, status: 'IN TRANSIT' },
    { id: 'T-03', type: 'PERSONNEL', coord: '33.6818° N, 73.0330° E', lat: 33.6818, lng: 73.0330, status: 'UNKNOWN' },
  ];

  public terrainAnalysis = signal({
    forestDensity: 'Scanning...',
    elevationGain: '--',
    waterObstacles: '--'
  });

  private timeInterval: any;
  private watchId?: number;

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    
    // Restore custom mission code name from local storage if present
    const savedCode = localStorage.getItem('paktak_mission_code');
    if (savedCode) {
      this.missionBriefing.codeName = savedCode;
    }

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
      this.authError.set(e.message || 'Registration failed');
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
      if (mode === 'SATELLITE') {
        this.currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
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

    // Map click event to set start or endpoint based on active mode
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.interactionMode() === 'START') {
        this.setStartpoint(e.latlng);
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

          // Center view on restored coordinates
          const group = new L.FeatureGroup(this.routes.length > 0 ? this.routes : [this.startMarker, this.endMarker]);
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
          
          this.gpsStatus.set('LOCKED');
          this.currentLatNum = lat;
          this.currentLngNum = lng;
          this.currentLat.set(lat.toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S'));
          this.currentLng.set(lng.toFixed(4) + '° ' + (lng >= 0 ? 'E' : 'W'));

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
          this.currentLatNum = lat;
          this.currentLngNum = lng;
          this.currentLat.set(lat.toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S'));
          this.currentLng.set(lng.toFixed(4) + '° ' + (lng >= 0 ? 'E' : 'W'));
          const latlng = new L.LatLng(lat, lng);
          if (this.startMarker) {
            this.startMarker.setLatLng(latlng);
            this.updateRoute();
          }
      });
    } else {
      this.gpsStatus.set('UNAVAILABLE');
    }
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
    this.systemStatusMsg.set(`TACTICAL PATH MODIFIED: SELECTED OPTION ${String.fromCharCode(65 + idx)}`);
  }

  setInteractionMode(mode: 'START' | 'HIT') {
    this.interactionMode.set(mode);
    this.systemStatusMsg.set(`INTERACTION MODE CHANGED: SET ${mode === 'START' ? 'START POINT' : 'TARGET POINT'}`);
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  setStartpoint(latlng: L.LatLng) {
    this.currentLatNum = latlng.lat;
    this.currentLngNum = latlng.lng;
    this.currentLat.set(latlng.lat.toFixed(4) + '° ' + (latlng.lat >= 0 ? 'N' : 'S'));
    this.currentLng.set(latlng.lng.toFixed(4) + '° ' + (latlng.lng >= 0 ? 'E' : 'W'));
    this.gpsStatus.set('MANUAL LOCK');

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

  updateRoute() {
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
      const distanceVal = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      const nx = -lngDiff;
      const ny = latDiff;
      const length = Math.sqrt(nx * nx + ny * ny);
      
      let leftFlank = start;
      let rightFlank = end;
      
      if (length > 0) {
        const normX = nx / length;
        const normY = ny / length;
        const midLat = (start.lat + end.lat) / 2;
        const midLng = (start.lng + end.lng) / 2;
        
        // Offset proportional to distance to create distinct flanking options
        const offset = distanceVal * 0.25;

        leftFlank = new L.LatLng(midLat + normY * offset, midLng + normX * offset);
        rightFlank = new L.LatLng(midLat - normY * offset, midLng - normX * offset);
      }

      // Generate three queries:
      // Option A: Direct road routing
      // Option B: Road routing forced through Left Flank snapped waypoint
      // Option C: Road routing forced through Right Flank snapped waypoint
      const urlA = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
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

    this.systemStatusMsg.set('DOWNLOADING MAP TILES: START & HIT POINT (0%)...');
    
    const start = this.startMarker.getLatLng();
    const end = this.endMarker.getLatLng();
    const bounds = L.latLngBounds(start, end).pad(0.2); 
    
    this.offlineSyncLayer.clearLayers();
    const rect = L.rectangle(bounds, { color: '#00ff00', weight: 2, fillOpacity: 0.1, dashArray: '10, 10' }).addTo(this.offlineSyncLayer);
    this.map.fitBounds(bounds, { maxZoom: 16 });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      this.systemStatusMsg.set(`DOWNLOADING MAP TILES: START & HIT POINT (${progress}%)...`);
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
          routes: serializedRoutes,
          routeOptions: this.routeOptions(),
          selectedRouteIndex: this.selectedRouteIndex(),
          terrainAnalysis: this.terrainAnalysis(),
          missionBriefing: this.missionBriefing,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('paktak_offline_cache', JSON.stringify(offlineData));
        console.log('[OFFLINE CACHE] Saved complete mission & route details to local storage:', offlineData);

        this.systemStatusMsg.set('OFFLINE SYNC COMPLETE. TILES, ROUTES & TERRAIN CACHED FOR OFFLINE USE.');
        rect.setStyle({ color: '#ffffff', fillOpacity: 0.2, dashArray: '0' });
        rect.bindPopup('<b>Offline Area Cached</b><br>Points, Routes & Terrain saved successfully.').openPopup();
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.1 GB AVAILABLE'), 5000);
      }
    }, 500);
  }

  selectTarget(target: any) {
    const latlng = new L.LatLng(target.lat, target.lng);
    this.map.setView(latlng, 15);
    this.setEndpoint(latlng);
  }

}
