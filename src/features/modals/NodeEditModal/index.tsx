import React from "react";
import { Modal, Stack, Text, Textarea, Button, Flex } from "@mantine/core";
import { useModal } from "../../../store/useModal";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

export const NodeEditModal = ({ opened, onClose }: { opened: boolean; onClose: () => void }) => {
  const selectedNode = useGraph(state => state.selectedNode);
  const editTarget = useGraph(state => state.editTarget);
  const setEditTarget = useGraph(state => state.setEditTarget);
  const updateValueAtPath = useJson(state => state.updateValueAtPath);

  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (!selectedNode) return;
    // If editing a specific key, find its value
    if (editTarget && editTarget.key) {
      const row = selectedNode.text.find(r => r.key === editTarget.key);
      setValue(row ? String(row.value ?? "") : "");
      return;
    }
    // otherwise load the full subtree from the stored JSON at the node's path
    try {
      const jsonStr = useJson.getState().getJson();
      const parsed = JSON.parse(jsonStr || "{}");
      const path = selectedNode.path ?? [];
      let target: any = parsed;
      for (let i = 0; i < (path?.length ?? 0); i++) {
        const seg = path[i] as any;
        if (typeof target === "undefined" || target === null) {
          target = undefined;
          break;
        }
        target = target[seg as any];
      }

      if (typeof target === "undefined") {
        // fallback to building primitive-only object
        const obj: any = {};
        selectedNode.text.forEach(r => {
          if (r.key && r.type !== "array" && r.type !== "object") obj[r.key] = r.value;
        });
        setValue(JSON.stringify(obj, null, 2));
      } else if (typeof target === "object") {
        setValue(JSON.stringify(target, null, 2));
      } else {
        setValue(String(target ?? ""));
      }
    } catch (e) {
      const obj: any = {};
      selectedNode.text.forEach(r => {
        if (r.key && r.type !== "array" && r.type !== "object") obj[r.key] = r.value;
      });
      setValue(JSON.stringify(obj, null, 2));
    }
  }, [selectedNode, editTarget]);

  const onSave = () => {
    if (!selectedNode) return;

    if (editTarget && editTarget.key) {
      const path = [...(selectedNode.path ?? []), editTarget.key];
      updateValueAtPath(path, value);
    } else if (selectedNode.text.length === 1 && !selectedNode.text[0].key) {
      // single value node
      updateValueAtPath(selectedNode.path, value);
    } else {
      // object edited as JSON: merge keys
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "object") {
          Object.keys(parsed).forEach(k => {
            const path = [...(selectedNode.path ?? []), k];
            updateValueAtPath(path, JSON.stringify(parsed[k]));
          });
        }
      } catch (e) {
        // if parsing fails, do nothing
      }
    }

    setEditTarget(null);
    onClose();
    // also update left editor contents to reflect changes
    try {
      const updated = useJson.getState().getJson();
      if (updated) {
        useFile.getState().setContents({ contents: updated, hasChanges: false, skipUpdate: true });
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal size="60%" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm" style={{ height: "80vh", display: "flex", flexDirection: "column" }}>
        <Text fz="sm" fw={600}>
          Edit Node
        </Text>
        <div style={{ width: "100%", display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, boxSizing: "border-box" }}>
              <Textarea
                value={value}
                onChange={e => setValue(e.currentTarget.value)}
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  height: "100%",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 14,
                  overflow: "auto",
                }}
              />
            </div>
          </div>
        </div>
        <Flex gap="sm" justify="flex-end" style={{ marginTop: 8 }}>
          <Button variant="default" onClick={() => { setEditTarget(null); onClose(); }}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Flex>
      </Stack>
    </Modal>
  );
};
