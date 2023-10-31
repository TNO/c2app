import { UIForm } from "mithril-ui-form-plugin";

export type LayerStyle<T extends Record<string, any>> = {
  id: string;
  name: string;
  /** Folder for icons */
  iconPath: string;
  /** Available icons, consisting of a friendly name and a relative path, e.g. full path is iconPath/src */
  icons: [name: string, src: string];
  /** Map layer type */
  type: string;
  /** Map layer layout */
  layout?: Record<string, any>;
  ui?: UIForm<T>;
}