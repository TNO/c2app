import m from 'mithril';
import { MeiosisComponent } from '../../services/meiosis';
import { FlatButton, Icon, InputCheckbox, Tabs } from 'mithril-materialized';
import { FormAttributes, LayoutForm } from 'mithril-ui-form';
import { newSource } from '../../models';

type LayerSourceDef = {
  sourceName: string;
  layerStyleId: number;
};

export const legendControl: MeiosisComponent = () => {
  let chosenTab: 'LAYERS' | 'LEGEND' = 'LEGEND';
  let layerSourceDef = {} as LayerSourceDef;
  let formValid = false;

  return {
    view: ({ attrs: { state, actions } }) => {
      const { map, sources, showLegend, layerStyles = [] } = state.app;
      const { toggleLegend, updateLayerVisibility, saveSource, deleteSource, downloadSourceAsGeoJSON } = actions;

      const curStyles = layerStyles.map((s, id) => ({ id, label: s.name }));

      if (!showLegend || !map) {
        return m(Icon, {
          iconName: 'layers',
          className: 'unselectable right legend-control',
          onclick: () => toggleLegend(),
        });
      }

      return m(
        '.row.legend-control.layer-filter',
        m(Icon, {
          iconName: 'layers',
          className: 'unselectable right',
          style: 'position: relative; cursor: pointer; vertical-align: bottom; margin-right: 5px',
          onclick: () => toggleLegend(),
        }),
        m(Tabs, {
          tabs: [
            {
              title: 'Legend',
              active: chosenTab === 'LEGEND',
              vnode: m('.legend', [
                m(
                  'ul.row',
                  sources.map((source) =>
                    m('li.col.s12', [
                      source.sourceName,
                      m(Icon, {
                        title: 'Download GeoJSON',
                        iconName: 'download',
                        className: 'unselectable right',
                        onclick: async () => downloadSourceAsGeoJSON(source),
                      }),
                      source.canDelete &&
                        m(Icon, {
                          iconName: 'delete',
                          className: 'red-text unselectable right',
                          onclick: async () => await deleteSource(source),
                        }),
                      // m(Icon, {
                      //   iconName: source.shared ? 'groups' : 'person',
                      //   className: 'unselectable right',
                      //   style: 'position: relative; cursor: pointer; vertical-align: bottom; margin-right: 5px',
                      // }),
                      m(
                        'ul.row',
                        source.layers.map((l) =>
                          m(
                            'li.col.s12',
                            m(InputCheckbox, {
                              label: l.layerName,
                              checked: l.showLayer,
                              onchange: (v) => {
                                chosenTab = 'LEGEND';
                                console.log(`Show layer ${l.layerName}: ${l.showLayer}`);
                                updateLayerVisibility(source.id, l.layerName, v);
                              },
                            })
                          )
                        )
                      ),
                    ])
                  )
                ),
              ]),
            },
            {
              title: 'New layer',
              active: chosenTab === 'LAYERS',
              vnode: m('.create-layer', [
                [
                  m(LayoutForm, {
                    key: layerSourceDef.layerStyleId,
                    form: [
                      { type: 'md', value: 'Create a new map layer' },
                      { required: true, id: 'sourceName', label: 'Name', type: 'text' },
                      {
                        required: true,
                        id: 'layerStyleId',
                        label: 'Select layer style',
                        type: 'select',
                        options: curStyles,
                      },
                    ],
                    obj: layerSourceDef,
                    onchange: () => {
                      chosenTab = 'LAYERS';
                      const { sourceName, layerStyleId } = layerSourceDef;
                      formValid = sourceName && layerStyleId >= 0 ? true : false;
                    },
                  } as FormAttributes<LayerSourceDef>),
                  m(FlatButton, {
                    key: layerSourceDef.layerStyleId,
                    label: 'Create',
                    iconName: 'create',
                    disabled: !formValid,
                    onclick: () => {
                      chosenTab = 'LEGEND';
                      console.log('CREATING NEW LAYER');
                      console.log(layerSourceDef);
                      const { sourceName, layerStyleId } = layerSourceDef;
                      const layerStyle = layerStyles[layerStyleId];
                      const source = newSource(sourceName, layerStyle);
                      layerSourceDef = {} as LayerSourceDef;
                      formValid = false;
                      console.log(source);
                      saveSource(source);
                    },
                  }),
                ],
              ]),
            },
          ],
        })
      );
    },
  };
};
