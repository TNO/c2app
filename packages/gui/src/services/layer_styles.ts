import m from "mithril";
import { LayerStyle } from "c2app-models-utils";

const layerStylesSvcFactory = () => {
  let isLoading = false;
  const baseUrl = process.env.SERVER_URL;

  const loadStyles = async () => {
    if (isLoading) return undefined;
    isLoading = true;
    const url = `${baseUrl}/layer_styles/index.json`;
    let result: LayerStyle<Record<string, any>>[];
    try {
      result = await m.request<LayerStyle<Record<string, any>>[]>(url);
    } catch (e: any) {
      console.error(`Error loading layer styles: no index.json found. ${e}`);
      result = []
    } finally {
      isLoading = false;
    }
    return result;
  };
  return { loadStyles };
};

export const layerStylesSvc = layerStylesSvcFactory();