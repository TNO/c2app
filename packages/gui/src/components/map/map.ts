import m from 'mithril';
import maplibre, { IControl, Map as MaplibreMap } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// @ts-ignore
import { MeiosisComponent } from '../../services/meiosis';
import * as MapUtils from './map-utils';
// https://github.com/korywka/mapbox-controls/tree/master/packages/tooltip
// import TooltipControl from '@mapbox-controls/tooltip';

// @ts-ignore
MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
// @ts-ignore
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
// @ts-ignore
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';

export const Map: MeiosisComponent = () => {
  let map: MaplibreMap;
  let draw: MapboxDraw;
  console.table(process.env.VECTOR_TILE_SERVER === 'undefined')
  return {
    view: () => {
      return m('#mapboxMap.col.s12.l9.right');
    },
    oncreate: ({ attrs: { state: appState, actions } }) => {
      // Create map and add controls
      map = new MaplibreMap({
        container: 'mapboxMap',
        style: process.env.VECTOR_TILE_SERVER && process.env.VECTOR_TILE_SERVER !== 'undefined'
          ? process.env.VECTOR_TILE_SERVER
          : {
            version: 8,
            sources: {
              'brt-achtergrondkaart': {
                type: 'raster',
                tiles: ['https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png'],
                tileSize: 256,
                minzoom: 1,
                maxzoom: 19,
                attribution: 'Kaartgegevens: <a href="https://kadaster.nl">Kadaster</a>',
              },
            },
            glyphs: 'https://api.pdok.nl/lv/bgt/ogc/v1_0/resources/fonts/{fontstack}/{range}.pbf',
            layers: [
              {
                id: 'standard-raster',
                type: 'raster',
                source: 'brt-achtergrondkaart',
              },
            ],
          },
        center: actions.getLonLat(),
        zoom: actions.getZoomLevel(),
      });
      MapUtils.loadMissingImages(map);
      MapUtils.loadImages(map);
      // MapUtils.updateGrid(appState, actions, map);

      // Add draw controls
      draw = new MapboxDraw(MapUtils.drawConfig);
      map.addControl(new maplibre.NavigationControl(), 'top-left');
      map.addControl(draw as unknown as IControl, 'top-left');

      // Add map listeners
      map.on('load', async () => {
        map.on('draw.create', ({ features }) => MapUtils.handleDrawEvent(map, features, actions));
        map.on('draw.update', ({ features }) => MapUtils.handleDrawEvent(map, features, actions));

        map.on('zoomend', () => MapUtils.setZoomLevel(map, actions));
        map.on('moveend', () => MapUtils.setLonLat(map, actions));

        await actions.loadGeoJSON();

        map.once('styledata', () => {
          MapUtils.updateSourcesAndLayers(appState, actions, map);
          MapUtils.updateSatellite(appState, map);
        });
      });
    },
    // Executes on every redraw
    onupdate: ({ attrs: { state: appState, actions } }) => {
      if (!map.loaded()) return;
      // Check if drawings should be removed from the map
      if (appState.app.clearDrawing.delete) {
        draw.delete(appState.app.clearDrawing.id);
        actions.drawingCleared();
      }

      // Update the grid if necessary
      if (appState.app.gridOptions.updateGrid) {
        MapUtils.updateGrid(appState, actions, map);
      }

      // Check if basemap should be switched
      // if (token && !map.getStyle().sprite?.includes(appState.app.mapStyle)) {
      //   MapUtils.switchBasemap(map, appState.app.mapStyle).catch();
      // }

      MapUtils.updateSourcesAndLayers(appState, actions, map);
      MapUtils.updateSatellite(appState, map);
    },
  };
};
