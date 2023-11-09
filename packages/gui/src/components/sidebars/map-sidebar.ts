import { MeiosisComponent } from '../../services/meiosis';

export const mapSideBar: MeiosisComponent = () => {
  return {
    view: () => {
      return [
        // m(createPOIModal, { state, actions }),
        // m(gridModal, { state, actions }),
        // m(customLayerModal, { state, actions }),
        // m(editLayerModal, { state, actions }),
        // m(editGroupModal, { state, actions }),
        // m('.col.l3.m4#slide-out.sidenav.sidenav-fixed', [
        //   /// GROUPS
        //   m('ul.collapsible', [
        //     m('li', [
        //       m('.collapsible-header', m('i.material-icons', 'group'), 'Groups'),
        //       m('.collapsible-body', m(groupsBody, { state, actions })),
        //     ]),
        //   ]),
        //   /// LAYERS
        //   m('ul.collapsible', [
        //     m('li', [
        //       m('.divider'),
        //       m('.collapsible-header', m('i.material-icons', 'layers'), 'Layers'),
        //       m('.collapsible-body', m(layersBody, { state, actions })),
        //     ]),
        //   ]),
        //   // Fix the weird scroll clipping caused by
        //   m('div', { style: 'margin: 128px' }),
        // ]),
      ];
    },
    // oncreate: () => {
    //   M.AutoInit();
    // },
  };
};
