import m from 'mithril';
import { MeiosisComponent } from '../../services/meiosis';
import { FlatButton } from 'mithril-materialized';
import { toSourceName } from '../map/map-utils';
import { FormAttributes, LayoutForm, UIForm } from 'mithril-ui-form';

export const poiSidebar: MeiosisComponent = () => {
  return {
    view: ({ attrs: { state, actions } }) => {
      const {
        app: { clickedFeature, sources },
      } = state;

      const sourceName = clickedFeature && clickedFeature.source;
      const source = sources.find((s) => toSourceName(s) === sourceName);
      console.log(source)
      const shared = (source && source.shared) || false;
      const ui = (source && source.ui) || ([] as UIForm);
      const form =
        clickedFeature &&
        (shared
          ? ui
          : ui.filter(
              ({ id = '' }) =>
                !id ||
                (clickedFeature.properties.hasOwnProperty(id) && typeof clickedFeature.properties[id] !== 'undefined')
            ));

      return m(
        'ul#slide-out-2.sidenav.no-autoinit',
        m('.row', [
          m(
            '.col.s12',
            m(FlatButton, {
              className: 'right',
              iconName: 'clear',
              onclick: () => {
                const elem = document.getElementById('slide-out-2') as HTMLElement;
                elem && M.Sidenav.getInstance(elem).close();
                actions.resetClickedFeature();
              },
            })
          ),
          m(
            '.col.s12',
            form && [
              m(LayoutForm, {
                form,
                obj: clickedFeature.properties,
                onchange: async () => {
                  if (source && source.source && source.source.features) {
                    console.log(clickedFeature);
                    const { id } = clickedFeature.properties;
                    source.source.features = source.source.features.map(f => f.properties?.id === id ? clickedFeature : f);
                    await actions.saveSource(source)
                  }
                  
                  // actions.updateClickedFeature(clickedFeature);
                },
              } as FormAttributes),
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
