import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
export * from './page';

export interface FeatureCollectionId<G extends Geometry | null = Geometry, P = GeoJsonProperties> extends FeatureCollection<G, P> {
  /** Should be the same ID as the inject.id */
  id: string;
  /** Identifier of the map layer: layers with identical ID are overwritten */
  layerId?: string;
  /** Name of the map layer: may be used in legend */
  layerName?: string;
  /** Layer style name, determines visual appearance of map layer */
  layerStyle?: string;
  /** Layer description */
  layerDesc?: string;
}