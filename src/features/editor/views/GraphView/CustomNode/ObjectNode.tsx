import React from "react";
import type { CustomNodeProps } from ".";
import { NODE_DIMENSIONS } from "../../../../../constants/graph";
import type { NodeData } from "../../../../../types/graph";
import { TextRenderer } from "./TextRenderer";
import * as Styled from "./styles";
import { useModal } from "../../../../../store/useModal";
import useGraph from "../stores/useGraph";

type RowProps = {
  row: NodeData["text"][number];
  x: number;
  y: number;
  index: number;
  nodePath?: NodeData["path"];
};

const Row = ({ row, x, y, index, nodePath }: RowProps) => {
  const rowPosition = index * NODE_DIMENSIONS.ROW_HEIGHT;

  const getRowText = () => {
    if (row.type === "object") return `{${row.childrenCount ?? 0} keys}`;
    if (row.type === "array") return `[${row.childrenCount ?? 0} items]`;
    return row.value;
  };

  return (
    <Styled.StyledRow
      $value={row.value}
      data-key={`${row.key}: ${row.value}`}
      data-x={x}
      data-y={y + rowPosition}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
        <Styled.StyledKey $type="object">{row.key}: </Styled.StyledKey>
        <TextRenderer>{getRowText()}</TextRenderer>
      </div>
    </Styled.StyledRow>
  );
};

// Single node-level editor will be rendered at the top of the node

const Node = ({ node, x, y }: CustomNodeProps) => (
  <Styled.StyledForeignObject
    data-id={`node-${node.id}`}
    width={node.width}
    height={node.height}
    x={0}
    y={0}
    $isObject
  >
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 2, right: 4, zIndex: 5, pointerEvents: "all" }}>
        <button
          aria-label="Edit node"
          title="Edit node"
          onClick={e => {
            e.stopPropagation();
            const setVisible = useModal.getState().setVisible;
            const setSelectedNode = useGraph.getState().setSelectedNode;
            const setEditTarget = useGraph.getState().setEditTarget;
            setSelectedNode(node);
            setEditTarget(null);
            setVisible("NodeEditModal", true);
          }}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
        >
          ✏️
        </button>
      </div>

      {node.text.map((row, index) => (
        <Row key={`${node.id}-${index}`} row={row} x={x} y={y} index={index} nodePath={node.path} />
      ))}
    </div>
  </Styled.StyledForeignObject>
);

function propsAreEqual(prev: CustomNodeProps, next: CustomNodeProps) {
  return (
    JSON.stringify(prev.node.text) === JSON.stringify(next.node.text) &&
    prev.node.width === next.node.width
  );
}

export const ObjectNode = React.memo(Node, propsAreEqual);
