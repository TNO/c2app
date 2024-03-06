import m from 'mithril';
// import bbox from '@turf/bbox';
// import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Feature, Polygon, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { IActions, IAppModel } from '../../services/meiosis';
import SquareGrid from '@turf/square-grid';
import polylabel from 'polylabel';
import {
  GeoJSONSource,
  GeoJSONFeature,
  Map as MaplibreMap,
  Style,
  LayerSpecification,
  MapMouseEvent,
  GeoJSONFeatureId,
} from 'maplibre-gl';

// ICONS
import marker from '../../assets/icons/mapbox-marker-icon-20px-blue.png';
// import car from '../../assets/Operations/Car.png';
// import van from '../../assets/Operations/Car.png';
// import controlPoint from '../../assets/Operations/Control point.png';
// import divisionCommand from '../../assets/Operations/Division command.png';
// import evacuation from '../../assets/Operations/Evacuation.png';
// import fireman from '../../assets/Operations/Firemen unit.png';
// import helicopter from '../../assets/Operations/Helicopter.png';
// import media from '../../assets/Operations/Media.png';
// import sanitary from '../../assets/Operations/Medical services.png';
// import military from '../../assets/Operations/Military.png';
// import policeman from '../../assets/Operations/Police unit.png';
// import roadBlock from '../../assets/Operations/Road block.png';
// import truck from '../../assets/Operations/Truck.png';
// import chemical from '../../assets/Incidents/Chemical.png';
// import air from '../../assets/Operations/air.png';
// import ground from '../../assets/Operations/ground.png';
// import first_responder from '../../assets/Operations/Medical services.png';
import {
  FeatureCollectionExt,
  ILayer,
  ISource,
  SafrFeatureState,
  SafrFeatureStateKeys,
  SafrMapGeoJSONFeature,
  SidebarMode,
  SourceType,
} from '../../models';
import { uniqueId } from 'mithril-materialized';
import { LayerStyle } from 'c2app-models-utils';
import { UIForm } from 'mithril-ui-form';
import { clone } from '../../utils';
import { defaultLayerStyle } from './default-layer-style';

export const drawConfig = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    point: true,
    line_string: true,
    trash: true,
  },
};

export const handleDrawEvent = (_map: MaplibreMap, features: SafrMapGeoJSONFeature[], actions: IActions) => {
  displayInfoSidebar(features, actions, 'CREATE_POI');
  // actions.updateDrawings(features[0] as GeoJSONFeature);
  // if (features[0].geometry.type === 'Polygon') {
  //   getFeaturesInPolygon(map, features, actions);
  // }

  // const elem = document.getElementById('layerSelect') as HTMLElement;
  // M.FormSelect.init(elem);
  // const instance = M.Modal.getInstance(document.getElementById('create-poi-modal') as HTMLElement);
  // instance && instance.open();
};

export const setZoomLevel = (map: MaplibreMap, actions: IActions) => {
  const zoom = map.getZoom();
  actions.setZoomLevel(zoom);
};

export const setLonLat = (map: MaplibreMap, actions: IActions) => {
  const lonlat = map.getCenter();
  actions.setLonLat([lonlat.lng, lonlat.lat]);
};

// const getFeaturesInPolygon = (map: MaplibreMap, features: Feature[], actions: IActions) => {
//   let layers: Array<string> = [];

//   if (map.getLayer('ResourcesresourcesIDfiremanResources')) layers.push('ResourcesresourcesIDfiremanResources');
//   if (map.getLayer('ResourcesresourcesIDpolicemanResources')) layers.push('ResourcesresourcesIDpolicemanResources');
//   if (map.getLayer('ResourcesresourcesIDfirst_responderResources'))
//     layers.push('ResourcesresourcesIDfirst_responderResources');
//   if (map.getLayer('ResourcesresourcesIDsanitaryResources')) layers.push('ResourcesresourcesIDsanitaryResources');
//   if (map.getLayer('ResourcesresourcesIDcarResources')) layers.push('ResourcesresourcesIDcarResources');
//   if (map.getLayer('ResourcesresourcesIDvanResources')) layers.push('ResourcesresourcesIDvanResources');
//   if (map.getLayer('ResourcesresourcesIDtruckResources')) layers.push('ResourcesresourcesIDtruckResources');
//   if (map.getLayer('ResourcesresourcesIDairResources')) layers.push('ResourcesresourcesIDairResources');
//   if (map.getLayer('ResourcesresourcesIDgroundResources')) layers.push('ResourcesresourcesIDgroundResources');

//   if (layers.length === 0) return;

//   const bounding = bbox(features[0]);
//   let bboxFeatures = map.queryRenderedFeatures(
//     [map.project([bounding[0], bounding[1]]), map.project([bounding[2], bounding[3]])],
//     { layers: layers }
//   );
//   const polyFeatures = bboxFeatures.filter((element) =>
//     booleanPointInPolygon(
//       [(element.geometry as Point).coordinates[0], (element.geometry as Point).coordinates[1]],
//       features[0] as Feature<Polygon>
//     )
//   );
//   actions.updateSelectedFeatures(polyFeatures);
// };

/** Close or open a sidebar */
export const sidebarInteraction = (id: string, interaction: 'OPEN' | 'CLOSE' | 'CREATE' = 'OPEN') => {
  const el = document.getElementById(id) as HTMLElement;
  if (!el) {
    console.warn(`Sidebar with ID ${id} not found!`);
    return;
  }
  if (interaction === 'CREATE') {
    M.Sidenav.init(el, {
      edge: 'right',
      // onOpenStart: function (_elem: Element) {},
    });
    return;
  }
  const sidebar = M.Sidenav.getInstance(el);
  sidebar && setTimeout(() => (interaction === 'OPEN' ? sidebar.open() : sidebar.close()), 100);
};

export const displayInfoSidebar = (features: SafrMapGeoJSONFeature[], actions: IActions, mode: SidebarMode) => {
  if (!features || features.length === 0) return;
  const feature = features[0] as GeoJSONFeature;
  actions.updateClickedFeature(feature, mode);
  sidebarInteraction('slide-out-2');
};

export const setFeatureState = (
  map: MaplibreMap,
  features: SafrMapGeoJSONFeature[] | undefined,
  key: SafrFeatureStateKeys,
  value?: boolean
) => {
  if (!features || features.length === 0) return undefined;
  const feature = features[0] as SafrMapGeoJSONFeature;
  const { id } = feature;
  const finalValue = typeof value === 'undefined' ? !(feature.state[key] || false) : value;
  map.setFeatureState({ source: feature.source, id }, { [key]: finalValue });
  // feature.state.isSelected = typeof isSelected === 'undefined' ? !feature.state.isSelected || true : isSelected;
  console.log(`feature.state[${key}] = ${finalValue}`);
  return feature;
};

export const getGridSource = (map: MaplibreMap, actions: IActions, appState: IAppModel): FeatureCollection<Polygon> => {
  if (appState.app.gridOptions.updateLocation) {
    const bounds = map.getBounds();
    actions.updateGridLocation([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
    appState.app.gridOptions.gridLocation = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  }

  return SquareGrid(appState.app.gridOptions.gridLocation, appState.app.gridOptions.gridCellSize, {
    units: 'kilometers',
  });
};

const getRowLetter = (index: number, rows: number) => {
  return String.fromCharCode(Math.abs((index % rows) - rows) + 64);
};

const getColumnNumber = (index: number, rows: number) => {
  return Math.floor(index / rows) + 1;
};

export const getLabelsSource = (gridSource: FeatureCollection<Polygon>): FeatureCollection => {
  let rows = new Set<number>();
  let prev_size: number = 0;
  gridSource.features.some((feature: Feature) => {
    let longLat = polylabel((feature.geometry as Polygon).coordinates);
    rows.add(longLat[1]);
    const curr_size = rows.size;
    if (prev_size === curr_size) return true;
    prev_size = curr_size;
    return false;
  });

  return {
    type: 'FeatureCollection',
    features: gridSource.features.map((feature: Feature, index: number) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: polylabel((feature.geometry as Polygon).coordinates),
        } as Geometry,
        properties: {
          cellLabel: `${getRowLetter(index, rows.size) + getColumnNumber(index, rows.size)}`,
        },
      } as Feature;
    }),
  } as FeatureCollection;
};

export const loadMissingImages = (map: MaplibreMap) => {
  map.on('styleimagemissing', (e) => {
    const id = e.id; // id of the missing image
    const url = id.endsWith('/') ? marker : `${process.env.SERVER_URL}/layer_styles/${id}`;
    map.loadImage(url, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
      if (error) throw error;
      // SDF: https://docs.mapbox.com/help/troubleshooting/using-recolorable-images-in-mapbox-maps/#what-are-signed-distance-fields-sdf
      // See also https://docs.mapbox.com/help/troubleshooting/using-recolorable-images-in-mapbox-maps/#mapbox-gl-js
      if (!map.hasImage(id)) map.addImage(id, image as ImageBitmap, { sdf: false });
      // if (!map.hasImage(id)) map.addImage(id, image as ImageBitmap, { sdf: url.endsWith('.png') });
    });
  });
};

export const switchBasemap = async (map: MaplibreMap, styleID: string) => {
  const currentStyle = map.getStyle();
  const newStyle = await m.request<Style>(`https://api.mapbox.com/styles/v1/${styleID}`);

  // ensure any sources from the current style are copied across to the new style
  // newStyle.sources = Object.assign({}, currentStyle.sources, newStyle.sources);
  Object.entries(currentStyle.sources)?.forEach(([id, source]) => newStyle.addSource(id, source));
};

/** Convert a source to a unique name */
export const toSourceName = (source: ISource) => `${source.id}`.toLowerCase().replace(/\s/g, '_');

/** Convert a layer to a unique name */
export const toLayerName = (sourceName: string, layer: ILayer) =>
  `${sourceName}.${layer.type.id}`.toLowerCase().replace(/\s/g, '_');

// const showPopup = (e: MapMouseEvent, map: MaplibreMap, popup: Popup, feature: SafrMapGeoJSONFeature) => {
//   const coordinates = (
//     feature.geometry.type === 'Point' ? (feature.geometry as Point).coordinates.slice() : e.lngLat
//   ) as number[];
//   const title = feature.properties.title;
//   const description = feature.properties.description;
//   const html = `${title ? `<h5>${title}</h5>` : ''}${description ? `<p>${description}</p>` : ''}`;
//   if (!html) return;
//   // Ensure that if the map is zoomed out such that multiple
//   // copies of the feature are visible, the popup appears
//   // over the copy being pointed to.
//   while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
//     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
//   }

//   // Populate the popup and set its coordinates
//   // based on the feature found.
//   popup
//     .setLngLat(coordinates as LngLatLike)
//     .setHTML(html)
//     .addTo(map);
// };

const moveOnMap = (
  source: ISource,
  layerName: string,
  actions: IActions,
  map: MaplibreMap,
  feature: SafrMapGeoJSONFeature
) => {
  console.log('ON MOUSE MOVE');
  const canvas = map.getCanvas();
  const geometry = feature.geometry;
  const featureSource = feature.source;
  if (geometry.type !== 'Point' || !featureSource) return;
  canvas.style.cursor = 'move';

  const onMove = (e: MapMouseEvent) => {
    console.log('onMove');
    canvas.style.cursor = 'grabbing';
    const coords = e.lngLat;
    geometry.coordinates = [coords.lng, coords.lat];
    source.source.features = source.source.features.map((f) =>
      f.properties?.id === feature.id ? { ...f, geometry } : f
    );
    const s = map.getSource(featureSource) as GeoJSONSource;
    // s && s.setData(source.source);
    s && s.updateData({ update: [{ id: feature.id as GeoJSONFeatureId, newGeometry: geometry }] });
  };

  const onUp = (e: MapMouseEvent) => {
    console.log('onUp');
    const coords = e.lngLat;

    // // Print the coordinates of where the point had
    // // finished being dragged to on the map.
    // coordinates.style.display = 'block';
    // coordinates.innerHTML = `Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`;
    console.log(`Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`);
    canvas.style.cursor = '';

    // Unbind mouse/touch events
    map.off('mousemove', onMove);
    map.off('touchmove', onMove);
    actions.saveSource(source);
  };

  map.on('mousedown', layerName, (e) => {
    // Prevent the default map drag behavior.
    e.preventDefault();
    canvas.style.cursor = 'grab';
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
  });

  map.on('touchstart', layerName, (e) => {
    if (e.points.length !== 1) return;
    // Prevent the default map drag behavior.
    e.preventDefault();
    map.on('touchmove', onMove);
    map.once('touchend', onUp);
  });
};

export const updateSourcesAndLayers = (sources: ISource[], actions: IActions, map: MaplibreMap) => {
  console.log('UPDATING sources and layer');
  // const { sources = [] } = appState.app;
  sources.forEach((source: ISource) => {
    // Set source
    const sourceName = toSourceName(source);
    if (map.getSource(sourceName)) {
      (map.getSource(sourceName) as GeoJSONSource).setData(source.source);
      return;
    } else {
      console.log('ADD SOURCE');
      console.log(source);
      map.addSource(sourceName, {
        type: 'geojson',
        data: source.source,
        promoteId: 'id',
      });
    }

    // Set Layers
    source.layers.forEach((layer: ILayer) => {
      let hoverFeature: SafrMapGeoJSONFeature | undefined;
      const layerName = toLayerName(sourceName, layer);

      if (!map.getLayer(layerName)) {
        const mapLayer = {
          ...layer.type,
          id: layerName,
          source: sourceName,
        } as LayerSpecification;
        console.log('NEW map layer');
        console.log(mapLayer);
        map.addLayer(mapLayer);
        map.on('click', layerName, ({ features }) => {
          setFeatureState(map, features as SafrMapGeoJSONFeature[], 'isSelected');
          displayInfoSidebar(features as SafrMapGeoJSONFeature[], actions, 'EDIT_POI');
        });
        map.on('mouseenter', layerName, ({ features }) => {
          map.getCanvas().style.cursor = 'pointer';
          hoverFeature = setFeatureState(map, features as SafrMapGeoJSONFeature[], 'hover', true);
        });
        map.on('mouseleave', layerName, (e) => {
          console.log('ON MOUSE LEAVE: ' + e);
          map.getCanvas().style.cursor = '';
          if (hoverFeature) {
            setFeatureState(map, [hoverFeature], 'hover', false);
            hoverFeature = undefined;
          }
        });
      }
      map.setLayoutProperty(layerName, 'visibility', layer.showLayer ? 'visible' : 'none');
    });
  });
};

/** Add or update an item in a feature collection */
export const addOrUpdateFeature = <T extends Geometry | null, K extends GeoJsonProperties>(
  fc: FeatureCollectionExt<T, K>,
  f: Feature<T, K>
): FeatureCollectionExt<T, K> => {
  const { id } = f.properties || {};
  const { features = [] } = fc;
  const existingItem = features.find((f) => f.properties?.id === id);

  if (existingItem) {
    // If an item with the same id exists, update it
    console.log('Existing item updated');
    return { ...fc, features: features.map((feature) => (feature === existingItem ? { ...f } : feature)) };
  }
  // If the item doesn't exist, add it
  console.log('New item added');
  return { ...fc, features: [...features, { ...f }] };
};

/** Add or update an item in a feature collection */
export const deleteFeature = <T extends Geometry | null, K extends GeoJsonProperties>(
  fc: FeatureCollectionExt<T, K>,
  f?: Feature<T, K>
): FeatureCollectionExt<T, K> => {
  if (!f) return fc;
  const { id } = f.properties || {};
  const { features = [] } = fc;
  const existingItem = features.find((f) => f.properties?.id === id);

  if (existingItem) {
    // If an item with the same id exists, update it
    return { ...fc, features: features.filter((f) => f.properties?.id !== id) };
  }
  return fc;
};

/** Convert a feature collection that you received to a valid source */
export const featureCollectionToSource = (fc: FeatureCollectionExt, styles: LayerStyle<any>[] = []) => {
  const {
    layerId: id = uniqueId(),
    layerName: sourceName = 'SOURCE_NAME',
    layerStyle = defaultLayerStyle.id,
    layerShared: shared = false,
    layerCanDelete: canDelete = false,
  } = fc;
  fc.layerId = id;
  fc.layerStyle = layerStyle;
  fc.layerName = sourceName;
  fc.layerShared = shared;
  fc.layerCanDelete = canDelete;
  const style = styles.filter((s) => s.id.toUpperCase() === layerStyle.toUpperCase()).shift() || defaultLayerStyle;
  return {
    id,
    source: fc,
    sourceName,
    shared,
    canDelete,
    sourceCategory: SourceType.realtime,
    layers: clone(style.layers || ([] as ILayer[])),
    ui: clone(style.ui || ([] as UIForm)),
  } as ISource;
};

export const updateGrid = (appState: IAppModel, actions: IActions, map: MaplibreMap) => {
  const gridSource = getGridSource(map, actions, appState);
  const gridLabelsSource = getLabelsSource(gridSource);

  actions.updateGrid(gridSource, gridLabelsSource);
};

export const updateSatellite = (appState: IAppModel, map: MaplibreMap) => {
  // Set source
  const sourceName = 'wms-satellite-source';
  if (!map.getSource(sourceName)) {
    map.addSource(sourceName, {
      type: 'raster',
      tiles: ['https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg'],
      tileSize: 256,
      maxzoom: 18,
    });
  }
  // Set Layer
  const layerName = 'wms-satellite-layer';

  if (!map.getLayer(layerName)) {
    map.addLayer(
      {
        id: layerName,
        type: 'raster',
        source: sourceName,
        layout: {
          visibility: appState.app.showSatellite ? 'visible' : 'none',
        },
        paint: {},
      },
      // Place the satellite layer under the aerial indicators (airports, helipads) but only if that layer exists (i.e. using mapbox token)
      // Otherwise append it to the layers array and show above all layers
      map.getLayer('aeroway-line') ? 'aeroway-line' : (null as any)
    );
  }
  map.setLayoutProperty(layerName, 'visibility', appState.app.showSatellite ? 'visible' : 'none');
  if (map.getLayer('building')) {
    map.setPaintProperty(
      'building',
      'fill-opacity',
      appState.app.showSatellite ? 0 : ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 1]
    );
  }
};
