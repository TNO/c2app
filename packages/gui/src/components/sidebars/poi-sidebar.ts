import m from 'mithril';
import { MeiosisComponent } from '../../services/meiosis';
import { addOrUpdateFeature, toSourceName } from '../map/map-utils';
import { FormAttributes, LayoutForm, UIForm } from 'mithril-ui-form';

type LayerSourceDef = {
  sourceName: string;
  layerStyleId: number;
};

type PoiSourceDef = {
  sourceId: string;
};

export const poiSidebar: MeiosisComponent = () => {
  let poiSourceDef = {} as PoiSourceDef;
  let formValid = false;

  return {
    view: ({ attrs: { state, actions } }) => {
      const {
        app: { clickedFeature, sources, sidebarMode, layerStyles = [], editSourceId },
      } = state;
      const { saveSource, update } = actions;

      const curSources = sources.filter((s) => s.shared).map((s) => ({ id: s.id, label: s.sourceName }));
      poiSourceDef.sourceId = editSourceId || curSources.length === 1 ? curSources[0].id : '';
      formValid = poiSourceDef.sourceId ? true : false;

      const sourceName = clickedFeature && clickedFeature.source;
      const source =
        sidebarMode === 'CREATE_POI'
          ? sources.find((s) => s.id === poiSourceDef.sourceId)
          : sources.find((s) => toSourceName(s) === sourceName);
      const layerStyle = source && source.source && layerStyles.find((s) => s.id === source.source.layerStyle);
      const iconOpts =
        layerStyle && layerStyle.icons ? layerStyle.icons.map(([name, img]) => ({ id: img, label: name })) : [];
      const shared = (source && source.shared) || false;
      const geometryType = clickedFeature?.geometry.type;
      const simpleStyleType =
        !shared || !geometryType
          ? undefined
          : geometryType === 'Point' || geometryType === 'MultiPoint'
          ? 'Point'
          : geometryType === 'LineString' || geometryType === 'MultiLineString'
          ? 'LineString'
          : geometryType === 'Polygon' || geometryType === 'MultiPolygon'
          ? 'Polygon'
          : undefined;

      const ui = source && source.ui ? [...source.ui] : ([] as UIForm<Record<string, any>>);
      ui.push({ id: 'id', type: 'autogenerate', autogenerate: 'id' });
      switch (simpleStyleType) {
        case 'Point':
          ui.push({ label: 'Icon', id: 'marker-symbol', type: 'select', options: iconOpts });
          break;
        case 'LineString':
          ui.push(
            { label: 'Stroke color', id: 'stroke', type: 'color', value: '#555555' },
            { label: 'Stroke opacity', id: 'stroke-opacity', type: 'number', min: 0, max: 1, step: 0.05 },
            { label: 'Stroke width', id: 'stroke-width', type: 'number', min: 1, step: 0.5 }
          );
          break;
        case 'Polygon':
          ui.push(
            { label: 'Stroke color', id: 'stroke', type: 'color', value: '#555555' },
            { label: 'Stroke opacity', id: 'stroke-opacity', type: 'number', min: 0, max: 1, step: 0.05 },
            { label: 'Stroke width', id: 'stroke-width', type: 'number', value: 1, min: 1, step: 0.5 },
            { label: 'Fill color', id: 'fill', type: 'color', value: '#555555' },
            { label: 'Fill opacity', id: 'fill-opacity', type: 'number', min: 0, max: 1, step: 0.05 }
          );
          break;
      }
      const form =
        clickedFeature &&
        (shared
          ? ui
          : ui.filter(
              ({ id = '' }) =>
                !id ||
                (clickedFeature.properties.hasOwnProperty(id) && typeof clickedFeature.properties[id] !== 'undefined')
            ));

      const curStyles = layerStyles.map((s, i) => ({ id: i, label: s.name }));

      return m(
        'ul#slide-out-2.sidenav.no-autoinit',
        m('.row', [
          sidebarMode === 'CREATE_POI' &&
            m('.col.s12', [
              m(LayoutForm, {
                form: [
                  {
                    required: true,
                    id: 'sourceId',
                    label: 'Select layer',
                    type: 'select',
                    disabled: curSources.length <= 1,
                    options: curSources,
                  },
                ],
                obj: poiSourceDef,
                onchange: () => {
                  const { sourceId } = poiSourceDef;
                  update({ app: { editSourceId: sourceId } });
                },
              } as FormAttributes<PoiSourceDef>),
              ,
            ]),
          m(
            '.col.s12',
            form && [
              m(LayoutForm, {
                disabled: !formValid,
                form,
                obj: clickedFeature.properties,
                onchange: async () => {
                  if (source && source.source) {
                    console.log(clickedFeature);
                    source.source = addOrUpdateFeature(source.source, clickedFeature);
                    await saveSource(source);
                  }
                },
              } as FormAttributes<Record<string, any>>),
            ]
          ),
        ])
      );
    },
    oncreate: () => {
      const elem = document.getElementById('slide-out-2') as HTMLElement;
      elem &&
        M.Sidenav.init(elem, {
          edge: 'right',
          onOpenStart: function (_elem: Element) {
            // @ts-ignore
            // elem.M_Sidenav._overlay.remove();
          },
        });
    },
  };
};
