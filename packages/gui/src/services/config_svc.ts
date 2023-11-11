import m from 'mithril';
import { SafrConfig } from 'c2app-models-utils';

const ConfigSvcFactory = () => {
  const baseUrl = process.env.SERVER_URL;
  let isLoading = false;
  let config: SafrConfig;

  const getConfig = async () => {
    if (config) return config;
    if (isLoading) return undefined;
    isLoading = true;
    const url = `${baseUrl}/config`;
    try {
      config = await m.request<SafrConfig>(url);
    } catch (e: any) {
      console.error(`Error loading SAFR config. ${e}`);
    } finally {
      isLoading = false;
    }
    return config;
  };
  return { getConfig };
};

export const configSvc = ConfigSvcFactory();
