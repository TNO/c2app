import m from 'mithril';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { Point, Feature, Polygon, FeatureCollection, Geometry } from 'geojson';
import { IActions, IAppModel, ILayer, ISource, SourceType } from '../../services/meiosis';
import SquareGrid from '@turf/square-grid';
import polylabel from 'polylabel';
import { GeoJSONSource, GeoJSONFeature, Map as MaplibreMap, Style, LayerSpecification } from 'maplibre-gl';

// ICONS
import car from '../../assets/Operations/Car.png';
import van from '../../assets/Operations/Car.png';
import controlPoint from '../../assets/Operations/Control point.png';
import divisionCommand from '../../assets/Operations/Division command.png';
import evacuation from '../../assets/Operations/Evacuation.png';
import fireman from '../../assets/Operations/Firemen unit.png';
import helicopter from '../../assets/Operations/Helicopter.png';
import media from '../../assets/Operations/Media.png';
import sanitary from '../../assets/Operations/Medical services.png';
import military from '../../assets/Operations/Military.png';
import policeman from '../../assets/Operations/Police unit.png';
import roadBlock from '../../assets/Operations/Road block.png';
import truck from '../../assets/Operations/Truck.png';
import chemical from '../../assets/Incidents/Chemical.png';
import air from '../../assets/Operations/air.png';
import ground from '../../assets/Operations/ground.png';
import first_responder from '../../assets/Operations/Medical services.png';
import { FeatureCollectionExt } from '../../models';
import { uniqueId } from 'mithril-materialized';
import { LayerStyle } from 'c2app-models-utils';

export const drawConfig = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    point: true,
    line_string: true,
    trash: true,
  },
};

export const handleDrawEvent = (map: MaplibreMap, features: GeoJSONFeature[], actions: IActions) => {
  actions.updateDrawings(features[0] as GeoJSONFeature);
  if (features[0].geometry.type === 'Polygon') {
    getFeaturesInPolygon(map, features, actions);
  }

  const elem = document.getElementById('layerSelect') as HTMLElement;
  M.FormSelect.init(elem);
  const instance = M.Modal.getInstance(document.getElementById('createPOIModal') as HTMLElement);
  instance.open();
};

export const setZoomLevel = (map: MaplibreMap, actions: IActions) => {
  const zoom = map.getZoom();
  actions.setZoomLevel(zoom);
}

export const setLonLat = (map: MaplibreMap, actions: IActions) => {
  const lonlat = map.getCenter();
  actions.setLonLat([lonlat.lng, lonlat.lat]);
}

const getFeaturesInPolygon = (map: MaplibreMap, features: Feature[], actions: IActions) => {
  let layers: Array<string> = [];

  if (map.getLayer('ResourcesresourcesIDfiremanResources')) layers.push('ResourcesresourcesIDfiremanResources');
  if (map.getLayer('ResourcesresourcesIDpolicemanResources')) layers.push('ResourcesresourcesIDpolicemanResources');
  if (map.getLayer('ResourcesresourcesIDfirst_responderResources'))
    layers.push('ResourcesresourcesIDfirst_responderResources');
  if (map.getLayer('ResourcesresourcesIDsanitaryResources')) layers.push('ResourcesresourcesIDsanitaryResources');
  if (map.getLayer('ResourcesresourcesIDcarResources')) layers.push('ResourcesresourcesIDcarResources');
  if (map.getLayer('ResourcesresourcesIDvanResources')) layers.push('ResourcesresourcesIDvanResources');
  if (map.getLayer('ResourcesresourcesIDtruckResources')) layers.push('ResourcesresourcesIDtruckResources');
  if (map.getLayer('ResourcesresourcesIDairResources')) layers.push('ResourcesresourcesIDairResources');
  if (map.getLayer('ResourcesresourcesIDgroundResources')) layers.push('ResourcesresourcesIDgroundResources');

  if (layers.length === 0) return;

  const bounding = bbox(features[0]);
  let bboxFeatures = map.queryRenderedFeatures(
    [map.project([bounding[0], bounding[1]]), map.project([bounding[2], bounding[3]])],
    { layers: layers }
  );
  const polyFeatures = bboxFeatures.filter((element) =>
    booleanPointInPolygon(
      [(element.geometry as Point).coordinates[0], (element.geometry as Point).coordinates[1]],
      features[0] as Feature<Polygon>
    )
  );
  actions.updateSelectedFeatures(polyFeatures);
};

export const displayInfoSidebar = (features: GeoJSONFeature[], actions: IActions) => {
  console.log(features);
  actions.updateClickedFeature(features[0] as GeoJSONFeature);
  const instance = M.Sidenav.getInstance(document.getElementById('slide-out-2') as HTMLElement);
  instance.open();
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
    console.log('Missing image:');
    console.log(e);
    // const id = e.id; // id of the missing image

    // map.addImage(id, {width, height: width, data});
  });
};

export const loadImages = (map: MaplibreMap) => {
  map.loadImage(fireman, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('FIREFIGHTER')) map.addImage('FIREFIGHTER', image as ImageBitmap);
  });
  map.loadImage(policeman, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('POLICE')) map.addImage('POLICE', image as ImageBitmap);
  });
  map.loadImage(sanitary, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('MEDICAL')) map.addImage('MEDICAL', image as ImageBitmap);
  });
  map.loadImage(first_responder, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('OTHER')) map.addImage('OTHER', image as ImageBitmap);
  });
  map.loadImage(car, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('CAR')) map.addImage('CAR', image as ImageBitmap);
  });
  map.loadImage(van, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('VAN')) map.addImage('VAN', image as ImageBitmap);
  });
  map.loadImage(truck, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('TRUCK')) map.addImage('TRUCK', image as ImageBitmap);
  });
  map.loadImage(air, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('AIR')) map.addImage('AIR', image as ImageBitmap);
  });
  map.loadImage(ground, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('GROUND')) map.addImage('GROUND', image as ImageBitmap);
  });
  map.loadImage(chemical, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('chemical')) map.addImage('chemical', image as ImageBitmap);
  });
  map.loadImage(roadBlock, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('roadBlock')) map.addImage('roadBlock', image as ImageBitmap);
  });
  map.loadImage(media, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('media')) map.addImage('media', image as ImageBitmap);
  });
  map.loadImage(controlPoint, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('controlPoint')) map.addImage('controlPoint', image as ImageBitmap);
  });
  map.loadImage(divisionCommand, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('divisionCommand')) map.addImage('divisionCommand', image as ImageBitmap);
  });
  map.loadImage(evacuation, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('evacuation')) map.addImage('evacuation', image as ImageBitmap);
  });
  map.loadImage(helicopter, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('helicopter')) map.addImage('helicopter', image as ImageBitmap);
  });
  map.loadImage(military, function (error?: Error | null, image?: HTMLImageElement | ImageBitmap | null) {
    if (error) throw error;
    if (!map.hasImage('military')) map.addImage('military', image as ImageBitmap);
  });
};

export const switchBasemap = async (map: MaplibreMap, styleID: string) => {
  const currentStyle = map.getStyle();
  const newStyle = await m.request<Style>(`https://api.mapbox.com/styles/v1/${styleID}`);

  // ensure any sources from the current style are copied across to the new style
  // newStyle.sources = Object.assign({}, currentStyle.sources, newStyle.sources);
  Object.entries(currentStyle.sources)?.forEach(([id, source]) => newStyle.addSource(id, source));

  // TODO FIX
  // // find the index of where to insert our layers to retain in the new style
  // let labelIndex = newStyle.layers?.findIndex((el) => {
  //   return el.id == 'state-label';
  // });

  // // default to on top
  // if (labelIndex === -1) {
  //   labelIndex = newStyle.layers?.length;
  // }
  // const appLayers = currentStyle.layers?.filter((el) => {
  //   // app layers are the layers to retain, and these are any layers which have a different source set
  //   const source = (el as any).source;
  //   return source && source != 'mapbox://mapbox.satellite' && source != 'mapbox' && source != 'composite';
  // });

  // if (!newStyle || !newStyle.layers || !appLayers) return;
  // newStyle.layers = [...newStyle.layers.slice(0, labelIndex), ...appLayers, ...newStyle.layers.slice(labelIndex, -1)];

  // map.setStyle(newStyle);
  loadImages(map);
};

/** Convert a source to a unique name */
export const toSourceName = (source: ISource) => `${source.sourceName}.${source.id}`.toLowerCase().replace(/\s/g, '_');

/** Convert a layer to a unique name */
export const toLayerName = (sourceName: string, layer: ILayer) => `${sourceName}.${layer.layerName}`.toLowerCase().replace(/\s/g, '_');

export const updateSourcesAndLayers = (appState: IAppModel, actions: IActions, map: MaplibreMap) => {
  console.log('UPDATING SOURCES AND LAYERS');
  appState.app.sources.filter(s => s.source.features?.length > 0).forEach((source: ISource) => {
    // Set source
    const sourceName = toSourceName(source);
    if (!map.getSource(sourceName)) {
      map.addSource(sourceName, {
        type: 'geojson',
        data: source.source,
      });
    } else {
      (map.getSource(sourceName) as GeoJSONSource).setData(source.source);
    }

    // Set Layers
    console.log(source)
    source.layers.filter(l => typeof l.showLayer === 'undefined' || l.showLayer === true).forEach((layer: ILayer) => {
      const layerName = toLayerName(sourceName, layer);

      if (!map.getLayer(layerName)) {
        const mapLayer = { id: layerName, ...layer, type: layer.type.type, source: sourceName } as LayerSpecification;
        console.log(mapLayer)
        map.addLayer(mapLayer);
        map.on('click', layerName, ({ features }) => displayInfoSidebar(features as GeoJSONFeature[], actions));
        map.on('mouseenter', layerName, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layerName, () => (map.getCanvas().style.cursor = ''));
      }
      map.setLayoutProperty(layerName, 'visibility', layer.showLayer ? 'visible' : 'none');
      if (source.sourceCategory === SourceType.alert || source.sourceCategory === SourceType.plume)
        layer.paint && map.setPaintProperty(layerName, 'line-opacity', layer.paint['line-opacity']);
    });
  });
}

const defaultLayerStyle = {
  id: 'default',
  name: 'Default layer style',
  iconPath: `${process.env.SERVER_URL}/layer_styles/maki`,
  layers: [
    {
      layerName: 'areas',
      showLayer: true,
      type: { type: 'fill' } as mapboxgl.FillLayer,
      paint: {
        'fill-color': ['coalesce', ["get", "fill"], "#555555"],
        'fill-opacity': ['coalesce', ["get", "fill-opacity"], 0.6],
      },
      filter: ['==', '$type', 'Polygon']
    },
    {
      layerName: 'lines',
      showLayer: true,
      type: { type: 'line' } as mapboxgl.LineLayer,
      paint: {
        'line-color': ['coalesce', ["get", "stroke"], "#555555"],
        'line-width': ['coalesce', ["get", "stroke-width"], 2],
        'line-opacity': ['coalesce', ["get", "stroke-opacity"], 1],
      },
      // filter: ['==', '$type', 'Polygon']
    },
    // {
    //   layerName: 'points',
    //   showLayer: true,
    //   type: { type: 'circle' } as mapboxgl.CircleLayer,
    //   paint: {
    //     'circle-radius': 6,
    //     'circle-color': '#B42222'
    //   },
    //   filter: ['==', '$type', 'Point']
    // },
    {
      layerName: 'icons',
      showLayer: true,
      type: { type: 'symbol' } as mapboxgl.SymbolLayer,
      layout: {
        // 'icon-image': ['coalesce', ["get", "marker-symbol"], "pin"],
        // 'icon-size': ['coalesce', ["get", "marker-size"], .2], // small, medium or large
        // 'icon-color': ['coalesce', ["get", "marker-color"], "#7e7e7e"],
        'icon-image': [
          'coalesce',
          ['get', 'marker-symbol'],
          // ['image', ['concat', ['get', 'icon'], '_15']],
          'OTHER'
        ],
        'text-field': ['coalesce', ['get', 'title'], ""],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0.6],
        'text-anchor': 'top'
      },
      filter: ['==', '$type', 'Point']
    },
    // {
    //   layerName: 'points',
    //   showLayer: true,
    //   type: { type: 'symbol' } as mapboxgl.AnyLayer,
    //   layout: {
    //     'icon-image': 'fireman',
    //     'icon-size': 0.5,
    //     'icon-allow-overlap': true,
    //   } as any,
    //   filter: ['all', ['in', 'type', 'man', 'firefighter']],
    // },
  ] as ILayer[],
  icons: [] as Array<[name: string, src: string]>,
} as LayerStyle<any>;

export const featureCollectionToSource = (source: FeatureCollectionExt, styles: LayerStyle<any>[] = []) => {
  const { layerId: id = uniqueId(), layerName: sourceName = '', layerStyle = 'default' } = source;
  const style = styles.filter(s => s.id === layerStyle).shift() || defaultLayerStyle;
  return {
    id,
    source,
    sourceName,
    sourceCategory: SourceType.realtime,
    shared: false,
    layers: style.layers || [] as ILayer[],
  } as ISource;
}

// export const updateSourcesAndLayers = (appState: IAppModel, _actions: IActions, map: MaplibreMap) => {
//   appState.app.sources.forEach((source: ISource) => {
//     // Set source
//     const sourceName = toSourceName(source);
//     if (!map.getSource(sourceName)) {
//       map.addSource(sourceName, {
//         type: 'geojson',
//         data: source.source,
//       });
//     } else {
//       (map.getSource(sourceName) as GeoJSONSource).setData(source.source);
//     }

//     // Set Layers
//     source.layers.forEach((layer: ILayer) => {
//       const layerName = toLayerName(sourceName, layer);
//       // TODO FIX
//       if (!map.getLayer(layerName)) {
//         map.addLayer({
//           id: layerName,
//           type: layer.type.type,
//           source: sourceName,
//           layout: layer.layout ? layer.layout : {},
//           paint: layer.paint ? layer.paint : {},
//           filter: layer.filter ? layer.filter : ['all'],
//         });
//         map.on('click', layerName, ({ features }) => displayInfoSidebar(features as GeoJSONFeature[], actions));
//         map.on('mouseenter', layerName, () => (map.getCanvas().style.cursor = 'pointer'));
//         map.on('mouseleave', layerName, () => (map.getCanvas().style.cursor = ''));
//       }
//       map.setLayoutProperty(layerName, 'visibility', layer.showLayer ? 'visible' : 'none');
//       if (source.sourceCategory === SourceType.alert || source.sourceCategory === SourceType.plume)
//         layer.paint && map.setPaintProperty(layerName, 'line-opacity', layer.paint['line-opacity']);
//     });
//   });
// };

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
