// import m from 'mithril';
// import { FormAttributes, LayoutForm, UIForm } from 'mithril-ui-form';
// import { ModalPanel, Tabs } from 'mithril-materialized';
// import { MeiosisComponent } from '../../../services/meiosis';
// import { layerStyleToLayers, newSource } from '../../../models';

// type LayerSourceDef = {
//   sourceName: string;
//   layerStyleId: number;
// };

// type PoiSourceDef = {
//   sourceId: string;
// };

// export const createPOIModal: MeiosisComponent = () => {
//   let chosenTab: 'LAYERS' | 'POI';
//   let layerSourceDef = {} as LayerSourceDef;
//   let poiSourceDef = {} as PoiSourceDef;
//   let formValid = false;

//   return {
//     view: ({ attrs: { state, actions } }) => {
//       console.table({ formValid, layerSourceDef, poiSourceDef })
//       const { saveSource } = actions;
//       const {
//         app: { layerStyles = [], sources },
//       } = state;
//       const curStyles = layerStyles.map((s, i) => ({ id: i, label: s.name }));
//       const curSources = sources.filter((s) => s.shared).map((s) => ({ id: s.id, label: s.sourceName }));
//       // const { source } = state.app;
//       // const form = formGenerator(source);

//       return m(ModalPanel, {
//         id: 'create-poi-modal',
//         title: '',
//         description: m('.row', [
//           m(
//             '.col.s12',
//             m(Tabs, {
//               tabs: [
//                 {
//                   id: 'LAYERS',
//                   title: 'Layers',
//                   vnode: m('.row', [
//                     m(LayoutForm, {
//                       form: [
//                         { type: 'md', value: 'Create a new map layer'},
//                         { required: true, id: 'sourceName', label: 'Name', type: 'text' },
//                         { required: true, id: 'layerId', label: 'Select layer', type: 'select', options: curStyles },
//                       ],
//                       obj: layerSourceDef,
//                       onchange: () => {
//                         chosenTab = 'LAYERS';
//                         const { sourceName, layerStyleId: layerId } = layerSourceDef;
//                         formValid = sourceName && typeof layerId !== 'undefined' ? true : false;
//                       },
//                     } as FormAttributes<LayerSourceDef>),
//                   ]),
//                 },
//                 {
//                   id: 'POI',
//                   title: 'POI',
//                   vnode: m('.row', [
//                     m(LayoutForm, {
//                       form: [
//                         { type: 'md', value: 'Select a source for your POI (point of interest)'},
//                         { required: true, id: 'sourceId', label: 'Select layer', type: 'select', options: curSources },
//                       ],
//                       obj: poiSourceDef,
//                       onchange: () => {
//                         chosenTab = 'POI';
//                         const { sourceId } = poiSourceDef;
//                         formValid = sourceId ? true : false;
//                       },
//                     } as FormAttributes<PoiSourceDef>),
//                   ]),
//                 },
//               ],
//             })
//           ),
//         ]),
//         buttons: [
//           { label: 'Cancel', iconName: 'cancel' },
//           {
//             label: 'OK',
//             iconName: 'save',
//             disabled: !formValid,
//             onclick: () => {
//               switch (chosenTab) {
//                 case 'LAYERS': {
//                   const { sourceName, layerStyleId: layerId } = layerSourceDef;
//                   const layerStyle = layerStyles[layerId];
//                   const source = newSource({
//                     sourceName,
//                     layers: layerStyleToLayers(layerStyle),
//                     ui: layerStyle.ui || ([] as UIForm<Record<string, any>>),
//                   });
//                   layerSourceDef = {} as LayerSourceDef;
//                   saveSource(source);
//                   break;
//                 }
//                 case 'POI': {
//                   break;
//                 }
//               }
//             },
//           },
//         ],
//       });
//     },
//   };
// };
// // return m(
// //   '.modal.modal-fixed-footer',
// //   { id: 'createPOIModal' },
// //   m('.modal-content', [
// //     m('.row', [
// //       m(
// //         '.col.s12',
// //         m(Tabs, {
// //           tabs: [
// //             { id: "LAYERS", title: "Layers", vnode: m('.row', [
// //               m(LayoutForm, {
// //                 form: [
// //                   { required: true, id: 'sourceName', label: 'Name', type: 'text' },
// //                   { required: true, id: 'layerId', label: 'Select layer', type: 'select', options: curStyles },
// //                 ],
// //                 obj: sourceDef,
// //                 onchange: () => {
// //                   const { sourceName, layerId } = sourceDef;
// //                   formValid = sourceName && layerId ? true : false;
// //                   // const layerStyle = layerStyles[layerId];
// //                   // const source = newSource({ sourceName, layers: layerStyleToLayers(layerStyle), ui: layerStyle.ui || [] as UIForm<Record<string, any>> });
// //                   // saveSource(source);
// //                 },
// //               } as FormAttributes<{ sourceName: string, layerId: number }>),
// //               m('p.col.s12', 'Create a new map layer'),
// //               m('p.col.s12', 'Create a new map layer'),
// //             ])},
// //             {
// //               id: 'POI',
// //               title: 'POI',
// //               vnode: m('.row', [
// //                 // m(
// //                 //   '.col.s12', [
// //                 //     m('p.col.s12', 'Add it to the selected layer'),
// //                 //     m('.input-field.col.s12', [
// //                 //       m(
// //                 //         'select',
// //                 //         {
// //                 //           id: 'layerSelect',
// //                 //           input: layerIndex,
// //                 //           onchange: (e: Event) => {
// //                 //             const target = e.target as HTMLInputElement;
// //                 //             layerIndex = Number(target.value);
// //                 //           },
// //                 //         },
// //                 //         m('option', { value: '', disabled: true, selected: true }, 'Choose the layer'),
// //                 //         state.app.sources.map((source: ISource, index: number) => {
// //                 //           if (source.sourceCategory !== SourceType.custom) return;
// //                 //           return m('option', { value: index }, source.sourceName);
// //                 //         })
// //                 //       ),
// //                 //       m('label', { for: 'layerSelect' }, 'Choose the layer'),
// //                 //     ]),
// //                 //   ]),
// //               ]),
// //             }
// //           ]
// //         }),
// //         // m('ul.tabs', [
// //         //   // m(
// //         //   //   'li.tab.col.s2',
// //         //   //   m(
// //         //   //     'a',
// //         //   //     {
// //         //   //       href: '#annotation',
// //         //   //       onclick: () => {
// //         //   //         chosenTab = 'Annotation';
// //         //   //       },
// //         //   //       active: true,
// //         //   //     },
// //         //   //     m('i.material-icons', 'pin_drop')
// //         //   //   )
// //         //   // ),
// //         //   // m(
// //         //   //   'li.tab.col.s2',
// //         //   //   m(
// //         //   //     'a',
// //         //   //     {
// //         //   //       href: '#group',
// //         //   //       onclick: () => {
// //         //   //         chosenTab = 'Group';
// //         //   //       },
// //         //   //     },
// //         //   //     m('i.material-icons', 'group')
// //         //   //   )
// //         //   // ),
// //         //   m(
// //         //     'li.tab.col.s2',
// //         //     m(FlatButton, { href: '#POI', onclick: () => chosenTab = 'POI', iconName: 'pin_drop' }),
// //         //   ),
// //         //   m(
// //         //     'li.tab.col.s2',
// //         //     m(FlatButton, { href: '#LAYERS', onclick: () => chosenTab = 'LAYERS', iconName: 'layers' }),
// //         //   ),
// //         //   // m(
// //         //   //   'li.tab.col.s2',
// //         //   //   m(
// //         //   //     'a',
// //         //   //     {
// //         //   //       href: '#CHT',
// //         //   //       onclick: () => {
// //         //   //         chosenTab = 'Chemical Hazard';
// //         //   //       },
// //         //   //     },
// //         //   //     m('i.material-icons', 'warning')
// //         //   //   )
// //         //   // ),
// //         //   // m(
// //         //   //   'li.tab.col.s2',
// //         //   //   m(
// //         //   //     'a',
// //         //   //     {
// //         //   //       href: '#populator',
// //         //   //       onclick: () => {
// //         //   //         chosenTab = 'Population';
// //         //   //       },
// //         //   //     },
// //         //   //     m('i.material-icons', 'holiday_village')
// //         //   //   )
// //         //   // ),
// //         // ])
// //       ),
// //       ///Annotation
// //       // m(
// //       //   '.col.s12',
// //       //   { id: 'annotation' },
// //       //   m('div', [m('p.col.s12', 'Creates a drawing on this location on the map without side-effects')])
// //       // ),
// //       /// GROUP
// //       // m(
// //       //   '.col.s12',
// //       //   { id: 'group' },
// //       //   m('div', [
// //       //     m('p', 'Creates a group of the selected First Responders listed below'),
// //       //     m('p', 'Selected FRs'),
// //       //     m(
// //       //       'p',
// //       //       vnode.attrs.state.app.selectedFeatures?.features.map((feature: Feature) => {
// //       //         return m('span', JSON.stringify(feature.type));
// //       //       })
// //       //     ),
// //       //     m('.input-field.col.s4', [
// //       //       m('input', {
// //       //         id: 'groupName',
// //       //         type: 'text',
// //       //         value: groupName,
// //       //         onchange: (e: Event) => {
// //       //           const target = e.target as HTMLInputElement;
// //       //           groupName = target.value;
// //       //         },
// //       //       }),
// //       //       m(
// //       //         'label',
// //       //         {
// //       //           for: 'groupName',
// //       //         },
// //       //         'Group Name'
// //       //       ),
// //       //     ]),
// //       //     m('.col.s4'),
// //       //     m('.col.s4'),
// //       //   ])
// //       // ),
// //       /// POI
// //       // m(
// //       //   '.col.s12',
// //       //   { id: 'POI' },
// //       //   m('div', [
// //       //     m('p.col.s12', 'Add it to the selected layer'),
// //       //     m('.input-field.col.s12', [
// //       //       m(
// //       //         'select',
// //       //         {
// //       //           id: 'layerSelect',
// //       //           input: layerIndex,
// //       //           onchange: (e: Event) => {
// //       //             const target = e.target as HTMLInputElement;
// //       //             layerIndex = Number(target.value);
// //       //           },
// //       //         },
// //       //         m('option', { value: '', disabled: true, selected: true }, 'Choose the layer'),
// //       //         state.app.sources.map((source: ISource, index: number) => {
// //       //           if (source.sourceCategory !== SourceType.custom) return;
// //       //           return m('option', { value: index }, source.sourceName);
// //       //         })
// //       //       ),
// //       //       m('label', { for: 'layerSelect' }, 'Choose the layer'),
// //       //     ]),
// //       //   ])
// //       // ),
// //       /// CHT
// //       // m(
// //       //   '.col.s12',
// //       //   { id: 'CHT' },
// //       //   m('div', [
// //       //     m('p.col.s12', 'Creates a chemical hazard on this location on the map'),
// //       //     m(LayoutForm, {
// //       //       form,
// //       //       obj: source,
// //       //       section: 'source',
// //       //     }),
// //       //   ])
// //       // ),
// //       ///Population
// //       // m(
// //       //   '.col.s12',
// //       //   { id: 'populator' },
// //       //   m('div', [m('p.col.s12', 'Creates a populator service query for this point on the map')])
// //       // ),
// //     ]),
// //   ]),
// //   // m(
// //   //   '.modal-footer',
// //   //   m('a.modal-close.waves-effect.waves-green.btn-flat', 'Cancel'),
// //   //   m(FlatButton,
// //   //     {
// //   //       onclick: () => {
// //   //         chosenTab === 'LAYERS'
// //   //           ? createGroup(groupName)
// //   //           : chosenTab === 'POI'
// //   //             ? addDrawingsToLayer(layerIndex)
// //   //             : undefined;
// //   //       },
// //   //     },
// //   //     `${'Create ' + chosenTab}`
// //   //   )
// //   // )
// // );
// // },
// // oncreate: () => {
// //   M.AutoInit();
// // },
// //   };
// // };
