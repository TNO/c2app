import m, { ComponentTypes, RouteDefs } from 'mithril';
import { Layout } from '../components/layout';
import { Mapbox } from '../components/mapbox/mapbox';
import { IPage } from '../models/page';
import { actions, states } from '.';
import { sideBar } from '../components/mapbox/sidebar';

export const enum Pages {
  MAPBOX = 'MAPBOX',
}

class RoutingService {
  private pages!: ReadonlyArray<IPage>;

  constructor(private layout: ComponentTypes, pages: IPage[]) {
    this.setList(pages);
  }

  public getList() {
    return this.pages;
  }

  public setList(list: IPage[]) {
    this.pages = Object.freeze(list);
  }

  public get defaultRoute() {
    const page = this.pages.filter((p) => p.default).shift();
    return page ? page.route : this.pages[0].route;
  }

  public route(pageId: Pages) {
    const page = this.pages.filter((p) => p.id === pageId).shift();
    return page ? page.route : this.defaultRoute;
  }

  public switchTo(pageId: Pages, params?: { [key: string]: string | number | undefined }) {
    const page = this.pages.filter((p) => p.id === pageId).shift();
    if (page) {
      m.route.set(page.route, params ? params : undefined);
    }
  }

  public routingTable() {
    return this.pages.reduce((r, p) => {
      r[p.route] = {
        render: () =>
          m(this.layout, [
            m(p.sidebar, { state: states(), actions: actions }),
            m(p.component, { state: states(), actions: actions }),
          ]),
      };
      return r;
    }, {} as RouteDefs);
  }
}

export const routingSvc: RoutingService = new RoutingService(Layout, [
  {
    id: Pages.MAPBOX,
    title: 'Mapbox',
    icon: 'mapbox',
    route: '/mapbox',
    visible: true,
    component: Mapbox,
    sidebar: sideBar,
  },
]);
