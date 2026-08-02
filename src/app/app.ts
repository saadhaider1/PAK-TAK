import { Component, signal, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import maplibregl from 'maplibre-gl';
import { SqliteService } from './sqlite.service';

type LatLng = { lat: number; lng: number };
type RouteDef = {
  id: string;
  sourceId: string;
  layerId: string;
  coordinates: LatLng[];
  color: string;
  width: number;
  opacity: number;
  dashArray?: string;
  label: string;
};
type MarkerRecord = { marker: maplibregl.Marker; popup?: maplibregl.Popup };

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

  public map!: maplibregl.Map;
  public startMarker?: MarkerRecord;
  public endMarker?: MarkerRecord;
  public routes: RouteDef[] = [];
  public waypointMarkers: MarkerRecord[] = [];

  public currentLat = signal('WAITING');
  public currentLatNum = 0;
  public currentLng = signal('WAITING');
  public currentLngNum = 0;
  public currentLocationName = signal('Searching location...');
  public targetLat = signal('--');
  public targetLng = signal('--');
  public targetLocationName = signal('--');

  public systemStatusMsg = signal('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE');
  public waypointsVisible = false;
  public interactionMode = signal<'START' | 'HIT' | 'WAYPOINT'>('HIT');
  public routeOptions = signal<any[]>([]);
  public selectedRouteIndex = signal<number>(0);
  public waypoints = signal<Array<{ id: string; name: string; lat: number; lng: number; marker?: MarkerRecord }>>([]);
  public sunTimes = signal({ sunrise: '--:--', sunset: '--:--', date: 'TODAY' });
  public journeyActive = signal(false);
  public journeyMarker?: MarkerRecord;
  public journeyPath?: RouteDef;
  public selectedRouteCoordinates: LatLng[] = [];
  public hasOfflineMap = signal(false);
  public isOfflineSessionActive = signal<boolean>(false);
  public startPointIsCurrentLocation = signal<boolean>(false);

  public bearingValue = signal<string>('--');
  public targetBearingMil = signal<string>('--');
  public targetHeading = signal<string>('--');
  public directDistanceValue = signal<string>('--');

  public is3DTilted = signal<boolean>(false);
  public isDroneOrbiting = signal<boolean>(false);
  public showSearchBars = signal<boolean>(true);
  public activeSearchTarget = signal<'START' | 'HIT' | 'WAYPOINT' | null>(null);
  public searchSuggestions = signal<Array<{ name: string; lat: number; lng: number }>>([]);
  private orbitInterval: any;

  public presetLocations = [
    { name: 'Islamabad Capital', lat: 33.6844, lng: 73.0479 },
    { name: 'Rawalpindi HQ', lat: 33.5989, lng: 73.0441 },
    { name: 'Lahore Garrison', lat: 31.5204, lng: 74.3587 },
    { name: 'Karachi Port', lat: 24.8607, lng: 67.0011 },
    { name: 'Peshawar Sector', lat: 34.0151, lng: 71.5249 },
    { name: 'Skardu Base', lat: 35.2979, lng: 75.6337 },
    { name: 'Kashmir Border', lat: 34.3700, lng: 73.4700 },
    { name: 'Murree Heights', lat: 33.9070, lng: 73.3903 }
  ];

  public toggleSearchOverlay() {
    const current = this.showSearchBars();
    this.showSearchBars.set(!current);
    this.systemStatusMsg.set(!current ? 'SEARCH OVERLAY ACTIVATED' : 'SEARCH OVERLAY HIDDEN (CLEAN MAP VIEW)');
  }

  public clearTarget() {
    if (this.endMarker) {
      this.endMarker.marker.remove();
      this.endMarker = undefined;
    }
    this.targetLat.set('--');
    this.targetLng.set('--');
    this.targetLocationName.set('--');
    this.clearRoutes();
    this.clearTerrainOverlays();
    this.updateBearingAndDistance();
    this.systemStatusMsg.set('TARGET LOCATION REMOVED');
  }

  public toggle3DTilt() {
    if (!this.map) return;
    if (this.isDroneOrbiting()) {
      clearInterval(this.orbitInterval);
      this.isDroneOrbiting.set(false);
    }
    const currentTilt = this.is3DTilted();
    const newTilt = !currentTilt;
    this.is3DTilted.set(newTilt);
    
    this.map.easeTo({
      pitch: newTilt ? 58 : 0,
      bearing: newTilt ? 30 : 0,
      duration: 1200,
      easing: (t) => t * (2 - t)
    });
    this.systemStatusMsg.set(newTilt ? '3D PERSPECTIVE VIEW ACTIVATED (58° TILT)' : '2D PLANAR VIEW RESTORED (0° TILT)');
  }

  public toggleDroneOrbit() {
    if (!this.map) return;
    const orbiting = !this.isDroneOrbiting();
    this.isDroneOrbiting.set(orbiting);
    
    if (orbiting) {
      this.is3DTilted.set(true);
      this.map.easeTo({ pitch: 58, duration: 800 });
      this.orbitInterval = setInterval(() => {
        if (!this.map || !this.isDroneOrbiting()) {
          clearInterval(this.orbitInterval);
          return;
        }
        const currentBearing = this.map.getBearing();
        this.map.setBearing((currentBearing + 0.4) % 360);
      }, 50);
      this.systemStatusMsg.set('3D DRONE RECONNAISSANCE ORBIT ACTIVATED');
    } else {
      clearInterval(this.orbitInterval);
      this.systemStatusMsg.set('DRONE ORBIT PAUSED');
    }
  }

  public resetNorth() {
    if (!this.map) return;
    this.map.resetNorthPitch({ duration: 800 });
    this.is3DTilted.set(false);
    this.systemStatusMsg.set('COMPASS & PITCH ALIGNED TO NORTH');
  }

  public recenterGPS() {
    if (!this.map) return;
    if (this.currentLatNum && this.currentLngNum) {
      this.map.flyTo({ center: [this.currentLngNum, this.currentLatNum], zoom: 15, duration: 1200 });
      this.systemStatusMsg.set('RECENTERED ON CURRENT GPS POSITION');
    } else {
      this.locateUser();
    }
  }

  public clearAllMarkers() {
    this.resetMissionState();
    this.systemStatusMsg.set('TACTICAL MAP CLEARED');
  }

  private debounceTimer: any;
  public onSearchInputChange(query: string, target: 'START' | 'HIT' | 'WAYPOINT') {
    this.activeSearchTarget.set(target);
    if (!query || query.trim().length < 2) {
      this.searchSuggestions.set([]);
      return;
    }
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const suggestions = data.map((item: any) => ({
              name: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }));
            this.searchSuggestions.set(suggestions);
          }
        })
        .catch(() => {
          this.searchSuggestions.set([]);
        });
    }, 300);
  }

  public selectSuggestion(sugg: { name: string; lat: number; lng: number }, target: 'START' | 'HIT' | 'WAYPOINT') {
    const latlng = { lat: sugg.lat, lng: sugg.lng };
    this.map.flyTo({ center: [sugg.lng, sugg.lat], zoom: 14, duration: 1200 });
    
    if (target === 'START') {
      this.setStartpoint(latlng, false);
    } else if (target === 'HIT') {
      this.setEndpoint(latlng);
    } else {
      this.addWaypoint(latlng);
    }
    this.searchSuggestions.set([]);
    this.activeSearchTarget.set(null);
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
  private journeyWatchId?: number;
  private nextLayerId = 1;
  private terrainLayerIds: string[] = [];
  private terrainSourceIds: string[] = [];
  private terrainRequestToken = 0;
  private lastTerrainFeatures: any | null = null;
  private geocodeRequestToken = 0;

  public hasStartAndEnd(): boolean {
    return !!this.startMarker && !!this.endMarker;
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    const requestToken = ++this.geocodeRequestToken;
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PAK-TAK Tactical Tablet'
        }
      });
      
      if (requestToken !== this.geocodeRequestToken) {
        return 'Location cancelled';
      }

      if (!response.ok) {
        return 'Unknown location';
      }

      const data = await response.json();
      if (data && data.display_name) {
        // Format the address to show street, city, country
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        if (parts.length >= 3) {
          return `${parts[0]}, ${parts[1]}`; // Street and area
        }
        return data.display_name;
      }
      return 'Unknown location';
    } catch (error) {
      console.warn('Geocoding failed:', error);
      return 'Location unavailable';
    }
  }

  ngOnInit() {
    (window as any).paktakClearTarget = () => this.clearTarget();
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    const savedCode = localStorage.getItem('paktak_mission_code');
    if (savedCode) {
      this.missionBriefing.codeName = savedCode;
    }
    this.hasOfflineMap.set(!!localStorage.getItem('paktak_offline_cache'));

    setTimeout(() => {
      this.isLoading.set(false);
    }, 3500);
  }

  ngAfterViewInit() {
    // Map initialization is delayed until user authentication completes
  }

  private getMapStyle(mode: string): any {
    if (mode === 'SATELLITE') {
      return {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [
              'offline-tile://https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'offline-tile://https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'offline-tile://https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'offline-tile://https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            ],
            tileSize: 256,
            maxzoom: 20,
            attribution: 'Imagery © Google Maps'
          }
        },
        layers: [
          { id: 'basemap', type: 'raster', source: 'basemap' }
        ]
      };
    }

    if (mode === 'ESRI_SAT') {
      return {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [
              'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: 'Tiles © Esri'
          },
          roads: {
            type: 'raster',
            tiles: [
              'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Roads © Esri'
          },
          labels: {
            type: 'raster',
            tiles: [
              'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Labels © Esri'
          }
        },
        layers: [
          { id: 'basemap', type: 'raster', source: 'basemap' },
          { id: 'roads', type: 'raster', source: 'roads', opacity: 0.9 },
          { id: 'labels', type: 'raster', source: 'labels', opacity: 1.0 }
        ]
      };
    }

    if (mode === 'NIGHT') {
      return {
        version: 8,
        sources: {
          basemap: {
            type: 'raster',
            tiles: [
              'offline-tile://https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'offline-tile://https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'offline-tile://https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: 'Tiles © OpenStreetMap contributors, CARTO'
          },
          roads: {
            type: 'raster',
            tiles: [
              'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Roads © Esri'
          },
          labels: {
            type: 'raster',
            tiles: [
              'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Labels © Esri'
          }
        },
        layers: [
          { id: 'basemap', type: 'raster', source: 'basemap' },
          { id: 'roads', type: 'raster', source: 'roads', opacity: 0.7 },
          { id: 'labels', type: 'raster', source: 'labels', opacity: 0.85 }
        ]
      };
    }

    return {
      version: 8,
      sources: {
        basemap: {
          type: 'raster',
          tiles: [
            'offline-tile://https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
            'offline-tile://https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
            'offline-tile://https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: 'Tiles © OpenTopoMap, OSM contributors'
        },
        hillshade: {
          type: 'raster',
          tiles: [
            'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Hillshade © Esri'
        },
        roads: {
          type: 'raster',
          tiles: [
            'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Roads © Esri'
        },
        labels: {
          type: 'raster',
          tiles: [
            'offline-tile://https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Labels © Esri'
        }
      },
      layers: [
        { id: 'basemap', type: 'raster', source: 'basemap' },
        { id: 'hillshade', type: 'raster', source: 'hillshade', opacity: 0.4 },
        { id: 'roads', type: 'raster', source: 'roads', opacity: 0.6 },
        { id: 'labels', type: 'raster', source: 'labels', opacity: 0.9 }
      ]
    };
  }

  public setMode(mode: string) {
    this.currentMode.set(mode);
    if (this.map) {
      this.map.setStyle(this.getMapStyle(mode));
      this.map.once('styledata', () => {
        this.redrawRoutes();
        this.redrawWaypoints();
        this.redrawTerrainOverlays();
      });
    }
  }

  private resetMissionState() {
    // Detach any markers from a prior session (their old map is discarded too).
    this.startMarker?.marker.remove();
    this.endMarker?.marker.remove();
    this.waypoints().forEach((wp) => wp.marker?.marker.remove());
    this.journeyMarker?.marker.remove();

    this.startMarker = undefined;
    this.endMarker = undefined;
    this.journeyMarker = undefined;
    this.journeyPath = undefined;
    this.routes = [];
    this.waypointMarkers = [];
    this.lastTerrainFeatures = null;
    this.terrainLayerIds = [];
    this.terrainSourceIds = [];

    this.waypoints.set([]);
    this.routeOptions.set([]);
    this.selectedRouteIndex.set(0);
    this.selectedRouteCoordinates = [];
    this.journeyActive.set(false);
    this.waypointsVisible = false;
    this.startPointIsCurrentLocation.set(false);

    // Clear target + bearing readouts; start fields revert to live GPS state.
    this.targetLat.set('--');
    this.targetLng.set('--');
    this.targetLocationName.set('--');
    this.currentLat.set('WAITING');
    this.currentLng.set('WAITING');
    this.currentLocationName.set('Searching location...');
    this.currentLatNum = 0;
    this.currentLngNum = 0;
    this.bearingValue.set('--');
    this.targetBearingMil.set('--');
    this.targetHeading.set('--');
    this.directDistanceValue.set('--');
    this.terrainAnalysis.set({ forestDensity: 'Scanning...', elevationGain: '--', waterObstacles: '--' });
  }

  public initMap() {
    // Register custom protocol for offline tiles
    try {
      maplibregl.addProtocol('offline-tile', (params, callback) => {
        let targetUrl = params.url.replace('offline-tile://', '');
        // Normalize tile subdomains to consolidate cache lookup and storage
        targetUrl = targetUrl
          .replace('://b.basemaps.cartocdn.com/', '://a.basemaps.cartocdn.com/')
          .replace('://c.basemaps.cartocdn.com/', '://a.basemaps.cartocdn.com/')
          .replace('://b.tile.opentopomap.org/', '://a.tile.opentopomap.org/')
          .replace('://c.tile.opentopomap.org/', '://a.tile.opentopomap.org/')
          .replace('://mt1.google.com/', '://mt0.google.com/')
          .replace('://mt2.google.com/', '://mt0.google.com/')
          .replace('://mt3.google.com/', '://mt0.google.com/');
        caches.open('paktak-map-tiles').then((cache) => {
          cache.match(targetUrl).then((cachedResponse) => {
            if (cachedResponse) {
              // Clone the response before reading to avoid "body already read" errors
              cachedResponse.clone().arrayBuffer().then((buffer) => {
                callback(null, buffer, null, null);
              }).catch((err) => {
                console.warn(`Failed to read cached tile: ${targetUrl}`, err);
                callback(err);
              });
            } else {
              // Try to fetch from network if online
              fetch(targetUrl)
                .then((response) => {
                  if (response.ok) {
                    // Cache it on the fly! Clone before caching
                    cache.put(targetUrl, response.clone()).catch((err) => {
                      console.warn(`Failed to cache tile: ${targetUrl}`, err);
                    });
                    response.arrayBuffer().then((buffer) => {
                      callback(null, buffer, null, null);
                    }).catch((err) => {
                      console.warn(`Failed to read fetched tile: ${targetUrl}`, err);
                      callback(err);
                    });
                  } else {
                    callback(new Error(`Tile fetch failed with HTTP status ${response.status}`));
                  }
                })
                .catch((err) => {
                  callback(err);
                });
            }
          }).catch((err) => {
            console.warn(`Cache match error for ${targetUrl}:`, err);
            callback(err);
          });
        }).catch((err) => {
          console.warn(`Failed to open cache for ${targetUrl}:`, err);
          callback(err);
        });
        return { cancel: () => {} };
      });
    } catch (e) {
      // Protocol already registered or MapLibre not initialized
      console.warn('offline-tile protocol registration bypassed:', e);
    }

    this.map = new maplibregl.Map({
      container: 'tactical-map',
      style: this.getMapStyle(this.currentMode()),
      center: [73.0479, 33.6844],
      zoom: 13,
      attributionControl: false,
      fadeDuration: 150, // Ultra-fast fade-in for better responsiveness
      bearingSnap: 7,
      pitchWithRotate: true,
      renderWorldCopies: false,
      maxPitch: 60,
      minPitch: 0,
      dragRotate: true,
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      doubleClickZoom: true,
      keyboard: true,
      boxZoom: true
    });

    // Add scale control at bottom-left
    this.map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Add loading state management
    this.map.on('loading', () => {
      this.systemStatusMsg.set('MAP LOADING: ACQUIRING SATELLITE IMAGERY...');
    });

    this.map.on('load', () => {
      this.systemStatusMsg.set('MAP INITIALIZED: TACTICAL DISPLAY ACTIVE');
      
      // Add smooth transition for initial load with enhanced animation
      this.map.flyTo({
        center: [73.0479, 33.6844],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
        curve: 1.42,
        easing: (t) => t * (2 - t) // Ease-out quadratic
      });

      // Add interactive cursor feedback
      this.map.getCanvas().style.cursor = 'crosshair';

      this.map.on('click', (event) => {
        // Block interaction if offline session is active
        if (this.isOfflineSessionActive()) {
          this.systemStatusMsg.set('ERROR: OFFLINE SESSION IS READ-ONLY');
          return;
        }

        // Ignore clicks that land on a highlighted terrain feature; those show
        // their own details popup and must not drop a start/target/waypoint.
        const terrainLayers = this.terrainLayerIds.filter((id) => this.map.getLayer(id));
        if (terrainLayers.length > 0) {
          const hits = this.map.queryRenderedFeatures(event.point, { layers: terrainLayers });
          if (hits.length > 0) {
            return;
          }
        }

        const latlng = this.toLatLng(event.lngLat);
        if (this.interactionMode() === 'WAYPOINT') {
          this.addWaypoint(latlng);
        } else if (this.interactionMode() === 'START') {
          this.setStartpoint(latlng, false);
        } else {
          this.setEndpoint(latlng);
        }
      });

      // Add hover effects for better interactivity
      this.map.on('mousemove', (event) => {
        this.map.getCanvas().style.cursor = 'crosshair';
      });

      this.map.on('mousedown', () => {
        this.map.getCanvas().style.cursor = 'grabbing';
      });

      this.map.on('mouseup', () => {
        this.map.getCanvas().style.cursor = 'crosshair';
      });

      // Add zoom level feedback
      this.map.on('zoom', () => {
        const zoom = this.map.getZoom().toFixed(1);
        this.systemStatusMsg.set(`ZOOM LEVEL: ${zoom}x | TACTICAL DISPLAY ACTIVE`);
      });

      // NOTE: Do NOT restore cached/saved mission data on login. A fresh session
      // must show only the live GPS start location (no previously marked start,
      // target, waypoints or routes). Saved data is loaded only on explicit
      // user request via viewOfflineMap().
    });

    // Handle map errors gracefully
    this.map.on('error', (error) => {
      console.error('Map error:', error);
      this.systemStatusMsg.set('MAP ERROR: RETRYING CONNECTION...');
    });

    // Optimize map performance
    this.map.on('idle', () => {
      this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE');
    });

    // Add move end feedback
    this.map.on('moveend', () => {
      const center = this.map.getCenter();
      const zoom = this.map.getZoom().toFixed(1);
      this.systemStatusMsg.set(`POSITION: ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)} | ZOOM: ${zoom}x`);
    });

    // Add keyboard shortcuts for user-friendly navigation
    document.addEventListener('keydown', (e) => {
      if (!this.map) return;
      
      switch(e.key) {
        case '+':
        case '=':
          this.map.zoomIn();
          this.systemStatusMsg.set('ZOOM IN');
          break;
        case '-':
        case '_':
          this.map.zoomOut();
          this.systemStatusMsg.set('ZOOM OUT');
          break;
        case 'ArrowUp':
          this.map.panBy([0, -100]);
          break;
        case 'ArrowDown':
          this.map.panBy([0, 100]);
          break;
        case 'ArrowLeft':
          this.map.panBy([-100, 0]);
          break;
        case 'ArrowRight':
          this.map.panBy([100, 0]);
          break;
        case 'r':
        case 'R':
          this.map.resetNorth();
          this.systemStatusMsg.set('RESET NORTH');
          break;
        case 'f':
        case 'F':
          this.map.fitBounds(this.map.getBounds(), { padding: 50 });
          this.systemStatusMsg.set('FIT BOUNDS');
          break;
      }
    });
  }

  private toLatLng(value: maplibregl.LngLatLike | maplibregl.LngLat): LatLng {
    if (Array.isArray(value)) {
      return { lat: value[1], lng: value[0] };
    }
    if ('lng' in value && typeof value.lng === 'number') {
      return { lat: value.lat, lng: value.lng };
    }
    return { lat: value.lat, lng: 'lon' in value ? value.lon : value.lng };
  }

  private createMarkerElement(cssClass: string, label?: string): HTMLElement {
    const element = document.createElement('div');
    element.className = cssClass;
    if (label) {
      element.textContent = label;
    }
    return element;
  }

  private createPopup(html: string) {
    return new maplibregl.Popup({ offset: 20 }).setHTML(html);
  }

  private getMarkerPosition(marker?: MarkerRecord): LatLng | undefined {
    if (!marker) {
      return undefined;
    }
    const pos = marker.marker.getLngLat();
    return { lat: pos.lat, lng: pos.lng };
  }

  private createDraggableMarker(latlng: LatLng, cssClass: string, popupHtml: string, onDragEnd?: (() => void)): MarkerRecord {
    const element = this.createMarkerElement(cssClass);
    const marker = new maplibregl.Marker({ element, draggable: !!onDragEnd && !this.isOfflineSessionActive() })
      .setLngLat([latlng.lng, latlng.lat])
      .addTo(this.map);

    const popup = this.createPopup(popupHtml);
    marker.setPopup(popup).togglePopup();

    if (onDragEnd) {
      marker.on('dragend', () => {
        onDragEnd();
      });
    }

    return { marker, popup };
  }

  private addRouteLine(coordinates: LatLng[], color: string, width: number, opacity: number, dashArray?: string, label = ''): RouteDef {
    const id = `route-${this.nextLayerId++}`;
    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;
    const casingLayerId = `layer-${id}-casing`;
    const glowLayerId = `layer-${id}-glow`;
    const lineCoordinates = coordinates.map((coord) => [coord.lng, coord.lat] as [number, number]);

    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getLayer(casingLayerId)) {
      this.map.removeLayer(casingLayerId);
    }
    if (this.map.getLayer(glowLayerId)) {
      this.map.removeLayer(glowLayerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoordinates
        }
      }
    });

    // Determine casing color based on route color for better visual harmony
    const casingColor = this.getCasingColor(color);

    // Add glow layer for enhanced visibility
    this.map.addLayer({
      id: glowLayerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': width + 8,
        'line-opacity': opacity * 0.15,
        'line-blur': 3
      }
    });

    // Add casing layer behind the main line to create a high-contrast outline
    this.map.addLayer({
      id: casingLayerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': casingColor,
        'line-width': width + 4,
        'line-opacity': opacity * 0.95
      }
    });

    // Add main route line
    this.map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': width,
        'line-opacity': opacity,
        'line-dasharray': dashArray ? dashArray.split(',').map((value) => Number(value.trim())) : [1, 0]
      }
    });

    const route: RouteDef = { id, sourceId, layerId, coordinates, color, width, opacity, dashArray, label };
    this.routes.push(route);
    return route;
  }

  private getCasingColor(routeColor: string): string {
    // Return a darker, complementary casing color for each route color
    const colorMap: { [key: string]: string } = {
      '#ff4444': '#2a0a0a', // Red -> Dark red
      '#00d4ff': '#0a2a3a', // Cyan -> Dark cyan
      '#ff9500': '#3a2a0a', // Orange -> Dark orange
      '#9acd32': '#1a2a0a', // Green -> Dark green
      '#ffd700': '#2a2a0a'  // Gold -> Dark gold
    };
    return colorMap[routeColor] || '#070a07';
  }

  private clearRoutes() {
    this.routes.forEach((route) => {
      const casingLayerId = `${route.layerId}-casing`;
      const glowLayerId = `${route.layerId}-glow`;
      if (this.map.getLayer(route.layerId)) {
        this.map.removeLayer(route.layerId);
      }
      if (this.map.getLayer(casingLayerId)) {
        this.map.removeLayer(casingLayerId);
      }
      if (this.map.getLayer(glowLayerId)) {
        this.map.removeLayer(glowLayerId);
      }
      if (this.map.getSource(route.sourceId)) {
        this.map.removeSource(route.sourceId);
      }
    });
    this.routes = [];
  }

  private redrawRoutes() {
    if (!this.map) {
      return;
    }
    const savedRoutes = [...this.routes];
    this.routes = [];
    savedRoutes.forEach((route) => {
      this.addRouteLine(route.coordinates, route.color, route.width, route.opacity, route.dashArray, route.label);
    });
    this.selectRouteOption(this.selectedRouteIndex());
  }

  private executeWhenMapReady(callback: () => void) {
    if (!this.map) return;
    if (this.map.isStyleLoaded()) {
      callback();
    } else {
      const onLoad = () => {
        callback();
        this.map.off('styledata', onLoad);
      };
      this.map.on('styledata', onLoad);
    }
  }

  private restoreOfflineCache() {
    const cached = localStorage.getItem('paktak_offline_cache');
    if (!cached || !this.map) {
      return;
    }

    try {
      const cache = JSON.parse(cached);
      if (cache.startPoint && cache.hitPoint) {
        this.isOfflineSessionActive.set(true);
        
        // Clean up current active map state before restoring
        if (this.startMarker) {
          this.startMarker.marker.remove();
          this.startMarker = undefined;
        }
        if (this.endMarker) {
          this.endMarker.marker.remove();
          this.endMarker = undefined;
        }
        this.waypointMarkers.forEach((record) => record.marker.remove());
        this.waypointMarkers = [];
        this.waypoints.set([]);
        this.clearRoutes();
        this.clearTerrainOverlays();

        this.systemStatusMsg.set('LOADED RESTORED SECURE MISSION PROFILE FROM OFFLINE CACHE.');
        this.startMarker = this.createDraggableMarker(
          { lat: cache.startPoint.lat, lng: cache.startPoint.lng },
          'map-marker map-marker--start',
          'START POINT (OFFLINE RESTORED)',
          () => this.updateRoute()
        );

        this.endMarker = this.createDraggableMarker(
          { lat: cache.hitPoint.lat, lng: cache.hitPoint.lng },
          'map-marker map-marker--end',
          'TARGET POINT (OFFLINE RESTORED)',
          () => this.updateRoute()
        );

        this.currentLat.set(cache.startPoint.lat.toFixed(4) + '° N');
        this.currentLng.set(cache.startPoint.lng.toFixed(4) + '° E');
        this.targetLat.set(cache.hitPoint.lat.toFixed(4) + '° N');
        this.targetLng.set(cache.hitPoint.lng.toFixed(4) + '° E');

        // Get location names for restored session
        this.currentLocationName.set('Locating...');
        this.targetLocationName.set('Locating...');
        this.reverseGeocode(cache.startPoint.lat, cache.startPoint.lng).then(locationName => {
          this.currentLocationName.set(locationName);
        });
        this.reverseGeocode(cache.hitPoint.lat, cache.hitPoint.lng).then(locationName => {
          this.targetLocationName.set(locationName);
        });

        this.updateBearingAndDistance();

        if (Array.isArray(cache.waypoints)) {
          cache.waypoints.forEach((wp: any) => this.restoreWaypoint(wp));
        }

        if (Array.isArray(cache.routeOptions)) {
          this.routeOptions.set(cache.routeOptions);
          this.selectedRouteIndex.set(cache.selectedRouteIndex || 0);
        }

        this.executeWhenMapReady(() => {
          if (Array.isArray(cache.routes)) {
            this.clearRoutes();
            cache.routes.forEach((route: any) => {
              if (Array.isArray(route.coords)) {
                this.addRouteLine(
                  route.coords.map((coord: any) => ({ lat: coord[0], lng: coord[1] })),
                  route.color || '#ffd700',
                  route.weight || 4,
                  route.opacity || 0.8,
                  route.dashArray,
                  route.tooltipText || 'RESTORED ROUTE'
                );
              }
            });
            this.selectRouteOption(this.selectedRouteIndex());
          }

          if (cache.lastTerrainFeatures) {
            this.lastTerrainFeatures = cache.lastTerrainFeatures;
            this.drawTerrainOverlays(this.lastTerrainFeatures);
          }
        });

        if (cache.offlineBounds) {
          const bounds = new maplibregl.LngLatBounds(
            [cache.offlineBounds.southWest.lng, cache.offlineBounds.southWest.lat],
            [cache.offlineBounds.northEast.lng, cache.offlineBounds.northEast.lat]
          );
          this.map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
          this.map.setMaxBounds(bounds);
        }
      }
    } catch (error) {
      console.warn('Failed to restore offline cache:', error);
    }
  }

  public initiateSystemAccess() {
    this.authScreen.set('REGISTER');
    this.authError.set('');
    this.authSuccess.set('');
  }

  public switchToLogin() {
    this.authScreen.set('LOGIN');
    this.authError.set('');
    this.authSuccess.set('');
  }

  public switchToRegister() {
    this.authScreen.set('REGISTER');
    this.authError.set('');
    this.authSuccess.set('');
  }

  public registerUser() {
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

  public loginUser() {
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

        // Ensure a fresh session: discard any in-memory markers/target/waypoints/
        // routes left over from a previous login so only the live GPS start shows.
        this.resetMissionState();

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

  public logoutUser() {
    this.isAuthenticated.set(false);
    this.authScreen.set('SPLASH');
    this.currentUser.set(null);
    this.loginUsername = '';
    this.loginPassword = '';
    this.regUsername = '';
    this.regPassword = '';
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    if (this.journeyWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.journeyWatchId);
      this.journeyWatchId = undefined;
    }
    if (this.map) {
      this.map.remove();
    }
  }

  public saveMissionCodeName() {
    localStorage.setItem('paktak_mission_code', this.missionBriefing.codeName);
    this.systemStatusMsg.set('MISSION CODE NAME SAVED');
  }

  private async analyzeTerrainFeatures(start: LatLng, end: LatLng) {
    const latDiff = Math.abs(end.lat - start.lat);
    const elevationGain = `${(latDiff * 111).toFixed(0)} m`;

    this.terrainAnalysis.set({
      forestDensity: 'Scanning terrain...',
      elevationGain,
      waterObstacles: 'Scanning...'
    });

    const requestToken = ++this.terrainRequestToken;

    try {
      const collection = await this.fetchTerrainFeatures(start, end);
      if (requestToken !== this.terrainRequestToken) {
        return;
      }

      this.lastTerrainFeatures = collection;
      this.drawTerrainOverlays(collection);

      const waterCount = collection.features.filter(
        (f: any) => f.properties.category === 'water'
      ).length;
      const forestCount = collection.features.filter(
        (f: any) => f.properties.category === 'forest'
      ).length;

      this.terrainAnalysis.set({
        forestDensity: forestCount === 0
          ? 'No significant cover'
          : forestCount > 8 ? `Dense cover (${forestCount} zones)` : `Sparse cover (${forestCount} zones)`,
        elevationGain,
        waterObstacles: waterCount === 0
          ? 'None detected'
          : `${waterCount} obstacle(s) on route`
      });
    } catch (error) {
      console.warn('Terrain feature service unavailable:', error);
      if (requestToken !== this.terrainRequestToken) {
        return;
      }
      this.terrainAnalysis.set({
        forestDensity: 'Terrain scan offline',
        elevationGain,
        waterObstacles: 'Terrain scan offline'
      });
    }
  }

  private async fetchTerrainFeatures(start: LatLng, end: LatLng): Promise<any> {
    // Build a bounding box around the start->target corridor with optimized padding.
    const distance = this.computeDistance(start, end);
    const pad = Math.min(0.02, distance * 0.15); // Adaptive padding based on route length
    const south = Math.min(start.lat, end.lat) - pad;
    const north = Math.max(start.lat, end.lat) + pad;
    const west = Math.min(start.lng, end.lng) - pad;
    const east = Math.max(start.lng, end.lng) + pad;

    // Guard against excessively large bounding boxes (heavy Overpass queries).
    if (north - south > 1.2 || east - west > 1.2) {
      throw new Error('Route corridor too large for terrain scan');
    }

    const bbox = `${south},${west},${north},${east}`;
    
    // Optimized query with better performance and accuracy
    const query = `[out:json][timeout:15];(` +
      // Water features - consolidated for faster execution
      `way["natural"~"water|lake|wetland|pond"](${bbox});` +
      `relation["natural"~"water|lake|wetland|pond"](${bbox});` +
      `way["waterway"~"river|stream|canal|drain|ditch"](${bbox});` +
      `relation["waterway"~"river"](${bbox});` +
      `way["landuse"~"reservoir|basin|water|pond"](${bbox});` +
      `relation["landuse"~"reservoir|basin|water"](${bbox});` +
      // Forest features
      `way["landuse"="forest"](${bbox});` +
      `way["natural"="wood"](${bbox});` +
      `relation["landuse"="forest"](${bbox});` +
      `relation["natural"="wood"](${bbox});` +
      `);out geom;`;

    const data = await this.queryOverpass(query);
    return this.overpassToGeoJSON(data);
  }

  // Public Overpass mirrors. The default endpoint rate-limits aggressively, so we
  // try several in turn to make terrain highlighting reliable.
  private overpassEndpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.private.coffee/api/interpreter'
  ];

  private async queryOverpass(query: string): Promise<any> {
    let lastError: unknown;
    // Try endpoints in order of reliability and speed
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.private.coffee/api/interpreter'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout per endpoint
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          lastError = new Error(`Overpass HTTP ${response.status} @ ${endpoint}`);
          continue;
        }
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error('All Overpass endpoints failed');
  }

  private overpassToGeoJSON(data: any): any {
    const features: any[] = [];

    const classify = (tags: any): 'water' | 'forest' | null => {
      if (!tags) {
        return null;
      }
      if (
        tags.natural === 'water' ||
        tags.natural === 'wetland' ||
        tags.natural === 'lake' ||
        tags.natural === 'pond' ||
        tags.waterway ||
        tags.water ||
        tags.landuse === 'reservoir' ||
        tags.landuse === 'basin' ||
        tags.landuse === 'pond' ||
        tags.landuse === 'salt_pond'
      ) {
        return 'water';
      }
      if (tags.landuse === 'forest' || tags.natural === 'wood') {
        return 'forest';
      }
      return null;
    };

    const ringFromGeometry = (geometry: any[]): number[][] =>
      geometry.filter((p) => p && typeof p.lat === 'number')
        .map((p) => [p.lon, p.lat]);

    const isClosedRing = (ring: number[][]): boolean =>
      ring.length > 3 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1];

    // Approximate planar area (km²) of a closed ring.
    const ringAreaKm2 = (ring: number[][]): number => {
      if (ring.length < 4) {
        return 0;
      }
      const midLat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
      const mPerDegLat = 110574;
      const mPerDegLng = 111320 * Math.cos(midLat * Math.PI / 180);
      let area = 0;
      for (let i = 0; i < ring.length - 1; i += 1) {
        const x1 = ring[i][0] * mPerDegLng;
        const y1 = ring[i][1] * mPerDegLat;
        const x2 = ring[i + 1][0] * mPerDegLng;
        const y2 = ring[i + 1][1] * mPerDegLat;
        area += (x1 * y2) - (x2 * y1);
      }
      return Math.abs(area / 2) / 1e6;
    };

    // Total length (km) of a line in [lng,lat] pairs.
    const lineLengthKm = (line: number[][]): number => {
      let total = 0;
      for (let i = 1; i < line.length; i += 1) {
        total += this.computeDistance(
          { lat: line[i - 1][1], lng: line[i - 1][0] },
          { lat: line[i][1], lng: line[i][0] }
        );
      }
      return total;
    };

    const waterTypeLabel = (tags: any): string => {
      if (tags?.natural === 'lake' || tags?.water === 'lake') {
        return 'TACTICAL LAKE';
      }
      if (tags?.natural === 'water' && tags?.water === 'reservoir') {
        return 'SECURE RESERVOIR';
      }
      if (tags?.water) {
        return `${tags.water.toUpperCase()} BODY`;
      }
      if (tags?.landuse === 'reservoir') {
        return 'RESERVOIR';
      }
      if (tags?.landuse === 'basin') {
        return 'BASIN OBSTACLE';
      }
      if (tags?.natural === 'wetland') {
        return 'WETLAND OBSTACLE';
      }
      if (tags?.waterway) {
        return tags.waterway.toUpperCase();
      }
      return 'LAKE / WATER OBSTACLE';
    };

    const buildProperties = (
      category: 'water' | 'forest',
      tags: any,
      areaKm2: number,
      lengthKm: number,
      isLine: boolean
    ) => {
      const name = tags?.name || tags?.['name:en'] || '';
      if (category === 'water') {
        const type = waterTypeLabel(tags);
        if (isLine) {
          // Linear watercourse: range = length, density = flow significance.
          const density = lengthKm > 5 ? 'Major (high volume)'
            : lengthKm > 1 ? 'Moderate (steady flow)'
            : 'Minor (low flow)';
          return {
            category,
            name: name || 'Unnamed watercourse',
            featureType: type,
            rangeText: `${lengthKm.toFixed(2)} km long`,
            detail: density,
            areaText: '--'
          };
        }
        // Lake / reservoir / pond: range = surface area, density = crossing severity.
        const sizeClass = areaKm2 > 5 ? 'Large lake / reservoir'
          : areaKm2 > 0.5 ? 'Medium water body'
          : areaKm2 > 0.05 ? 'Small pond'
          : 'Minor pool';
        const density = areaKm2 > 0.5 ? 'Impassable (route around)'
          : areaKm2 > 0.05 ? 'Difficult crossing'
          : 'Shallow / fordable';
        const widthKm = Math.sqrt(areaKm2);
        
        const labelName = name 
          ? name 
          : type.includes('LAKE') ? 'Unnamed Lake'
          : type.includes('RESERVOIR') ? 'Unnamed Reservoir'
          : type.includes('WETLAND') ? 'Unnamed Wetland'
          : type.includes('BASIN') ? 'Unnamed Basin'
          : 'Unnamed Lake / Water Obstacle';

        return {
          category,
          name: labelName,
          featureType: type,
          rangeText: `${areaKm2.toFixed(2)} km² (~${(widthKm * 1000).toFixed(0)} m across)`,
          detail: `${sizeClass} | ${density}`,
          areaText: `${areaKm2.toFixed(2)} km²`
        };
      }
      // forest
      const leaf = tags?.leaf_type ? `${tags.leaf_type} canopy` : 'Mixed canopy';
      const density = areaKm2 > 1 ? 'Dense (high concealment)'
        : areaKm2 > 0.2 ? 'Moderate (partial concealment)'
        : 'Sparse (low concealment)';
      return {
        category,
        name: name || 'Unnamed wooded area',
        featureType: tags?.landuse === 'forest' ? 'MANAGED FOREST' : 'NATURAL WOODLAND',
        rangeText: `${areaKm2.toFixed(2)} km²`,
        detail: `${density} | ${leaf}`,
        areaText: `${areaKm2.toFixed(2)} km²`
      };
    };

    const pushPolygon = (category: 'water' | 'forest', tags: any, ring: number[][]) => {
      const areaKm2 = ringAreaKm2(ring);
      features.push({
        type: 'Feature',
        properties: buildProperties(category, tags, areaKm2, 0, false),
        geometry: { type: 'Polygon', coordinates: [ring] }
      });
    };

    const pushLine = (category: 'water' | 'forest', tags: any, line: number[][]) => {
      const lengthKm = lineLengthKm(line);
      features.push({
        type: 'Feature',
        properties: buildProperties(category, tags, 0, lengthKm, true),
        geometry: { type: 'LineString', coordinates: line }
      });
    };

    // Stitch a relation's outer members into closed rings so lakes render filled.
    const assembleOuterRings = (members: any[]): number[][][] => {
      const segments = members
        .filter((m) => (m.role === 'outer' || !m.role) && Array.isArray(m.geometry))
        .map((m) => ringFromGeometry(m.geometry))
        .filter((seg) => seg.length >= 2);

      const rings: number[][][] = [];
      const remaining = [...segments];

      while (remaining.length > 0) {
        let current = remaining.shift()!.slice();
        let extended = true;
        while (extended && !isClosedRing(current)) {
          extended = false;
          for (let i = 0; i < remaining.length; i += 1) {
            const seg = remaining[i];
            const end = current[current.length - 1];
            const segStart = seg[0];
            const segEnd = seg[seg.length - 1];
            if (segStart[0] === end[0] && segStart[1] === end[1]) {
              current = current.concat(seg.slice(1));
              remaining.splice(i, 1);
              extended = true;
              break;
            }
            if (segEnd[0] === end[0] && segEnd[1] === end[1]) {
              current = current.concat(seg.slice().reverse().slice(1));
              remaining.splice(i, 1);
              extended = true;
              break;
            }
          }
        }
        if (current.length >= 4) {
          if (!isClosedRing(current)) {
            current.push(current[0]);
          }
          rings.push(current);
        }
      }
      return rings;
    };

    (data.elements || []).forEach((element: any) => {
      const category = classify(element.tags);
      if (!category) {
        return;
      }

      if (element.type === 'way' && Array.isArray(element.geometry)) {
        const coords = ringFromGeometry(element.geometry);
        if (coords.length < 2) {
          return;
        }
        if (isClosedRing(coords)) {
          pushPolygon(category, element.tags, coords);
        } else {
          pushLine(category, element.tags, coords);
        }
      } else if (element.type === 'relation' && Array.isArray(element.members)) {
        const isArea = category === 'water'
          ? !element.tags?.waterway || element.tags?.waterway === 'riverbank'
          : true;

        if (isArea) {
          const rings = assembleOuterRings(element.members);
          if (rings.length > 0) {
            rings.forEach((ring) => pushPolygon(category, element.tags, ring));
          } else {
            element.members.forEach((member: any) => {
              if (Array.isArray(member.geometry)) {
                const coords = ringFromGeometry(member.geometry);
                if (coords.length >= 2) {
                  pushLine(category, element.tags, coords);
                }
              }
            });
          }
        } else {
          element.members.forEach((member: any) => {
            if (Array.isArray(member.geometry)) {
              const coords = ringFromGeometry(member.geometry);
              if (coords.length >= 2) {
                pushLine(category, element.tags, coords);
              }
            }
          });
        }
      }
    });

    return { type: 'FeatureCollection', features };
  }

  private clearTerrainOverlays() {
    if (!this.map) {
      return;
    }
    this.terrainLayerIds.forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });
    this.terrainSourceIds.forEach((id) => {
      if (this.map.getSource(id)) {
        this.map.removeSource(id);
      }
    });
    this.terrainLayerIds = [];
    this.terrainSourceIds = [];
  }

  private drawTerrainOverlays(collection: any) {
    if (!this.map) {
      return;
    }
    this.clearTerrainOverlays();
    if (!collection || !Array.isArray(collection.features) || collection.features.length === 0) {
      return;
    }

    const waterFeatures = collection.features.filter((f: any) => f.properties.category === 'water');
    const forestFeatures = collection.features.filter((f: any) => f.properties.category === 'forest');

    // Keep terrain overlays beneath the route lines so the plotted path stays visible.
    const beforeId = this.routes.find((route) => this.map.getLayer(route.layerId))?.layerId;

    // Draw forest first so water obstacles render on top.
    this.addTerrainSourceAndLayers('forest', forestFeatures, '#2e8b2e', '#1f5f1f', beforeId);
    this.addTerrainSourceAndLayers('water', waterFeatures, '#1e90ff', '#0b5fb0', beforeId);
  }

  private addTerrainSourceAndLayers(
    category: 'water' | 'forest',
    features: any[],
    fillColor: string,
    lineColor: string,
    beforeId?: string
  ) {
    if (features.length === 0) {
      return;
    }
    const sourceId = `terrain-${category}-source`;
    const fillLayerId = `terrain-${category}-fill`;
    const lineLayerId = `terrain-${category}-line`;

    this.map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features }
    });
    this.terrainSourceIds.push(sourceId);

    this.map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': fillColor,
        'fill-opacity': category === 'water' ? 0.55 : 0.45,
        'fill-outline-color': lineColor
      }
    }, beforeId);
    this.terrainLayerIds.push(fillLayerId);

    this.map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': lineColor,
        'line-width': category === 'water' ? 4 : 2.5,
        'line-opacity': 0.95
      }
    }, beforeId);
    this.terrainLayerIds.push(lineLayerId);

    // Show feature details when the highlighted terrain is clicked.
    this.attachTerrainPopup(fillLayerId, category);
    this.attachTerrainPopup(lineLayerId, category);
  }

  private attachTerrainPopup(layerId: string, category: 'water' | 'forest') {
    this.map.on('click', layerId, (event: any) => {
      const feature = event.features?.[0];
      if (!feature) {
        return;
      }
      const props = feature.properties || {};
      const accent = category === 'water' ? '#5ab4ff' : '#7ed957';
      const title = category === 'water' ? 'WATER OBSTACLE' : 'FOREST ZONE';

      const row = (label: string, value: string) =>
        `<div class="terrain-popup__row">` +
        `<span class="terrain-popup__label">${label}</span>` +
        `<span class="terrain-popup__value">${value || '--'}</span>` +
        `</div>`;

      const rows = category === 'water'
        ? row('Name', props.name) +
          row('Type', props.featureType) +
          row('Range', props.rangeText) +
          row('Density', props.detail) +
          row('Area', props.areaText)
        : row('Name', props.name) +
          row('Type', props.featureType) +
          row('Density', props.detail) +
          row('Area', props.areaText);

      const html = `<div class="terrain-popup">` +
        `<span class="terrain-popup__title" style="color: ${accent}">${title}</span>` +
        `<hr class="terrain-popup__divider">` +
        rows +
        `</div>`;

      new maplibregl.Popup({ offset: 12, maxWidth: '280px' })
        .setLngLat(event.lngLat)
        .setHTML(html)
        .addTo(this.map);
    });

    this.map.on('mouseenter', layerId, () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', layerId, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  private redrawTerrainOverlays() {
    if (this.lastTerrainFeatures) {
      this.drawTerrainOverlays(this.lastTerrainFeatures);
    }
  }

  private updateTime() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour12: false }));
  }

  private locateUser() {
    if (!navigator.geolocation) {
      this.gpsStatus.set('UNAVAILABLE');
      return;
    }

    navigator.geolocation.watchPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      this.updateCurrentPosition(lat, lng, true);
      const latlng = { lat, lng };
      if (this.isOfflineSessionActive()) {
        if (this.journeyActive()) {
          this.updateJourneyPointer(latlng);
        }
        return;
      }

      if (this.startMarker) {
        this.startMarker.marker.setLngLat([lng, lat]);
        this.updateRoute();
      } else if (this.map) {
        this.setStartpoint(latlng, true);
        this.map.flyTo({ center: [lng, lat], zoom: 14 });
        this.systemStatusMsg.set('GPS LOCK ACQUIRED - START POINT SET TO CURRENT LOCATION');
      }
      if (this.journeyActive()) {
        this.updateJourneyPointer(latlng);
      }
    }, (error) => {
      console.error('Geolocation watch error:', error);
      this.gpsStatus.set('ERROR');
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
  }

  private updateCurrentPosition(lat: number, lng: number, locked: boolean) {
    if (locked) {
      this.gpsStatus.set('LOCKED');
    }
    this.currentLatNum = lat;
    this.currentLngNum = lng;
    this.currentLat.set(lat.toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S'));
    this.currentLng.set(lng.toFixed(4) + '° ' + (lng >= 0 ? 'E' : 'W'));
    this.computeSunTimes(lat, lng);
    
    // Get location name via reverse geocoding
    this.currentLocationName.set('Locating...');
    this.reverseGeocode(lat, lng).then(locationName => {
      this.currentLocationName.set(locationName);
    });
  }

  public selectRouteOption(idx: number) {
    this.selectedRouteIndex.set(idx);
    this.routes.forEach((route, index) => {
      const casingLayerId = `${route.layerId}-casing`;
      const glowLayerId = `${route.layerId}-glow`;
      if (this.map.getLayer(route.layerId)) {
        const isSelected = index === idx;
        const mainWidth = isSelected ? 8 : 4.5;
        const mainOpacity = isSelected ? 0.95 : 0.55;

        this.map.setPaintProperty(route.layerId, 'line-width', mainWidth);
        this.map.setPaintProperty(route.layerId, 'line-opacity', mainOpacity);

        if (this.map.getLayer(casingLayerId)) {
          this.map.setPaintProperty(casingLayerId, 'line-width', mainWidth + 3);
          this.map.setPaintProperty(casingLayerId, 'line-opacity', mainOpacity * 0.9);
        }

        if (this.map.getLayer(glowLayerId)) {
          this.map.setPaintProperty(glowLayerId, 'line-width', mainWidth + 8);
          this.map.setPaintProperty(glowLayerId, 'line-opacity', isSelected ? mainOpacity * 0.25 : mainOpacity * 0.1);
        }

        if (isSelected) {
          if (this.map.getLayer(glowLayerId)) {
            this.map.moveLayer(glowLayerId);
          }
          if (this.map.getLayer(casingLayerId)) {
            this.map.moveLayer(casingLayerId);
          }
          this.map.moveLayer(route.layerId);
        }
      }
    });
    this.updateSelectedRouteCoordinates();
    this.systemStatusMsg.set(`TACTICAL PATH MODIFIED: SELECTED OPTION ${String.fromCharCode(65 + idx)}`);
  }

  public setInteractionMode(mode: 'START' | 'HIT' | 'WAYPOINT') {
    this.interactionMode.set(mode);
    const modeLabel = mode === 'START' ? 'START POINT' : mode === 'HIT' ? 'TARGET POINT' : 'WAYPOINT';
    this.systemStatusMsg.set(`INTERACTION MODE CHANGED: SET ${modeLabel}`);
    if (mode === 'WAYPOINT') {
      this.waypointsVisible = true;
      this.redrawWaypoints();
    }
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  public addWaypoint(latlng: LatLng) {
    const waypointNumber = this.waypoints().length + 1;
    const waypoint = {
      id: `WP-${waypointNumber.toString().padStart(2, '0')}`,
      name: `Waypoint ${waypointNumber}`,
      lat: latlng.lat,
      lng: latlng.lng,
      marker: undefined
    };

    this.waypoints.update((list) => [...list, waypoint]);
    this.waypointsVisible = true;
    this.redrawWaypoints();
    this.systemStatusMsg.set(`WAYPOINT ${waypoint.id} ADDED`);
    this.updateRoute();
  }

  public removeWaypoint(index: number) {
    const waypoint = this.waypoints()[index];
    if (!waypoint) {
      return;
    }
    if (waypoint.marker) {
      waypoint.marker.marker.remove();
    }
    const newWaypoints = this.waypoints().filter((_, idx) => idx !== index).map((wp, idx) => ({
      ...wp,
      id: `WP-${(idx + 1).toString().padStart(2, '0')}`,
      name: `Waypoint ${idx + 1}`
    }));

    this.waypoints.set(newWaypoints);
    this.redrawWaypoints();
    this.systemStatusMsg.set(`WAYPOINT ${waypoint.id} REMOVED`);
    this.updateRoute();
  }

  private restoreWaypoint(waypointData: any) {
    const waypoint = {
      id: waypointData.id || `WP-${(this.waypoints().length + 1).toString().padStart(2, '0')}`,
      name: waypointData.name || `Waypoint ${this.waypoints().length + 1}`,
      lat: waypointData.lat,
      lng: waypointData.lng,
      marker: undefined
    };

    this.waypoints.update((list) => [...list, waypoint]);
  }

  public getDistanceFromStart(lat: number, lng: number): string {
    const start = this.getMarkerPosition(this.startMarker);
    if (!start) {
      return '--';
    }
    const distanceKm = this.computeDistance(start, { lat, lng });
    return `${distanceKm.toFixed(2)} km`;
  }

  public getWaypointSegmentDistance(index: number): string {
    const waypoints = this.waypoints();
    if (index < 0 || index >= waypoints.length) {
      return '--';
    }
    const waypoint = waypoints[index];
    if (index === 0) {
      return this.getDistanceFromStart(waypoint.lat, waypoint.lng);
    }
    const previous = waypoints[index - 1];
    const distanceKm = this.computeDistance(
      { lat: previous.lat, lng: previous.lng },
      { lat: waypoint.lat, lng: waypoint.lng }
    );
    return `${distanceKm.toFixed(2)} km`;
  }

  public getWaypointSegmentLabel(index: number): string {
    if (index === 0) {
      return 'Start → Waypoint';
    }
    return `Waypoint ${(index).toString().padStart(2, '0')} → Waypoint ${(index + 1).toString().padStart(2, '0')}`;
  }

  private computeDistance(a: LatLng, b: LatLng): number {
    const earthRadius = 6371e3;
    const φ1 = a.lat * Math.PI / 180;
    const φ2 = b.lat * Math.PI / 180;
    const Δφ = (b.lat - a.lat) * Math.PI / 180;
    const Δλ = (b.lng - a.lng) * Math.PI / 180;
    const sinΔφ = Math.sin(Δφ / 2);
    const sinΔλ = Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(
      Math.sqrt(sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ),
      Math.sqrt(1 - sinΔφ * sinΔφ - Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ)
    );
    return (earthRadius * c) / 1000;
  }

  private computeTotalDistance(points: LatLng[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += this.computeDistance(points[i - 1], points[i]);
    }
    return total;
  }

  private interpolateLatLng(p0: LatLng, p1: LatLng, p2: LatLng, p3: LatLng, t: number): LatLng {
    // Catmull-Rom spline interpolation for smooth curves
    const t2 = t * t;
    const t3 = t2 * t;
    const q = 0.5 * (
      (2 * p1.lat) +
      (-p0.lat + p2.lat) * t +
      (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
      (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3
    );
    const w = 0.5 * (
      (2 * p1.lng) +
      (-p0.lng + p2.lng) * t +
      (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 +
      (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3
    );
    return { lat: q, lng: w };
  }

  private generateSmoothCurve(controlPoints: LatLng[], segments: number = 10): LatLng[] {
    if (controlPoints.length < 2) return controlPoints;
    const result: LatLng[] = [];
    const n = controlPoints.length - 1;

    for (let i = 0; i < n; i += 1) {
      const p0 = controlPoints[Math.max(i - 1, 0)];
      const p1 = controlPoints[i];
      const p2 = controlPoints[Math.min(i + 1, n)];
      const p3 = controlPoints[Math.min(i + 2, n)];

      for (let j = 0; j < segments; j += 1) {
        const t = j / segments;
        result.push(this.interpolateLatLng(p0, p1, p2, p3, t));
      }
    }
    result.push(controlPoints[n]);
    return result;
  }

  public redrawWaypoints() {
    if (!this.map) {
      return;
    }

    this.waypointMarkers.forEach((record) => record.marker.remove());
    this.waypointMarkers = [];

    if (!this.waypointsVisible) {
      return;
    }

    this.waypoints().forEach((waypoint) => {
      const marker = this.createDraggableMarker(
        { lat: waypoint.lat, lng: waypoint.lng },
        'map-marker map-marker--waypoint',
        waypoint.id,
        () => {
          const pos = this.getMarkerPosition(waypoint.marker);
          if (pos) {
            waypoint.lat = pos.lat;
            waypoint.lng = pos.lng;
            this.systemStatusMsg.set(`${waypoint.id} MOVED TO ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
            this.updateRoute();
          }
        }
      );
      waypoint.marker = marker;
      this.waypointMarkers.push(marker);
    });
  }

  private buildOfflineBounds(): maplibregl.LngLatBounds {
    const start = this.getMarkerPosition(this.startMarker);
    const end = this.getMarkerPosition(this.endMarker);
    if (!start || !end) {
      return new maplibregl.LngLatBounds([0, 0], [0, 0]);
    }

    const points = [start, end, ...this.waypoints().map((wp) => ({ lat: wp.lat, lng: wp.lng }))];
    // Include all coordinates of the computed routes to make sure we cache the actual pathways
    this.routes.forEach((route) => {
      points.push(...route.coordinates);
    });
    return this.buildBounds(points);
  }

  private buildBounds(points: LatLng[]) {
    const lngValues = points.map((point) => point.lng);
    const latValues = points.map((point) => point.lat);
    const minLng = Math.min(...lngValues);
    const maxLng = Math.max(...lngValues);
    const minLat = Math.min(...latValues);
    const maxLat = Math.max(...latValues);
    return new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  }

  private padBounds(bounds: maplibregl.LngLatBounds, paddingFactor = 0.1) {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const lngDiff = ne.lng - sw.lng;
    const latDiff = ne.lat - sw.lat;
    return new maplibregl.LngLatBounds(
      [sw.lng - lngDiff * paddingFactor, sw.lat - latDiff * paddingFactor],
      [ne.lng + lngDiff * paddingFactor, ne.lat + latDiff * paddingFactor]
    );
  }

  private getRoutePointList(start: LatLng, end: LatLng) {
    const points = [start];
    this.waypoints().forEach((waypoint) => points.push({ lat: waypoint.lat, lng: waypoint.lng }));
    points.push(end);
    return points;
  }

  private buildOsrmWaypoints(start: LatLng, end: LatLng) {
    return this.getRoutePointList(start, end)
      .map((point) => `${point.lng},${point.lat}`)
      .join(';');
  }

  private computeFlankPoint(start: LatLng, end: LatLng, factor: number, left: boolean) {
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const perpX = -latDiff; // Correct perpendicular direction (dx, dy) -> (-dy, dx)
    const perpY = lngDiff;
    const length = Math.sqrt(perpX * perpX + perpY * perpY);
    if (length === 0) {
      return { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 };
    }
    const normX = perpX / length;
    const normY = perpY / length;
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    const offset = factor * Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const direction = left ? 1 : -1;
    return {
      lat: midLat + normY * offset * direction,
      lng: midLng + normX * offset * direction
    };
  }

  private computeSmartFlankPoint(start: LatLng, end: LatLng, factor: number, left: boolean, waypointIndex: number = 0) {
    // Create more realistic alternative routes by:
    // 1. Using different offset positions along the route (not just midpoint)
    // 2. Varying the offset distance based on route length
    // 3. Considering terrain-aware positioning
    const totalDistance = this.computeDistance(start, end);
    const segmentPosition = 0.3 + (waypointIndex * 0.2); // 30%, 50%, 70% along route
    
    const latDiff = end.lat - start.lat;
    const lngDiff = end.lng - start.lng;
    const perpX = -latDiff;
    const perpY = lngDiff;
    const length = Math.sqrt(perpX * perpX + perpY * perpY);
    
    if (length === 0) {
      return { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 };
    }
    
    const normX = perpX / length;
    const normY = perpY / length;
    
    // Position the flank point at different segments along the route
    const pointLat = start.lat + latDiff * segmentPosition;
    const pointLng = start.lng + lngDiff * segmentPosition;
    
    // Adjust offset based on total distance (longer routes get wider offsets)
    const adjustedFactor = factor * Math.min(1.5, Math.max(0.8, totalDistance / 10));
    const offset = adjustedFactor * Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    const direction = left ? 1 : -1;
    
    return {
      lat: pointLat + normY * offset * direction,
      lng: pointLng + normX * offset * direction
    };
  }

  private flattenLatLngs(latlngs: any): LatLng[] {
    if (!latlngs) {
      return [];
    }
    if (Array.isArray(latlngs) && typeof latlngs[0] === 'object' && 'lat' in latlngs[0]) {
      return latlngs as LatLng[];
    }
    return [];
  }

  private updateSelectedRouteCoordinates() {
    const selectedIndex = this.selectedRouteIndex();
    const selectedRoute = this.routes[selectedIndex];
    if (selectedRoute) {
      this.selectedRouteCoordinates = [...selectedRoute.coordinates];
    } else {
      this.selectedRouteCoordinates = [];
    }
  }

  public clearMapBoundsConstraint() {
    this.isOfflineSessionActive.set(false);
    if (this.map) {
      this.map.setMaxBounds(null);
    }
  }

  public goBackToOnline() {
    this.isOfflineSessionActive.set(false);
    if (this.map) {
      this.map.setMaxBounds(null);
      
      // Clear the target marker so a fresh target can be set
      if (this.endMarker) {
        this.endMarker.marker.remove();
        this.endMarker = undefined;
      }
      this.targetLat.set('--');
      this.targetLng.set('--');
      this.targetLocationName.set('--');
      
      // Clear waypoint markers
      this.waypointMarkers.forEach((record) => record.marker.remove());
      this.waypointMarkers = [];
      this.waypoints.set([]);
      
      // Clear computed paths
      this.clearRoutes();
      this.clearTerrainOverlays();
      this.routeOptions.set([]);
      this.selectedRouteIndex.set(0);
      
      // Rehydrate map to start point if available
      const startPos = this.getMarkerPosition(this.startMarker);
      if (startPos) {
        this.map.flyTo({ center: [startPos.lng, startPos.lat], zoom: 13 });
        this.startMarker?.marker.setDraggable(true);
      } else {
        this.map.flyTo({ center: [73.0479, 33.6844], zoom: 13 });
      }
      
      this.systemStatusMsg.set('ONLINE SATELLITE CHANNELS RESTORED. SELECT NEW TARGET PATHWAY.');
    }
  }

  public setStartpoint(latlng: LatLng, fromGps = false) {
    this.clearMapBoundsConstraint();
    this.currentLatNum = latlng.lat;
    this.currentLngNum = latlng.lng;
    this.currentLat.set(latlng.lat.toFixed(4) + '° ' + (latlng.lat >= 0 ? 'N' : 'S'));
    this.currentLng.set(latlng.lng.toFixed(4) + '° ' + (latlng.lng >= 0 ? 'E' : 'W'));
    this.gpsStatus.set(fromGps ? 'GPS LOCKED' : 'MANUAL LOCK');
    this.computeSunTimes(latlng.lat, latlng.lng);
    this.startPointIsCurrentLocation.set(fromGps);

    const popupContent = this.formatPopupContent(
      'START POSITION LOCKED',
      `<b>LAT:</b> ${latlng.lat.toFixed(4)}<br><b>LNG:</b> ${latlng.lng.toFixed(4)}`
    );

    if (this.startMarker) {
      this.startMarker.marker.setLngLat([latlng.lng, latlng.lat]);
      this.startMarker.popup?.setHTML(popupContent).addTo(this.map);
    } else {
      this.startMarker = this.createDraggableMarker(latlng, 'map-marker map-marker--start', popupContent, () => this.updateRoute());
    }
    this.updateRoute();
  }

  private formatPopupContent(title: string, content: string) {
    return `<div style="font-family: monospace;">` +
      `<b style="color: #9acd32">${title}</b><br>` +
      `<hr style="border-color: #333; margin: 4px 0;">` +
      `${content}` +
      `</div>`;
  }

  public searchLocation(query: string, forceTargetMode?: 'START' | 'HIT' | 'WAYPOINT') {
    if (this.isOfflineSessionActive()) {
      this.systemStatusMsg.set('ERROR: SEARCH UNAVAILABLE IN OFFLINE READ-ONLY STATE');
      return;
    }
    if (!query) {
      return;
    }
    this.systemStatusMsg.set('CONNECTING TO GEOLOCATION DATA SERVICE...');

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const firstResult = data[0];
          const lat = parseFloat(firstResult.lat);
          const lng = parseFloat(firstResult.lon);
          const latlng = { lat, lng };

          this.map.flyTo({ center: [lng, lat], zoom: 14 });
          this.systemStatusMsg.set(`LOCATED: ${firstResult.display_name.toUpperCase().substring(0, 45)}...`);

          const mode = forceTargetMode || this.interactionMode();
          if (mode === 'WAYPOINT') {
            this.addWaypoint(latlng);
          } else if (mode === 'START') {
            this.setStartpoint(latlng, false);
          } else {
            this.setEndpoint(latlng);
          }
        } else {
          this.systemStatusMsg.set('ERROR: LOCATION NOT FOUND');
        }
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 4000);
      })
      .catch((err) => {
        console.error(err);
        this.systemStatusMsg.set('ERROR: GEOLOCATION SERVICE OFFLINE');
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 4000);
      });
  }

  public setEndpoint(latlng: LatLng) {
    this.clearMapBoundsConstraint();
    this.targetLat.set(latlng.lat.toFixed(4) + '° ' + (latlng.lat >= 0 ? 'N' : 'S'));
    this.targetLng.set(latlng.lng.toFixed(4) + '° ' + (latlng.lng >= 0 ? 'E' : 'W'));
    this.computeSunTimes(latlng.lat, latlng.lng);

    // Get target location name via reverse geocoding
    this.targetLocationName.set('Locating...');
    this.reverseGeocode(latlng.lat, latlng.lng).then(locationName => {
      this.targetLocationName.set(locationName);
    });

    const structures = ['Civilian Compound', 'Industrial Facility', 'Communication Tower', 'Open Terrain', 'Abandoned Outpost'];
    const elevations = ['High Ground', 'Valley', 'Flat Terrain', 'Slope'];
    const detailStructure = structures[Math.floor(Math.random() * structures.length)];
    const detailElevation = elevations[Math.floor(Math.random() * elevations.length)];
    const threatLevel = Math.random() > 0.5 ? 'HIGH' : 'MODERATE';
    const popupContent = this.formatPopupContent(
      'TARGET CONFIRMED',
      `<b>Structure:</b> ${detailStructure}<br><b>Terrain:</b> ${detailElevation}<br><b>Threat Level:</b> <span style="color: ${threatLevel === 'HIGH' ? '#ff4444' : '#ffd700'}">${threatLevel}</span><br><button onclick="window.paktakClearTarget()" style="margin-top:8px; width:100%; background:rgba(255,68,68,0.2); border:1px solid #ff4444; color:#ff4444; font-family:sans-serif; font-size:11px; padding:4px 8px; font-weight:bold; cursor:pointer; border-radius:4px;">❌ REMOVE TARGET</button>`
    );

    if (this.endMarker) {
      this.endMarker.marker.setLngLat([latlng.lng, latlng.lat]);
      this.endMarker.popup?.setHTML(popupContent).addTo(this.map);
    } else {
      this.endMarker = this.createDraggableMarker(latlng, 'map-marker map-marker--end', popupContent, () => this.updateRoute());
    }
    this.updateRoute();
  }

  private updateBearingAndDistance() {
    const start = this.getMarkerPosition(this.startMarker);
    const end = this.getMarkerPosition(this.endMarker);
    if (!start || !end) {
      this.bearingValue.set('--');
      this.targetBearingMil.set('--');
      this.targetHeading.set('--');
      this.directDistanceValue.set('--');
      return;
    }

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
    this.bearingValue.set(`${brng.toFixed(0)}° ${cardinal}`);
    this.targetBearingMil.set(`${(brng * 17.7777778).toFixed(0)} mil`);
    this.targetHeading.set(`${cardinal} HEADING`);

    const distanceKm = this.computeDistance(start, end);
    this.directDistanceValue.set(`${distanceKm.toFixed(1)} km`);
  }

  private routeRequestToken = 0;

  public async updateRoute() {
    const start = this.getMarkerPosition(this.startMarker);
    const end = this.getMarkerPosition(this.endMarker);
    if (!start || !end || !this.map) {
      return;
    }

    this.updateBearingAndDistance();

    const waypointPoints = this.waypoints().map((wp) => ({ lat: wp.lat, lng: wp.lng }));
    const requestToken = ++this.routeRequestToken;
    this.systemStatusMsg.set('PLOTTING REAL ROAD ROUTES FROM TACTICAL ROUTING GRID...');

    try {
      const roadRoutes = await this.fetchRoadRoutes(start, waypointPoints, end);
      // Ignore stale responses if a newer request has started.
      if (requestToken !== this.routeRequestToken) {
        return;
      }
      if (roadRoutes.length > 0) {
        if (requestToken !== this.routeRequestToken) {
          return;
        }
        // Ensure we have 3 distinct road routes using via points if needed
        const ensuredRoutes = await this.ensureThreeRoutes(roadRoutes, start, end, waypointPoints);
        if (requestToken !== this.routeRequestToken) {
          return;
        }
        this.renderRoadRoutes(ensuredRoutes);
        this.analyzeTerrainFeatures(start, end);
        return;
      }
    } catch (error) {
      console.warn('Road routing service unavailable, using synthetic fallback:', error);
    }

    if (requestToken !== this.routeRequestToken) {
      return;
    }
    await this.generateFallbackRoutes(start, end);
    if (requestToken !== this.routeRequestToken) {
      return;
    }
    this.systemStatusMsg.set('ROUTING GRID OFFLINE. ESTIMATED TACTICAL PATHS GENERATED.');
    this.analyzeTerrainFeatures(start, end);
  }

  private async fetchRoadRoutes(
    start: LatLng,
    waypoints: LatLng[],
    end: LatLng
  ): Promise<Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }>> {
    const points = [start, ...waypoints, end];
    const lonlats = points.map(p => `${p.lng},${p.lat}`).join('|');
    const routes: Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }> = [];

    // Try multiple routing profiles to get distinct routes
    const profiles = ['car-fast', 'car', 'bike'];
    const promises = profiles.map(async (profile, idx) => {
      try {
        const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=${profile}&alternativeidx=${idx}&format=geojson`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const coords = feature.geometry.coordinates;
          if (coords && coords.length > 1) {
            return {
              coordinates: coords.map((c: [number, number]) => ({ lat: c[1], lng: c[0] })),
              distanceKm: parseFloat(feature.properties['track-length'] || '0') / 1000,
              durationMin: parseFloat(feature.properties['total-time'] || '0') / 60
            };
          }
        }
      } catch (e) {
        console.warn('BRouter fetch failed for profile', profile, e);
      }
      return null;
    });

    const results = await Promise.all(promises);
    for (const res of results) {
      if (res && this.isDistinctRoute(res, routes)) {
        routes.push(res);
      }
    }

    // If we still don't have enough routes, try with different alternative indices
    if (routes.length < 3) {
      const altPromises = [3, 4, 5].map(async (altIdx) => {
        try {
          const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=car-fast&alternativeidx=${altIdx}&format=geojson`;
          const response = await fetch(url);
          if (!response.ok) return null;
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const coords = feature.geometry.coordinates;
            if (coords && coords.length > 1) {
              return {
                coordinates: coords.map((c: [number, number]) => ({ lat: c[1], lng: c[0] })),
                distanceKm: parseFloat(feature.properties['track-length'] || '0') / 1000,
                durationMin: parseFloat(feature.properties['total-time'] || '0') / 60
              };
            }
          }
        } catch (e) {
          console.warn('BRouter fetch failed for alt', altIdx, e);
        }
        return null;
      });

      const altResults = await Promise.all(altPromises);
      for (const res of altResults) {
        if (res && this.isDistinctRoute(res, routes)) {
          routes.push(res);
        }
      }
    }

    if (routes.length === 0) {
      throw new Error(`Routing service returned no usable routes`);
    }

    return routes;
  }

  private async ensureThreeRoutes(
    routes: Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }>,
    start: LatLng,
    end: LatLng,
    waypoints: LatLng[]
  ): Promise<Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }>> {
    const result = [...routes];

    // Smart flank configurations for more geographically sensible alternatives
    // Option B: Moderate left flank (30% along route)
    // Option C: Moderate right flank (50% along route) 
    const flankConfigs = [
      { factor: 0.35, left: true, waypointIndex: 0 },   // Left flank, early segment
      { factor: 0.35, left: false, waypointIndex: 1 },  // Right flank, middle segment
      { factor: 0.25, left: true, waypointIndex: 2 },   // Left flank, later segment
      { factor: 0.25, left: false, waypointIndex: 0 },  // Right flank, early segment
      { factor: 0.45, left: true, waypointIndex: 1 },   // Left flank, middle segment (wider)
      { factor: 0.45, left: false, waypointIndex: 2 }   // Right flank, later segment (wider)
    ];

    let configIndex = 0;
    while (result.length < 3 && configIndex < flankConfigs.length) {
      const cfg = flankConfigs[configIndex++];
      const via = this.computeSmartFlankPoint(start, end, cfg.factor, cfg.left, cfg.waypointIndex);
      try {
        const viaRoute = await this.fetchViaRoadRoute(start, waypoints, via, end);
        if (viaRoute && this.isDistinctRoute(viaRoute, result)) {
          result.push(viaRoute);
        }
      } catch (error) {
        console.warn('Alternate via-route request failed:', error);
      }
    }

    // If we still don't have 3 routes, try with intermediate waypoints at strategic positions
    if (result.length < 3) {
      const strategicPoints = [
        { lat: start.lat + (end.lat - start.lat) * 0.25, lng: start.lng + (end.lng - start.lng) * 0.25 },
        { lat: start.lat + (end.lat - start.lat) * 0.5, lng: start.lng + (end.lng - start.lng) * 0.5 },
        { lat: start.lat + (end.lat - start.lat) * 0.75, lng: start.lng + (end.lng - start.lng) * 0.75 }
      ];
      
      for (const strategicPoint of strategicPoints) {
        try {
          const strategicRoute = await this.fetchViaRoadRoute(start, waypoints, strategicPoint, end);
          if (strategicRoute && this.isDistinctRoute(strategicRoute, result)) {
            result.push(strategicRoute);
            if (result.length >= 3) break;
          }
        } catch (error) {
          console.warn('Strategic route request failed:', error);
        }
      }
    }

    return result;
  }

  private async fetchViaRoadRoute(
    start: LatLng,
    waypoints: LatLng[],
    via: LatLng,
    end: LatLng
  ): Promise<{ coordinates: LatLng[]; distanceKm: number; durationMin: number } | null> {
    const coordString = [start, ...waypoints, via, end]
      .map((point) => `${point.lng},${point.lat}`)
      .join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}` +
      `?overview=full&geometries=geojson&steps=false`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Routing service HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const coordinates = (route.geometry?.coordinates || []).map(
      (coord: [number, number]) => ({ lat: coord[1], lng: coord[0] })
    );
    if (coordinates.length < 2) {
      return null;
    }
    return {
      coordinates,
      distanceKm: (route.distance || 0) / 1000,
      durationMin: (route.duration || 0) / 60
    };
  }

  private async fetchViaRoadRoutesFallback(
    start: LatLng,
    waypoints: LatLng[],
    end: LatLng
  ): Promise<Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }>> {
    const routes: Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }> = [];

    // Try direct route
    try {
      const directRoute = await this.fetchViaRoadRoute(start, waypoints, end, end);
      if (directRoute) {
        routes.push(directRoute);
      }
    } catch (error) {
      console.warn('Direct OSRM route failed:', error);
    }

    // Try with intermediate points for alternatives
    const midPoint = {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2
    };

    try {
      const midRoute = await this.fetchViaRoadRoute(start, waypoints, midPoint, end);
      if (midRoute && this.isDistinctRoute(midRoute, routes)) {
        routes.push(midRoute);
      }
    } catch (error) {
      console.warn('Midpoint OSRM route failed:', error);
    }

    // Try with flank points
    const leftFlank = this.computeFlankPoint(start, end, 0.3, true);
    try {
      const leftRoute = await this.fetchViaRoadRoute(start, waypoints, leftFlank, end);
      if (leftRoute && this.isDistinctRoute(leftRoute, routes)) {
        routes.push(leftRoute);
      }
    } catch (error) {
      console.warn('Left flank OSRM route failed:', error);
    }

    const rightFlank = this.computeFlankPoint(start, end, 0.3, false);
    try {
      const rightRoute = await this.fetchViaRoadRoute(start, waypoints, rightFlank, end);
      if (rightRoute && this.isDistinctRoute(rightRoute, routes)) {
        routes.push(rightRoute);
      }
    } catch (error) {
      console.warn('Right flank OSRM route failed:', error);
    }

    return routes;
  }

  private isDistinctRoute(
    candidate: { coordinates: LatLng[]; distanceKm: number },
    existing: Array<{ coordinates: LatLng[]; distanceKm: number }>
  ): boolean {
    const candidateMid = candidate.coordinates[Math.floor(candidate.coordinates.length / 2)];
    const candidateQuarter = candidate.coordinates[Math.floor(candidate.coordinates.length / 4)];
    const candidateThreeQuarter = candidate.coordinates[Math.floor(candidate.coordinates.length * 3 / 4)];
    
    return existing.every((route) => {
      const distanceDiff = Math.abs(route.distanceKm - candidate.distanceKm);
      const routeMid = route.coordinates[Math.floor(route.coordinates.length / 2)];
      const routeQuarter = route.coordinates[Math.floor(route.coordinates.length / 4)];
      const routeThreeQuarter = route.coordinates[Math.floor(route.coordinates.length * 3 / 4)];
      
      const midpointSeparationKm = this.computeDistance(routeMid, candidateMid);
      const quarterSeparationKm = this.computeDistance(routeQuarter, candidateQuarter);
      const threeQuarterSeparationKm = this.computeDistance(routeThreeQuarter, candidateThreeQuarter);
      
      // More stringent distinctness check using multiple points along the route
      // Route must differ in either distance OR at multiple geometric points
      const avgSeparation = (midpointSeparationKm + quarterSeparationKm + threeQuarterSeparationKm) / 3;
      return distanceDiff > 0.15 || avgSeparation > 0.2;
    });
  }

  private renderRoadRoutes(
    roadRoutes: Array<{ coordinates: LatLng[]; distanceKm: number; durationMin: number }>
  ) {
    this.clearRoutes();

    // Enhanced styling with more distinct colors, patterns, and visual appeal
    const styles = [
      { 
        color: '#ff4444', 
        dash: '1,0', 
        badge: 'PRIMARY', 
        label: 'Option A (Primary Route)',
        width: 5,
        opacity: 0.9,
        casingColor: '#2a0a0a'
      },
      { 
        color: '#00d4ff', 
        dash: '6,4', 
        badge: 'ALTERNATE', 
        label: 'Option B (Scenic Route)',
        width: 4,
        opacity: 0.85,
        casingColor: '#0a2a3a'
      },
      { 
        color: '#ff9500', 
        dash: '3,3', 
        badge: 'ALTERNATE', 
        label: 'Option C (Efficient Route)',
        width: 4,
        opacity: 0.85,
        casingColor: '#3a2a0a'
      }
    ];

    const usableRoutes = roadRoutes.slice(0, styles.length);
    const allPoints: LatLng[] = [];
    const optionResults: any[] = [];

    usableRoutes.forEach((route, index) => {
      const style = styles[index];
      this.addRouteLine(route.coordinates, style.color, style.width, style.opacity, style.dash, style.label);
      allPoints.push(...route.coordinates);
      optionResults.push({
        name: style.label,
        badgeText: style.badge,
        badgeColor: style.color,
        distance: `${route.distanceKm.toFixed(1)} km`,
        eta: `${Math.max(1, Math.round(route.durationMin))} min`
      });
    });

    this.routeOptions.set(optionResults);
    this.selectedRouteIndex.set(0);
    this.selectRouteOption(0);
    this.updateSelectedRouteCoordinates();

    if (allPoints.length > 1) {
      const bounds = this.padBounds(this.buildBounds(allPoints), 0.1);
      this.map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
    }
    this.systemStatusMsg.set(
      `LIVE ROAD ROUTES PLOTTED: ${usableRoutes.length} PATH(S) FOLLOWING REAL TERRAIN ROADS.`
    );
  }

  public async generateFallbackRoutes(start: LatLng, end: LatLng) {
    const waypointPoints = this.waypoints().map((wp) => ({ lat: wp.lat, lng: wp.lng }));

    // Try to get at least some real road routes via OSRM as a fallback
    try {
      const viaRoutes = await this.fetchViaRoadRoutesFallback(start, waypointPoints, end);
      if (viaRoutes.length >= 2) {
        this.renderRoadRoutes(viaRoutes);
        this.systemStatusMsg.set('FALLBACK ROAD ROUTES PLOTTED: USING ALTERNATIVE ROUTING SERVICE.');
        return;
      }
    } catch (error) {
      console.warn('Fallback routing failed, using synthetic routes:', error);
    }

    // Generate synthetic routes as last resort
    const directRoute = this.generateSmoothCurve([start, ...waypointPoints, end], 8);
    const leftFlank1 = this.computeFlankPoint(start, end, 0.35, true);
    const leftFlank2 = this.computeFlankPoint(start, end, 0.22, true);
    const leftRoute = this.generateSmoothCurve([start, leftFlank1, ...waypointPoints, leftFlank2, end], 8);

    const rightFlank1 = this.computeFlankPoint(start, end, 0.35, false);
    const rightFlank2 = this.computeFlankPoint(start, end, 0.22, false);
    const rightRoute = this.generateSmoothCurve([start, rightFlank1, ...waypointPoints, rightFlank2, end], 8);

    this.clearRoutes();
    this.addRouteLine(directRoute, '#ff4444', 4, 0.75, '5,5', 'Option A (Direct Route)');
    this.addRouteLine(leftRoute, '#9acd32', 4, 0.75, '10,10', 'Option B (Left Flank Route)');
    this.addRouteLine(rightRoute, '#ffd700', 4, 0.75, '8,8', 'Option C (Right Flank Route)');

    const distanceA = this.computeTotalDistance(directRoute);
    const distanceB = this.computeTotalDistance(leftRoute);
    const distanceC = this.computeTotalDistance(rightRoute);

    this.routeOptions.set([
      { name: 'Option A (Direct Route)', badgeText: 'DIRECT', badgeColor: '#ff4444', distance: `${distanceA.toFixed(1)} km`, eta: `${Math.round(distanceA * 1.5)} min` },
      { name: 'Option B (Left Flank Route)', badgeText: 'VIABLE', badgeColor: '#9acd32', distance: `${distanceB.toFixed(1)} km`, eta: `${Math.round(distanceB * 1.5)} min` },
      { name: 'Option C (Right Flank Route)', badgeText: 'MODERATE', badgeColor: '#ffd700', distance: `${distanceC.toFixed(1)} km`, eta: `${Math.round(distanceC * 1.5)} min` }
    ]);
    this.selectedRouteIndex.set(1);
    this.selectRouteOption(1);
    const bounds = this.padBounds(this.buildBounds([start, leftFlank1, rightFlank1, ...waypointPoints, end]), 0.15);
    this.map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
  }

  private getRotationAngle(start: LatLng, end: LatLng): number {
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

  public startJourney() {
    if (this.journeyActive()) {
      return;
    }
    if (!navigator.geolocation) {
      this.systemStatusMsg.set('ERROR: GPS UNAVAILABLE. REAL-TIME NAVIGATION CANNOT START.');
      return;
    }

    this.journeyActive.set(true);
    this.systemStatusMsg.set('TACTICAL REAL-TIME NAVIGATION ACTIVE: MONITORING PHYSICAL MOVEMENT...');

    let lastLatLng: LatLng | undefined;
    if (this.currentLatNum !== 0 || this.currentLngNum !== 0) {
      lastLatLng = { lat: this.currentLatNum, lng: this.currentLngNum };
      this.updateJourneyPointer(lastLatLng);
    }

    this.journeyWatchId = navigator.geolocation.watchPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const latlng = { lat, lng };
      this.updateCurrentPosition(lat, lng, true);

      if (this.isOfflineSessionActive()) {
        const maxB = this.map.getMaxBounds();
        if (maxB && !maxB.contains([lng, lat])) {
          this.systemStatusMsg.set('WARNING: GPS POSITION OUTSIDE OFFLINE MAP BOUNDS.');
        } else {
          this.systemStatusMsg.set('NAVIGATING OFFLINE: EN ROUTE...');
        }
      }

      this.updateJourneyPointer(latlng, lastLatLng);

      if (!this.isOfflineSessionActive() && this.startMarker) {
        this.startMarker.marker.setLngLat([lng, lat]);
        this.updateRoute();
      }
      lastLatLng = latlng;
    }, (error) => {
      console.error('Journey geolocation error:', error);
      this.gpsStatus.set('ERROR');
      this.systemStatusMsg.set('ERROR: LIVE GPS NAVIGATION UPLINK FAILED');
      this.stopJourney();
    }, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 15000
    });
  }

  private updateJourneyPointer(latlng: LatLng, lastLatlng?: LatLng) {
    if (!this.map) {
      return;
    }

    const angle = lastLatlng ? this.getRotationAngle(lastLatlng, latlng) : 0;

    if (!this.journeyMarker) {
      this.journeyMarker = {
        marker: new maplibregl.Marker({ element: this.createMarkerElement('map-marker map-marker--journey', '▲'), draggable: false })
          .setLngLat([latlng.lng, latlng.lat])
          .addTo(this.map),
        popup: this.createPopup('TACTICAL JOURNEY VECTOR')
      };
      this.journeyMarker.marker.setPopup(this.journeyMarker.popup).togglePopup();
    } else {
      this.journeyMarker.marker.setLngLat([latlng.lng, latlng.lat]);
    }

    if (!this.journeyPath) {
      this.journeyPath = this.addRouteLine([latlng], '#ffd700', 4, 0.95, undefined, 'Journey Path');
    } else {
      this.journeyPath.coordinates.push(latlng);
      const source = this.map.getSource(this.journeyPath.sourceId) as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: this.journeyPath.coordinates.map((point) => [point.lng, point.lat])
          }
        });
      }
    }

    if (this.isOfflineSessionActive()) {
      const bounds = this.map.getMaxBounds();
      if (bounds && !bounds.contains([latlng.lng, latlng.lat])) {
        return;
      }
    }

    this.map.easeTo({ center: [latlng.lng, latlng.lat], duration: 300 });
  }

  public stopJourney() {
    if (this.journeyWatchId !== undefined) {
      navigator.geolocation.clearWatch(this.journeyWatchId);
      this.journeyWatchId = undefined;
    }
    this.journeyActive.set(false);
    if (this.journeyMarker) {
      this.journeyMarker.marker.remove();
      this.journeyMarker = undefined;
    }
    if (this.journeyPath) {
      if (this.map.getLayer(this.journeyPath.layerId)) {
        this.map.removeLayer(this.journeyPath.layerId);
      }
      if (this.map.getSource(this.journeyPath.sourceId)) {
        this.map.removeSource(this.journeyPath.sourceId);
      }
      this.journeyPath = undefined;
    }
    this.systemStatusMsg.set('JOURNEY STOPPED');
  }

  private computeSunTimes(lat: number, lng: number) {
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

  public showWaterObstacleDetails() {
    if (this.terrainAnalysis().waterObstacles === 'None') {
      return;
    }
    if (this.startMarker && this.endMarker) {
      const start = this.getMarkerPosition(this.startMarker);
      const end = this.getMarkerPosition(this.endMarker);
      if (start && end) {
        const bounds = this.padBounds(this.buildBounds([start, end]), 0.5);
        this.map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
      }
    }
  }

  public triggerSOS() {
    this.systemStatusMsg.set('SOS SIGNAL BROADCASTING... STANDBY');
    const oldStatus = this.gpsStatus();
    this.gpsStatus.set('SOS TRANSMITTING');

    if (this.startMarker) {
      const pos = this.getMarkerPosition(this.startMarker);
      if (pos) {
        const sosMarker = new maplibregl.Marker({ element: this.createMarkerElement('map-marker map-marker--sos', '🔴'), draggable: false })
          .setLngLat([pos.lng, pos.lat])
          .addTo(this.map);
        setTimeout(() => sosMarker.remove(), 3000);
      }
    }

    setTimeout(() => {
      this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE');
      this.gpsStatus.set(oldStatus);
    }, 4000);
  }

  public openComms() {
    this.systemStatusMsg.set('COMMS CHANNEL OPEN. ENCRYPTING DATA...');
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  public toggleWaypoints() {
    this.waypointsVisible = !this.waypointsVisible;
    if (this.waypointsVisible) {
      this.systemStatusMsg.set('WAYPOINTS ACTIVATED');
      this.redrawWaypoints();
    } else {
      this.systemStatusMsg.set('WAYPOINTS DEACTIVATED');
      this.waypointMarkers.forEach((record) => record.marker.remove());
      this.waypointMarkers = [];
    }
    setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
  }

  private lng2tile(lng: number, zoom: number): number {
    return Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  }

  private lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
    );
  }

  private getTileUrlsForCoord(x: number, y: number, z: number, mode: string): string[] {
    const urls: string[] = [];
    if (mode === 'SATELLITE') {
      urls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`);
      urls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`);
    } else if (mode === 'NIGHT') {
      urls.push(`https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`);
    } else {
      // TOPO
      urls.push(`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`);
      urls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`);
    }
    return urls;
  }

  public async offlineSync() {
    const start = this.getMarkerPosition(this.startMarker);
    const end = this.getMarkerPosition(this.endMarker);
    if (!start || !end) {
      this.systemStatusMsg.set('ERROR: START OR TARGET MISSING FOR SYNC');
      setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 3000);
      return;
    }

    this.systemStatusMsg.set('CONNECTING TO TERRAIN DATABASE FOR OFFLINE SYNCHRONIZATION...');
    try {
      this.lastTerrainFeatures = await this.fetchTerrainFeatures(start, end);
      this.drawTerrainOverlays(this.lastTerrainFeatures);
    } catch (err) {
      console.warn('Could not fetch fresh terrain features for offline sync:', err);
    }

    this.systemStatusMsg.set('DOWNLOADING MAP TILES: INITIATING SECURE CACHE...');
    // Pad bounds by 10% to ensure surrounding map tiles are downloaded and avoid black edges
    const bounds = this.padBounds(this.buildOfflineBounds(), 0.1);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Include zoom level 16 for high-resolution close-up viewing
    const zoomLevels = [11, 12, 13, 14, 15, 16];
    const tileUrls: string[] = [];
    const mode = this.currentMode();

    zoomLevels.forEach((z) => {
      const minX = this.lng2tile(sw.lng, z);
      const maxX = this.lng2tile(ne.lng, z);
      const minY = this.lat2tile(ne.lat, z);
      const maxY = this.lat2tile(sw.lat, z);

      const startX = Math.min(minX, maxX);
      const endX = Math.max(minX, maxX);
      const startY = Math.min(minY, maxY);
      const endY = Math.max(minY, maxY);

      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          tileUrls.push(...this.getTileUrlsForCoord(x, y, z, mode));
        }
      }
    });

    // Increase cache slice limit from 150 to 600 tiles to support high-resolution zoom levels along corridors
    const uniqueUrls = Array.from(new Set(tileUrls)).slice(0, 600);
    const totalTiles = uniqueUrls.length;
    let cachedCount = 0;

    this.systemStatusMsg.set(`DOWNLOADING MAP TILES: 0% (0 / ${totalTiles} TILES)`);

    try {
      const cache = await caches.open('paktak-map-tiles');
      const chunkSize = 5;
      
      for (let i = 0; i < uniqueUrls.length; i += chunkSize) {
        const chunk = uniqueUrls.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                // Clone the response before caching to preserve the body for reading
                await cache.put(url, response.clone());
                cachedCount++;
                const percentage = Math.round((cachedCount / totalTiles) * 100);
                this.systemStatusMsg.set(`DOWNLOADING MAP TILES: ${percentage}% (${cachedCount} / ${totalTiles} TILES)`);
              } else {
                console.warn(`Tile fetch returned status ${response.status} for ${url}`);
              }
            } catch (err) {
              console.warn(`Failed to cache tile URL: ${url}`, err);
            }
          })
        );
      }

      const offlineData = {
        startPoint: start,
        hitPoint: end,
        waypoints: this.waypoints().map((wp) => ({ id: wp.id, name: wp.name, lat: wp.lat, lng: wp.lng })),
        routes: this.routes.map((route) => ({
          coords: route.coordinates.map((coord) => [coord.lat, coord.lng]),
          color: route.color,
          weight: route.width,
          opacity: route.opacity,
          dashArray: route.dashArray,
          tooltipText: route.label
        })),
        routeOptions: this.routeOptions(),
        selectedRouteIndex: this.selectedRouteIndex(),
        terrainAnalysis: this.terrainAnalysis(),
        missionBriefing: this.missionBriefing,
        lastTerrainFeatures: this.lastTerrainFeatures,
        offlineBounds: {
          southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
          northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
        },
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('paktak_offline_cache', JSON.stringify(offlineData));
      this.hasOfflineMap.set(true);
      this.systemStatusMsg.set('OFFLINE SYNC COMPLETE. START, TARGET, WAYPOINTS & TERRAIN OBSTACLES FULLY CACHED.');
      
      // Wait a moment for cache to settle, then auto-trigger viewing of the newly cached offline map
      setTimeout(() => {
        this.viewOfflineMap();
        setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.1 GB AVAILABLE'), 2000);
      }, 500);
    } catch (e) {
      console.error('Offline Sync Error:', e);
      this.systemStatusMsg.set('ERROR: OFFLINE SYNC FAILED');
      setTimeout(() => this.systemStatusMsg.set('SYSTEM STATUS: OPTIMAL | OFFLINE STORAGE: 4.2 GB AVAILABLE'), 5000);
    }
  }

  public viewOfflineMap() {
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

      this.isOfflineSessionActive.set(true);
      this.restoreOfflineCache();

      const bounds = offlineData.offlineBounds
        ? new maplibregl.LngLatBounds(
            [offlineData.offlineBounds.southWest.lng, offlineData.offlineBounds.southWest.lat],
            [offlineData.offlineBounds.northEast.lng, offlineData.offlineBounds.northEast.lat]
          )
        : this.buildOfflineBounds();

      this.map.fitBounds(bounds, { padding: 40, maxZoom: 16 });
      this.map.setMaxBounds(bounds);
      this.systemStatusMsg.set(`OFFLINE MAP VIEW ACTIVE: ${offlineData.missionBriefing?.codeName || 'SAVED OPERATION'}`);
    } catch (error) {
      console.error('Failed to view offline map:', error);
      this.systemStatusMsg.set('ERROR: FAILED TO LOAD OFFLINE SYNCED MAP');
    }
  }
}
