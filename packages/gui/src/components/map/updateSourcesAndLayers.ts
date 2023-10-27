import { IActions, IAppModel, ILayer, ISource, SourceType } from '../../services/meiosis';
import { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl';

export const updateSourcesAndLayers = (appState: IAppModel, _actions: IActions, map: MaplibreMap) => {
  appState.app.sources.forEach((source: ISource) => {
    // Set source
    const sourceName = source.sourceName.concat(source.id);
    if (!map.getSource(sourceName)) {
      map.addSource(sourceName, {
        type: 'geojson',
        data: source.source,
      });
    } else {
      (map.getSource(sourceName) as GeoJSONSource).setData(source.source);
    }

    // Set Layers
    // TODO FIX
    // source.layers.forEach((layer: ILayer) => {
    //   const layerName = sourceName.concat(layer.layerName);

    //   if (!map.getLayer(layerName)) {
    //     map.addLayer({
    //       id: layerName,
    //       type: layer.type.type,
    //       source: sourceName,
    //       layout: layer.layout ? layer.layout : {},
    //       paint: layer.paint ? layer.paint : {},
    //       filter: layer.filter ? layer.filter : ['all'],
    //     });
    //     map.on('click', layerName, ({ features }) => displayInfoSidebar(features as GeoJSONFeature[], actions));
    //     map.on('mouseenter', layerName, () => (map.getCanvas().style.cursor = 'pointer'));
    //     map.on('mouseleave', layerName, () => (map.getCanvas().style.cursor = ''));
    //   }
    //   map.setLayoutProperty(layerName, 'visibility', layer.showLayer ? 'visible' : 'none');
    //   if (source.sourceCategory === SourceType.alert || source.sourceCategory === SourceType.plume)
    //     layer.paint && map.setPaintProperty(layerName, 'line-opacity', layer.paint['line-opacity']);
    // });
  });
};
