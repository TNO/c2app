import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
export * from './page';

/** Extended feature collection, with several additional properties */
export interface FeatureCollectionExt<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends FeatureCollection<G, P> {
  /** Unique ID */
  id: string;
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