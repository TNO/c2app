import { IActions, IAppModel, ILayer, ISource, SourceType } from '../../services/meiosis';
import { GeoJSONFeature, GeoJSONSource, LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import { displayInfoSidebar } from './map-utils';

export const updateSourcesAndLayers = (appState: IAppModel, actions: IActions, map: MaplibreMap) => {
  appState.app.sources.filter(s => s.source.features?.length > 0).forEach((source: ISource) => {
    // Set source
    const sourceName = `${source.sourceName}.${source.id}`.toLowerCase().replace(/\s/g, '_');
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
      const layerName = `${sourceName}.${layer.layerName}`.toLowerCase().replace(/\s/g, '_');

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
};
