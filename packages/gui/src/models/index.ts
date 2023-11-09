import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { LayerSpecification, LinePaintProps, SymbolLayoutProps } from 'maplibre-gl';
import { uniqueId } from 'mithril-materialized';
import { UIForm } from 'mithril-ui-form';
import { defaultLayerStyle } from '../components/map/map-utils';
import { LayerStyle } from 'c2app-models-utils';
export * from './page';

/** Extended feature collection, with several additional properties */
export interface FeatureCollectionExt<G extends Geometry | null = Geometry, P = GeoJsonProperties>
  extends FeatureCollection<G, P> {
  /** Unique ID */
  id?: string;
  /** Identifier of the map layer: layers with identical ID are overwritten */
  layerId?: string;
  /** Name of the map layer: may be used in legend */
  layerName?: string;
  /** Layer style name, determines visual appearance of map layer */
  layerStyle?: string;
  /** Allow others to edit the layer */
  layerShared?: boolean;
  /** Layer description */
  layerDesc?: string;
}

export interface ILayer {
  layerName: string;
  showLayer: boolean;
  type: LayerSpecification;
  layout?: Partial<SymbolLayoutProps>;
  paint?: LinePaintProps | Record<string, any>;
  filter?: any[];
}

export const layerStyleToLayers = (layerStyle: LayerStyle<any>): ILayer[] => {
  const { layers = [] } = layerStyle;
  return layers as ILayer[];
};

export const enum SourceType {
  'realtime',
  'grid',
  'custom',
  'alert',
  'chemical_incident',
  'plume',
}

export interface ISource {
  id: string;
  source: FeatureCollectionExt;
  sourceName: string;
  dts?: Array<number>;
  sourceCategory: SourceType;
  layers: ILayer[];
  shared: boolean;
  shareWith?: string[];
  ui: UIForm<Record<string, any>>;
}

export const newSource = (source?: Partial<ISource>) => {
  return {
    id: uniqueId(),
    source: { type: 'FeatureCollection', features: [] } as FeatureCollection,
    sourceName: '',
    sourceCategory: SourceType.realtime,
    layers: defaultLayerStyle.layers,
    shared: true,
    ui: defaultLayerStyle.ui,
    ...source,
  } as ISource;
};

export type SidebarMode = 'NONE' | 'EDIT_POI' | 'CREATE_POI';
