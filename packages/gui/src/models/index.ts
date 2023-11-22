import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { MapGeoJSONFeature } from 'maplibre-gl';
import { uniqueId } from 'mithril-materialized';
import { UIForm } from 'mithril-ui-form';
import { LayerStyle } from 'c2app-models-utils';
import { defaultLayerStyle } from '../components/map/default-layer-style';
import { clone } from '../utils';
import { AnyLayer } from 'mapbox-gl';
export * from './page';

export type FeatureCollectionProps = {
  $loki?: number;
  /** Session ID of the last user that edited it */
  lastEditedBy: string;
  /** Identifier of the source layer: layers with identical ID are overwritten */
  layerId: string;
  /** Name of the source layer: may be used in legend */
  layerName: string;
  /** Layer style ID, determines visual appearance of map layer */
  layerStyle: string;
  /** Allow others to edit the layer */
  layerShared: boolean;
  /** Allow others to delete the layer, @default false */
  layerCanDelete: boolean;
  /** Layer description */
  layerDesc: string;
};

/** Extended feature collection, with several additional properties */
export interface FeatureCollectionExt<G extends Geometry | null = Geometry, P = GeoJsonProperties>
  extends FeatureCollection<G, P> {
  $loki?: number;
  /** Session ID of the last user that edited it */
  lastEditedBy?: string;
  /** Identifier of the source layer: layers with identical ID are overwritten */
  layerId?: string;
  /** Name of the source layer: may be used in legend */
  layerName?: string;
  /** Layer style name, determines visual appearance of map layer */
  layerStyle?: string;
  /** Allow others to edit the layer */
  layerShared?: boolean;
  /** Allow others to delete the layer, @default false */
  layerCanDelete?: boolean;
  /** Layer description */
  layerDesc?: string;
}

export interface ILayer {
  // layerName: string;
  showLayer: boolean;
  type: AnyLayer;
  // layout?: Partial<SymbolLayoutProps>;
  // paint?: LinePaintProps | Record<string, any>;
  // filter?: any[];
}

export const layerStyleToLayers = (layerStyle: LayerStyle<any>): ILayer[] => {
  const { layers = [] } = layerStyle;
  return clone(layers) as ILayer[];
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
  canDelete?: boolean;
  ui: UIForm<Record<string, any>>;
}

export const newSource = (sourceName: string, layerStyle: LayerStyle<any>) => {
  const id = uniqueId();
  return {
    id,
    sourceName,
    sourceCategory: SourceType.realtime,
    layers: layerStyleToLayers(layerStyle),
    ui: clone(layerStyle.ui || ([] as UIForm<Record<string, any>>)),
    shared: true,
    canDelete: true,
    source: {
      layerId: id,
      layerName: sourceName,
      layerStyle: layerStyle.id || defaultLayerStyle.id,
      layerShared: true,
      layerCanDelete: true,
      type: 'FeatureCollection',
      features: [],
    } as FeatureCollectionExt,
  } as ISource;
};

export type SidebarMode = 'NONE' | 'EDIT_POI' | 'CREATE_POI';

export type SafrFeatureStateKeys = 'isSelected' | 'hover';

export type SafrFeatureState = Record<SafrFeatureStateKeys, boolean>;

/**
 * An extended geojson feature used by the events to return data to the listener
 */
export type SafrMapGeoJSONFeature = MapGeoJSONFeature & {
  state: Record<SafrFeatureStateKeys, boolean>;
};
