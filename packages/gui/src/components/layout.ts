import m, { Vnode } from 'mithril';
import logo from '../assets/explosion.svg';
import { Icon } from 'mithril-materialized';

export const Layout = () => ({
    view: (vnode: Vnode) => {
      return m('.main', [
        m(
          '.navbar',
          { style: 'z-index: 1001; height: 64px' },
          m(
            'nav', {style: 'height:64px'},
            m('.nav-wrapper', [
              m('a.brand-logo[href=#]', [
                m(`img[width=100][height=45][src=${logo}]`, {
                  style: 'margin: 7px 0 0 5px;',
                }),
                m(
                  'div',
                  {
                    style: 'margin-top: 0px; position: absolute; top: 16px; left: 50px; width: 400px;',
                  },
                  m(
                    'h4.center.hide-on-med-and-down',
                    {
                      style: 'text-align: left; margin: -7px 0 0 60px; background: #01689B',
                    },
                    'C2 Application'
                  )
                ),
              ]),
              m(
                m.route.Link,
                {
                  className: 'sidenav-trigger',
                  'data-target': 'slide-out',
                  href: m.route.get(),
                },
                m(Icon, {
                  iconName: 'menu',
                  className: '.hide-on-med-and-up',
                  style: 'margin-left: 5px;',
                })
              ),
            ])
          )
        ),
        m('.row', vnode.children),
      ]);
    },
  });
