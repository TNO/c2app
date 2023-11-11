import m from 'mithril';
import maplibre, { IControl, Map as MaplibreMap } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// @ts-ignore
import { MeiosisComponent } from '../../services/meiosis';
import {
  drawConfig,
  handleDrawEvent,
  loadImages,
  loadMissingImages,
  setLonLat,
  setZoomLevel,
  updateSatellite,
  updateSourcesAndLayers,
} from './map-utils';
import { SafrConfig } from 'c2app-models-utils';
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

  return {
    view: () => {
      return m('#mapboxMap.col.s12.l9.right');
    },
    oncreate: ({ attrs: { state, actions } }) => {
      const { config = {} as SafrConfig } = state.app;
      const { VECTOR_TILE_SERVER } = config;
      const { getLonLat, getZoomLevel, setMap } = actions;
      // Create map and add controls
      map = new MaplibreMap({
        container: 'mapboxMap',
        style: VECTOR_TILE_SERVER
          ? VECTOR_TILE_SERVER
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
        center: getLonLat(),
        zoom: getZoomLevel(),
      });
      loadMissingImages(map);
      loadImages(map);
      // updateGrid(appState, actions, map);

      // Add draw controls
      draw = new MapboxDraw(drawConfig);
      map.addControl(new maplibre.NavigationControl(), 'top-left');
      map.addControl(draw as unknown as IControl, 'top-left');

      // Add map listeners
      map.on('load', () => {
        map.on('draw.create', ({ features }) => handleDrawEvent(map, features, actions));
        map.on('draw.update', ({ features }) => handleDrawEvent(map, features, actions));

        map.on('zoomend', () => setZoomLevel(map, actions));
        map.on('moveend', () => setLonLat(map, actions));

        actions.loadGeoJSON();

        map.once('styledata', () => {
          updateSourcesAndLayers(state, actions, map);
          updateSatellite(state, map);
        });

        setMap(map, draw);
      });
    },
    // Executes on every redraw
    onupdate: ({ attrs: { state, actions } }) => {
      if (!map.loaded()) return;
      console.log('REDRAWING MAP');

      // Update the grid if necessary
      // if (appState.app.gridOptions.updateGrid) {
      //   updateGrid(appState, actions, map);
      // }

      // Check if basemap should be switched
      // if (token && !map.getStyle().sprite?.includes(appState.app.mapStyle)) {
      //   switchBasemap(map, appState.app.mapStyle).catch();
      // }

      updateSourcesAndLayers(state, actions, map);
      updateSatellite(state, map);
    },
  };
};
