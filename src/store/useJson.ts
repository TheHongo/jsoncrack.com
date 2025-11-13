import { create } from "zustand";
import useGraph from "../features/editor/views/GraphView/stores/useGraph";

interface JsonActions {
  setJson: (json: string) => void;
  getJson: () => string;
  clear: () => void;
  updateValueAtPath: (path: Array<string | number> | undefined, newValue: string) => void;
}

const initialStates = {
  json: "{}",
  loading: true,
};

export type JsonStates = typeof initialStates;

const useJson = create<JsonStates & JsonActions>()((set, get) => ({
  ...initialStates,
  getJson: () => get().json,
  setJson: json => {
    set({ json, loading: false });
    useGraph.getState().setGraph(json);
  },
  updateValueAtPath: (path, newValue) => {
    try {
      const current = get().json || "{}";
      const parsed = JSON.parse(current);

      if (!path || path.length === 0) {
        // replace entire document
        // try parse newValue as JSON, otherwise set as string
        let next;
        try {
          next = JSON.parse(newValue);
        } catch (e) {
          next = newValue;
        }
        const nextJson = JSON.stringify(next, null, 2);
        set({ json: nextJson, loading: false });
        useGraph.getState().setGraph(nextJson);
        return;
      }

      let target: any = parsed;
      for (let i = 0; i < path.length - 1; i++) {
        const seg = path[i] as any;
        if (typeof seg === "number") {
          target = target[seg];
        } else {
          target = target[seg];
        }
        if (typeof target === "undefined") break;
      }

      const last = path[path.length - 1] as any;
      // parse newValue to attempt to keep types
      let parsedValue: any = newValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch (e) {
        // keep as string
        parsedValue = newValue;
      }

      if (typeof last === "number") {
        if (Array.isArray(target)) target[last] = parsedValue;
      } else if (target && typeof target === "object") {
        target[last] = parsedValue;
      }

      const nextJson = JSON.stringify(parsed, null, 2);
      set({ json: nextJson, loading: false });
      useGraph.getState().setGraph(nextJson);
    } catch (err) {
      // on error, no-op
      // console.error("updateValueAtPath error", err);
    }
  },
  clear: () => {
    set({ json: "", loading: false });
    useGraph.getState().clearGraph();
  },
}));

export default useJson;
