import m, { FactoryComponent } from 'mithril';
import Stream from 'mithril/stream';
import { merge } from '../utils/mergerino';
import { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { Socket } from './socket';
import {
  IAlert,
  IAssistanceResource,
  IChemicalIncident,
  IChemicalIncidentControlParameters,
  IChemicalIncidentScenario,
  IGridOptions,
  IGroup,
  IMessage,
  ISensor,
  LayerStyle,
  SafrConfig,
  uuid4,
} from 'c2app-models-utils';
// @ts-ignore
import ch from '../ch.json';
import { routingSvc } from './routing-service';
import { FeatureCollectionExt, ILayer, ISource, Pages, SidebarMode, SourceType } from '../models';
import { GeoJSONFeature } from 'maplibre-gl';
import { layerStylesSvc } from './layer_style_svc';
import { restServiceFactory } from './rest-service';
import { defaultLayerStyle, featureCollectionToSource, updateSourcesAndLayers } from '../components/map/map-utils';
import { configSvc } from './config_svc';

const ZOOM_LEVEL = 'SAFR_ZOOM_LEVEL';
const LON_LAT = 'SAFR_LON_LAT';

export interface IAppModel {
  app: {
    // Core~
    config: SafrConfig;
    socket: Socket;
    sessionID: string;

    // Alerts
    alerts: Array<IAlert>;
    alert?: IAlert;

    // Clicking/Selecting
    showLegend: boolean;
    clickedFeature?: GeoJSONFeature & { source?: string };
    selectedFeatures?: FeatureCollection;
    cleanDrawLayer: boolean;
    latestDrawing: Feature;
    // clearDrawing: {
    //   delete: boolean;
    //   id: string;
    // };

    // Groups
    groups: Array<IGroup>;
    editGroup: number;

    // Profile
    profile: '' | 'commander' | 'firefighter';
    callsign?: string;

    // Chat
    messages: Map<string, Array<IMessage>>;
    chat?: IGroup;
    newMessages: { [key: string]: number };

    // Layers/styles
    sidebarMode: SidebarMode;
    map: maplibregl.Map;
    draw: MapboxDraw;
    layerStyles?: LayerStyle<Record<string, any>>[];
    sources: Array<ISource>;
    mapStyle: string;
    switchStyle: boolean;
    gridOptions: IGridOptions;
    /** Source ID that is being edited */
    editSourceId: string;
    resourceDict: { [id: string]: IAssistanceResource };
    sensorDict: { [id: string]: ISensor };
    showSatellite: boolean;

    // CHT
    source: {
      scenario: IChemicalIncidentScenario;
      control_parameters: IChemicalIncidentControlParameters;
    };
  };
}

export interface IActions {
  update: (value: Partial<ModelUpdateFunction>) => void;
  // Utils
  switchToPage: (
    pageId: Pages,
    params?: { [key: string]: string | number | undefined },
    query?: { [key: string]: string | number | undefined }
  ) => void;

  // Core
  // clearDrawing: () => void;
  createPOI: () => void;

  // Alerts
  openAlert: (alert: IAlert) => void;

  // Clicking/selecting
  updateClickedFeature: (feature: GeoJSONFeature, mode: SidebarMode) => void;
  updateSelectedFeatures: (features: Array<Feature>) => void;
  resetClickedFeature: () => void;

  // Groups
  initGroups: () => void;
  createGroup: (name: string) => void;
  updateGroup: (index: number, name: string) => void;
  deleteGroup: (group: IGroup) => void;
  setGroupEdit: (index: number) => void;

  // Profile
  updateProfile: (data: string) => void;
  updateCallsign: (data: string) => void;

  // Chat
  openChat: (group: IGroup) => void;
  sendChat: (group: IGroup, message: string) => void;

  // Layers/styles'
  toggleLegend: () => void;
  loadGeoJSON: () => Promise<void>;
  // loadLayerStyles: () => Promise<void>;
  setMap: (map: maplibregl.Map, draw: MapboxDraw) => void;
  clearDrawLayer: () => void;
  setZoomLevel: (zoomLevel: number) => void;
  getZoomLevel: () => number;
  setLonLat: (lonlat: [lon: number, lat: number]) => void;
  getLonLat: () => [lon: number, lat: number];
  updateLayerVisibility: (sourceId: string, layerName: string, visibility: boolean) => void;
  downloadSourceAsGeoJSON: (source: ISource) => void;
  saveSource: (source: ISource) => Promise<void>;
  deleteSource: (source: ISource) => Promise<void>;
  switchStyle: (style: string) => void;
  toggleLayer: (sourceIndex: number, layerIndex: number) => void;
  updateGridLocation: (bbox: [number, number, number, number]) => void;
  updateGridOptions: (gridCellSize: number, updateLocation: boolean) => void;
  updateGrid: (gridSource: FeatureCollection, gridLabelSource: FeatureCollection) => void;
  createCustomLayer: (layerName: string, icon: string, checked: boolean, shareWith: string[]) => void;
  updateCustomLayers: (layerName: string, icon: string, checked: boolean, shareWith: string[]) => void;
  addDrawingsToLayer: (index: number) => void;
  updateDrawings: (feature: Feature) => void;
  deleteLayer: (sourceIndex: number) => void;
  setLayerEdit: (sourceIndex: string) => void;
  toggleSatellite: () => void;

  // CHT
  createCHT: (hazard: Partial<IChemicalIncident>, location: number[]) => void;
  updateCHT: (chemicalIncident: IChemicalIncident) => void;
  setCHOpacities: (val: number, name: string) => void;

  // Populator
  createPopulatorRequest: () => void;
}

const geojsonSvc = restServiceFactory<FeatureCollectionExt>('messages/geojson');

export type ModelUpdateFunction = Partial<IAppModel> | ((model: Partial<IAppModel>) => Partial<IAppModel>);
export type UpdateStream = Stream<Partial<ModelUpdateFunction>>;
const update = Stream<ModelUpdateFunction>();

export type MeiosisComponent<T extends { [key: string]: any } = {}> = FactoryComponent<{
  state: IAppModel;
  actions: IActions;
  options?: T;
}>;

/** Application state */
export const appState = {
  initial: {
    app: {
      // Core
      sessionID: '',
      // socket: new Socket(update),

      // Alerts
      alerts: [] as Array<IAlert>,

      // Clicking/Selecting
      latestDrawing: {} as Feature,
      cleanDrawLayer: false,
      // clearDrawing: {
      //   delete: false,
      //   id: '',
      // },

      // Groups
      groups: Array<IGroup>(),

      // Profile
      profile: '',

      // Chat
      messages: new Map<string, Array<IMessage>>(),
      newMessages: {} as { [key: string]: number },

      // Layers/styles
      showLegend: false,
      sidebarMode: 'NONE',
      layerStyles: undefined,
      sources: [] as Array<ISource>,
      mapStyle: 'mapbox/streets-v11',
      gridOptions: {
        gridCellSize: 0.5,
        updateLocation: false,
        gridLocation: [5.46, 51.42, 5.5, 51.46],
        updateGrid: true,
      } as IGridOptions,
      resourceDict: {} as { [id: string]: IAssistanceResource },
      sensorDict: {} as { [id: string]: ISensor },
      showSatellite: false,

      // CHT
      source: {
        scenario: {} as IChemicalIncidentScenario,
        control_parameters: {} as IChemicalIncidentControlParameters,
      },
    },
  } as Partial<IAppModel>,
  actions: (update: UpdateStream, states: Stream<IAppModel>): IActions => {
    return {
      update: (value) => update(value),
      // Utils
      switchToPage: (
        pageId: Pages,
        params?: { [key: string]: string | number | undefined },
        query?: { [key: string]: string | number | undefined }
      ) => {
        routingSvc.switchTo(pageId, params, query);
      },

      // Core
      toggleLegend: () => {
        const { showLegend } = states().app;
        update({ app: { showLegend: !showLegend } });
      },
      loadGeoJSON: async () => {
        console.log('LOADING GEOJSON');
        const layerStyles = (await layerStylesSvc.loadStyles()) || [];
        layerStyles.push(defaultLayerStyle);
        const { socket, map } = states().app;
        socket.setLayerStyles(layerStyles);
        const sources = (await geojsonSvc.loadList()).map((source) => featureCollectionToSource(source, layerStyles));
        console.log(sources);
        updateSourcesAndLayers(sources, actions, map);
        update({
          app: {
            layerStyles: () => layerStyles,
            sources: () => sources,
          },
        });
        setTimeout(() => m.redraw(), 1000);
      },
      // clearDrawing: () => {
      //   update({
      //     app: {
      //       clearDrawing: { delete: false, id: '' },
      //       drawings: undefined,
      //     },
      //   });
      // },
      createPOI: () => {
        update({
          app: {
            gridOptions: { updateGrid: true },
          },
        });
      },

      // Alerts
      openAlert: (alert: IAlert) => {
        update({
          app: {
            alert: () => {
              return alert;
            },
          },
        });
      },

      setCHOpacities: (val: number, name: string) => {
        update({
          app: {
            sources: (sources: Array<ISource>) => {
              sources.forEach((source: ISource) => {
                if (source.sourceName + source.id !== name) return;

                let deltaTime_values = source.dts as Array<number>;

                const dt_len = deltaTime_values.length;
                // assign opacities > 0 to the two deltaTimes surrounding v
                let i1: number = 0;
                let i2: number = 0;
                let opacity1: number = 0.1;
                let opacity2: number = 0.1;
                if (val <= deltaTime_values[0]) {
                  i1 = 0;
                  i2 = -1;
                  opacity1 = 1;
                } else if (val >= deltaTime_values[dt_len - 1]) {
                  i1 = dt_len - 1;
                  opacity1 = 1;
                } else {
                  let i: number;
                  for (i = 0; i < dt_len - 1; i++) {
                    if (val >= deltaTime_values[i] && val <= deltaTime_values[i + 1]) {
                      i1 = i;
                      i2 = i1 + 1;
                      const d1 = val - deltaTime_values[i];
                      const d2 = deltaTime_values[i + 1] - val;
                      opacity1 = 1 - d1 / (d1 + d2);
                      opacity2 = 1 - d2 / (d1 + d2);
                    }
                  }
                }
                // assign opacity > 0 to the two deltaTimes surrounding v
                const opacityCalc = (dt = 0) => {
                  const index = deltaTime_values.indexOf(dt);
                  if (index == i1) {
                    return opacity1;
                  } else if (opacity1 < 1 && index == i2) {
                    return opacity2;
                  } else {
                    return 0.05;
                  }
                };
                // TODO FIX
                source.layers.forEach((layer: ILayer, index: number) => {
                  if (layer.paint) layer.paint['line-opacity'] = opacityCalc((source.dts as Array<number>)[index]);
                });
              });
              return sources;
            },
          },
        });
      },

      // Clicking/selecting
      updateClickedFeature: (feature: GeoJSONFeature & { source?: string }, mode) => {
        const f = {
          id: feature.id,
          type: feature.type,
          geometry: feature.geometry || feature._geometry,
          properties: feature.properties || [],
          source: feature.source,
        } as GeoJSONFeature & { source?: string };
        console.log(f);
        update({ app: { clickedFeature: () => f, editSourceId: f.source, sidebarMode: mode } });
      },
      updateSelectedFeatures: (features: Array<Feature>) => {
        update({ app: { selectedFeatures: { type: 'FeatureCollection', features: features } } });
      },
      resetClickedFeature: () => {
        update({ app: { clickedFeature: undefined } });
      },

      //Groups
      initGroups: async () => {
        const result = await states()['app'].socket.serverInit(states());
        update({
          app: {
            groups: () => {
              return result;
            },
            newMessages: (messages: { [key: string]: number }) => {
              result.forEach((group: IGroup) => {
                messages[group.id] = 0;
              });
              return messages;
            },
          },
        });
      },
      createGroup: async (name: string) => {
        update({
          app: {
            clearDrawing: { delete: true, id: states()['app'].latestDrawing.id },
          },
        });
        if (!states()['app'].selectedFeatures) return;
        const result = await states()['app'].socket.serverCreate(states(), name);
        update({
          app: {
            groups: () => {
              return result;
            },
            newMessages: (messages: { [key: string]: number }) => {
              result.forEach((group: IGroup) => {
                if (!messages[group.id]) messages[group.id] = 0;
              });
              return messages;
            },
          },
        });
      },
      updateGroup: async (index: number, name: string) => {
        const group = states()['app'].groups[index];
        const result = await states()['app'].socket.serverUpdate(states(), group.id, name);
        update({
          app: {
            groups: () => {
              return result;
            },
            newMessages: (messages: { [key: string]: number }) => {
              result.forEach((group: IGroup) => {
                if (!messages[group.id]) messages[group.id] = 0;
              });
              return messages;
            },
          },
        });
      },
      deleteGroup: async (group: IGroup) => {
        const result = await states()['app'].socket.serverDelete(states(), group.id);
        update({
          app: {
            groups: () => {
              return result;
            },
          },
        });
      },

      // Profile
      updateProfile: (data: string) => {
        update({
          app: {
            profile: () => {
              return data;
            },
          },
        });
      },
      updateCallsign: (data: string) => {
        update({
          app: {
            callsign: () => {
              return data;
            },
          },
        });
      },

      // Chat
      openChat: (group: IGroup) => {
        update({
          app: {
            chat: () => {
              return group;
            },
            newMessages: (messages: { [key: string]: number }) => {
              messages[group.id] = 0;
              return messages;
            },
          },
        });
      },
      sendChat: (group: IGroup, message: string) => {
        states()['app'].socket.serverSend(states(), group, message);
      },
      setGroupEdit: (index: number) => {
        update({
          app: {
            editGroup: index,
          },
        });
      },

      // Layers/style
      setMap: (map, draw) => update({ app: { map: () => map, draw: () => draw } }),
      clearDrawLayer: () => {
        const { draw } = states().app;
        if (draw) draw.deleteAll();
      },
      setZoomLevel: (zoomLevel: number) => {
        localStorage.setItem(ZOOM_LEVEL, zoomLevel.toString());
      },
      getZoomLevel: () => +(localStorage.getItem(ZOOM_LEVEL) || 4),
      setLonLat: (lonlat: [lon: number, lat: number]) => {
        localStorage.setItem(LON_LAT, JSON.stringify(lonlat));
      },
      getLonLat: () => JSON.parse(localStorage.getItem(LON_LAT) || '[5, 53]') as [lon: number, lat: number],
      downloadSourceAsGeoJSON: (source) => {
        if (!source || !source.source || !source.source.$loki) return;
        console.log(source);
        const { features, type, bbox } = source.source;
        // Assume jsonData is your JSON data obtained from the REST service
        const jsonData = { features, type, bbox };
        // Convert JSON data to a Blob
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `safr_${source.sourceName}.json`.replace(' ', '_').toLowerCase(); // Specify the filename for the downloaded file
        // Append the link to the document
        document.body.appendChild(downloadLink);
        // Trigger a click on the link to start the download
        downloadLink.click();
        // Remove the link from the document
        document.body.removeChild(downloadLink);
      },
      saveSource: async (source: ISource) => {
        if (!source || !source.source) return;
        source.source.lastEditedBy = states().app.sessionID;
        const updatedSource = await geojsonSvc.save(source.source);
        if (updatedSource) source.source = updatedSource;
        update({
          app: {
            sources: (sources: ISource[]) => {
              const found = sources.find((s) => s.id === source.id);
              if (found) {
                sources.map((s) => (s.id === source.id ? source : s));
              } else {
                sources.push(source);
              }
              updateSourcesAndLayers(sources, actions, states().app.map);
              return sources;
            },
          },
        });
      },
      deleteSource: async (source: ISource) => {
        if (!source || !source.source || !source.source.$loki) return;
        const { $loki } = source.source;
        console.log(source);
        await geojsonSvc.del($loki);
        update({
          app: {
            sources: (sources: ISource[]) => sources.filter((s) => s.source.$loki !== $loki),
          },
        });
      },
      updateLayerVisibility: (sourceId: string, layerName: string, visibility: boolean) => {
        update({
          app: {
            sources: (sources: ISource[]) => {
              sources.forEach((curSource) => {
                if (curSource.id === sourceId) {
                  curSource.layers.forEach((curLayer) => {
                    if (curLayer.layerName === layerName) {
                      curLayer.showLayer = visibility;
                    }
                  });
                }
              });
              return sources;
            },
          },
        });
      },
      switchStyle: (style: string) => {
        update({
          app: {
            mapStyle: style,
          },
        });
      },
      toggleLayer: (sourceIndex: number, layerIndex: number) => {
        update({
          app: {
            sources: (sources: Array<ISource>) => {
              // Toggle all layers of a source
              if (layerIndex === -1) {
                sources[sourceIndex].layers.forEach((layer: ILayer) => {
                  layer.showLayer = !layer.showLayer;
                });
                return sources;
              }
              // Toggle one layer (layerIndex) of a source
              else {
                sources[sourceIndex].layers[layerIndex].showLayer = !sources[sourceIndex].layers[layerIndex].showLayer;
                return sources;
              }
            },
          },
        });
      },
      updateGridOptions: (gridCellSize: number, updateLocation: boolean) => {
        update({
          app: {
            gridOptions: { gridCellSize: gridCellSize, updateLocation: updateLocation, updateGrid: true },
          },
        });
      },
      updateGridLocation: (bbox: [number, number, number, number]) => {
        update({
          app: {
            gridOptions: { gridLocation: bbox },
          },
        });
      },
      updateGrid: (gridSource: FeatureCollection, gridLabelSource: FeatureCollection) => {
        update({
          app: {
            gridOptions: { updateGrid: false },
            sources: (sources: Array<ISource>) => {
              const gridIndex = sources.findIndex((source: ISource) => {
                return source.sourceName === 'GridSource';
              });
              if (gridIndex > -1) {
                sources[gridIndex].source = gridSource;
              } else {
                sources.push({
                  id: 'customGrid',
                  source: gridSource as FeatureCollection,
                  sourceName: 'GridSource',
                  sourceCategory: SourceType.grid,
                  shared: false,
                  layers: [
                    {
                      layerName: 'Grid',
                      showLayer: false,
                      type: { type: 'line' } as mapboxgl.AnyLayer,
                      paint: {
                        'line-opacity': 0.5,
                      },
                    },
                  ] as ILayer[],
                } as ISource);
              }

              const labelIndex = sources.findIndex((source: ISource) => {
                return source.sourceName === 'GridLabelSource';
              });
              if (labelIndex > -1) {
                sources[labelIndex].source = gridLabelSource;
              } else {
                sources.push({
                  id: 'customGrid',
                  source: gridLabelSource as FeatureCollection,
                  sourceName: 'GridLabelSource',
                  sourceCategory: SourceType.grid,
                  shared: false,
                  layers: [
                    {
                      layerName: 'Grid Labels',
                      showLayer: false,
                      type: { type: 'symbol' } as mapboxgl.AnyLayer,
                      layout: {
                        'text-field': '${cellLabel}',
                        'text-allow-overlap': true,
                        'text-font': ['Noto Sans Regular'],
                      } as any, // TODO FIX
                      paint: {
                        'text-opacity': 0.5,
                      },
                    },
                  ] as ILayer[],
                } as ISource);
              }
              return sources;
            },
          },
        });
      },
      createCustomLayer: (layerName: string, icon: string, checked: boolean, shareWith: string[]) => {
        update({
          app: {
            sources: (sources: Array<ISource>) => {
              const gridIndex = sources.findIndex((source: ISource) => {
                return source.sourceName === layerName;
              });
              if (gridIndex > -1) return sources;
              sources.push({
                id: 'testid5',
                source: { type: 'FeatureCollection', features: [] } as FeatureCollection,
                sourceName: layerName,
                sourceCategory: SourceType.custom,
                shared: checked,
                shareWith: shareWith,
                layers: [
                  {
                    layerName: layerName,
                    showLayer: true,
                    type: { type: 'symbol' } as mapboxgl.AnyLayer,
                    layout: {
                      'icon-image': icon,
                      'icon-size': icon === 'ground' ? 0.1 : icon === 'air' ? 0.25 : 0.5,
                      'icon-allow-overlap': true,
                    } as any, // TODO FIX
                  },
                ] as ILayer[],
              } as ISource);
              return sources;
            },
          },
        });
      },
      updateCustomLayers: (layerName: string, _icon: string, _checked: boolean, _shareWith: string[]) => {
        update({
          app: {
            customLayers: (layers: Array<[string, boolean]>) => {
              layers.push([layerName, false] as [string, boolean]);
              return layers;
            },
            customSources: (sources: Array<FeatureCollection>) => {
              sources.push({
                type: 'FeatureCollection',
                features: [] as Feature[],
              } as FeatureCollection);
              return sources;
            },
          },
        });
      },
      addDrawingsToLayer: (index: number) => {
        update({
          app: {
            sources: (sources: Array<ISource>) => {
              sources[index].source.features.push(states()['app'].latestDrawing as Feature);
              return sources;
            },
            clearDrawing: {
              delete: true,
              id: states()['app'].latestDrawing.id,
            },
          },
        });
      },
      updateDrawings: (feature: Feature) => {
        update({ app: { latestDrawing: () => feature } });
      },
      deleteLayer: (sourceIndex: number) => {
        update({
          app: {
            sources: (sources: Array<ISource>) => {
              sources.splice(sourceIndex, 1);
              return sources;
            },
          },
        });
      },
      setLayerEdit: (sourceIndex: string) => {
        update({ app: { editSourceId: sourceIndex } });
      },
      toggleSatellite: () => {
        update({
          app: {
            showSatellite: !states()['app'].showSatellite,
          },
        });
      },

      //CHT, fix to make this a cht.start message
      createCHT: (hazard: Partial<IChemicalIncident>, location: number[]) => {
        (hazard.scenario as IChemicalIncidentScenario).source_location = location;
        (hazard.scenario as IChemicalIncidentScenario).source_location[2] = 0;
        hazard._id = uuid4();
        hazard.context = 'CTXT20200101100000';

        states()['app'].socket.serverCHT(hazard);
        update({
          app: {
            clearDrawing: {
              delete: true,
              id: states()['app'].latestDrawing.id,
            },
            sources: (sources: ISource[]) => {
              const fc = {
                type: 'FeatureCollection',
                features: [
                  {
                    geometry: {
                      type: 'Point',
                      coordinates: hazard.scenario?.source_location,
                    } as Geometry,
                    properties: {
                      type: 'incidentLocation',
                      scenario: hazard.scenario as IChemicalIncidentScenario,
                      control_parameters: hazard.control_parameters as IChemicalIncidentControlParameters,
                      context: hazard.context,
                      timestamp: hazard.timestamp,
                      id: hazard._id,
                    } as GeoJsonProperties,
                  } as Feature,
                ] as Feature[],
              } as FeatureCollection;

              const index = sources.findIndex((source: ISource) => {
                return source.id === hazard._id && source.sourceName === 'IncidentLocation' + hazard._id;
              });

              if (index > -1) {
                sources[index].source = fc as FeatureCollection;
              } else {
                sources.push({
                  id: hazard._id,
                  source: fc as FeatureCollection,
                  sourceName: 'IncidentLocation' + hazard._id,
                  sourceCategory: SourceType.chemical_incident,
                  shared: false,
                  layers: [
                    {
                      layerName: 'Incident',
                      showLayer: true,
                      type: { type: 'symbol' } as mapboxgl.AnyLayer,
                      layout: {
                        'icon-image': 'chemical',
                        'icon-size': 0.5,
                        'icon-allow-overlap': true,
                      } as any, // TODO FIX
                    },
                  ] as ILayer[],
                } as ISource);
              }
              return sources;
            },
          },
        });
      },

      updateCHT: (chemicalIncident: IChemicalIncident) => {
        states()['app'].socket.serverCHT(chemicalIncident);
        update({
          app: {
            clearDrawing: {
              delete: true,
              id: states()['app'].latestDrawing.id,
            },
            sources: (sources: ISource[]) => {
              const fc = {
                type: 'FeatureCollection',
                features: [
                  {
                    geometry: {
                      type: 'Point',
                      coordinates: chemicalIncident.scenario?.source_location,
                    } as Geometry,
                    properties: {
                      type: 'incidentLocation',
                      scenario: chemicalIncident.scenario as IChemicalIncidentScenario,
                      control_parameters: chemicalIncident.control_parameters as IChemicalIncidentControlParameters,
                      context: chemicalIncident.context,
                      timestamp: chemicalIncident.timestamp,
                      id: chemicalIncident._id,
                    } as GeoJsonProperties,
                  } as Feature,
                ] as Feature[],
              } as FeatureCollection;

              const index = sources.findIndex((source: ISource) => {
                return (
                  source.id === chemicalIncident._id && source.sourceName === 'IncidentLocation' + chemicalIncident._id
                );
              });

              if (index > -1) {
                sources[index].source = fc as FeatureCollection;
              } else {
                sources.push({
                  id: chemicalIncident._id,
                  source: fc as FeatureCollection,
                  sourceName: 'IncidentLocation' + chemicalIncident._id,
                  sourceCategory: SourceType.chemical_incident,
                  shared: false,
                  layers: [
                    {
                      layerName: 'Incident',
                      showLayer: true,
                      type: { type: 'symbol' } as mapboxgl.AnyLayer,
                      layout: {
                        'icon-image': 'chemical',
                        'icon-size': 0.5,
                        'icon-allow-overlap': true,
                      } as any, // TODO FIX
                    },
                  ] as ILayer[],
                } as ISource);
              }
              return sources;
            },
          },
        });
      },

      createPopulatorRequest: async () => {
        const result = (await states()['app'].socket.serverPopulator(
          states()['app'].latestDrawing
        )) as FeatureCollection;

        update({
          app: {
            sources: (sources: Array<ISource>) => {
              const index = sources.findIndex((source: ISource) => {
                return source.sourceName === 'PopulationService';
              });
              if (index > -1) {
                sources[index].source = result as FeatureCollection;
              } else {
                sources.push({
                  id: 'pop',
                  source: result as FeatureCollection,
                  sourceName: 'PopulationService',
                  sourceCategory: SourceType.realtime,
                  shared: false,
                  layers: [
                    {
                      layerName: 'Population Data',
                      showLayer: true,
                      type: { type: 'line' } as mapboxgl.AnyLayer,
                      paint: {
                        'line-opacity': 0.5,
                      },
                    },
                  ] as ILayer[],
                } as ISource);
              }
              return sources;
            },
          },
        });
      },
    };
  },
};

const app = {
  // Initial state of the appState
  initial: Object.assign({}, appState.initial) as IAppModel,
  // Actions that can be called to update the state
  actions: (us: UpdateStream, states: Stream<IAppModel>) => Object.assign({}, appState.actions(us, states)) as IActions,
  // Services that run everytime the state is updated (so after the action is done)
  services: [] as Array<(s: IAppModel) => Partial<IAppModel> | void>,
  // Effects run from state update until some condition is met (can cause infinite loop)
  effects: (update: UpdateStream, _actions: IActions) =>
    [
      async (state) => {
        if (state.app.config) return;
        const config = await configSvc.getConfig();
        if (!config) return;
        const socket = new Socket(update, config);
        update({ app: { config: () => config, socket: () => socket } });
      },
    ] as Array<(state: IAppModel) => Promise<void> | void>,
};

const runServices = (startingState: IAppModel) =>
  app.services.reduce(
    (state: IAppModel, service: (s: IAppModel) => Partial<IAppModel> | void) => merge(state, service(state)),
    startingState
  );

export const states = Stream.scan((state, patch) => runServices(merge(state, patch)), app.initial, update);
export const actions = app.actions(update, states);

const effects = app.effects(update, actions);
states.map((state) => {
  effects.forEach((effect) => effect(state));
  m.redraw();
});
