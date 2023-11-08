import m from 'mithril';

export interface IRestService<T extends Record<string, any>> {
  url: string;
  create: (item: Partial<T>, fd?: FormData | undefined) => Promise<void | T>;
  update: (item: Partial<T>, fd?: FormData | undefined) => Promise<void | T>;
  save: (item: Partial<T>, fd?: FormData | undefined) => Promise<void | T>;
  del: (id: string | number) => Promise<void>;
  load: (id: string | number) => Promise<T>;
  loadList: (props?: string[]) => Promise<T[]>;
  loadFilteredList: (props?: string[]) => Promise<T[]>;
}

const createRestServiceFactory = (apiService: string) => {
  return <T extends Record<string, any>>(urlFragment: string) => {
    console.log(`API server: ${apiService}`);
    const url = `${apiService}/${urlFragment}/`;
    const withCredentials = false;

    const create = async (item: Partial<T>, fd?: FormData) => {
      try {
        return await m.request<T>({
          method: 'POST',
          url,
          body: fd || item,
          withCredentials,
        });
      } catch (err) {
        return console.error((err as { message: string }).message);
      }
    };

    const update = async (item: Partial<T>, fd?: FormData) => {
      try {
        return await m
          .request<T>({
            method: 'PUT',
            url: url + item.$loki,
            body: fd || item,
            withCredentials,
          })
          .catch((e) => console.error(JSON.stringify(e)));
      } catch (err) {
        return console.error((err as { message: string }).message);
      }
    };

    const save = (item: Partial<T>, fd?: FormData) => (item.$loki ? update(item, fd) : create(item, fd));

    const del = async (id: string | number) => {
      try {
        await m.request<T>({
          method: 'DELETE',
          url: url + id,
          withCredentials,
        });
      } catch (err) {
        return console.error((err as { message: string }).message);
      }
    };

    const load = (id?: string | number) =>
      m.request<T>({
        method: 'GET',
        url: url + id,
        withCredentials,
      });

    const loadList = async () => {
      const result = await m.request<T[]>({
        method: 'GET',
        url,
        withCredentials,
      });
      if (!result) {
        console.warn(`No result found at ${url}`);
      }
      return result || [];
    };

    const loadFilteredList = async (props: string[] = ['id', 'title', 'author', 'desc', 'img']) => {
      const filter = 'view?props=' + props.join(',');
      const result = await m.request<T[]>({
        method: 'GET',
        url: url + filter,
        withCredentials,
      });
      if (!result) {
        console.warn(`No result found at ${url}`);
      }
      return result;
    };

    return {
      url,
      create,
      update,
      save,
      del,
      load,
      loadList,
      loadFilteredList,
    } as IRestService<T>;
  };
};

//export const restServiceFactory = createRestServiceFactory(location.origin + '/tmt');
export const restServiceFactory = createRestServiceFactory((process.env.SERVER_URL || location.origin));
