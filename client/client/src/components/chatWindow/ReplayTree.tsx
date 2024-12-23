"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TreeNode {
  id: string;
  text: string;
  diamond: boolean;
  pulse: boolean;
  visited: boolean;
  pulsing?: boolean; // Indicates if the node is currently pulsing
  children?: TreeNode[];
}

// const sequence = [
//   { text: "Query", parent: null },
//   { text: "Supervisor", parent: "Query" },
//   { text: "Finance", parent: "Supervisor" },
//   { text: "Budget", parent: "Finance" },
//   { text: "Supervisor", parent: "Query" },
//   { text: "Query", parent: null },
//   { text: "funding", parent: "Finance" },
//   { text: "Math", parent: "Supervisor" },
//   { text: "statistic", parent: "Math" },
//   { text: "percentage", parent: "Math" },
//   { text: "Research", parent: "Supervisor" },
//   { text: "Data", parent: "Research" },
// ];

const initialTreeData: TreeNode[] = [
  {
    id: "1",
    text: "Query",
    diamond: false,
    pulse: false,
    visited: false,
    children: [
      {
        id: "2",
        text: "Supervisor",
        diamond: false,
        pulse: false,
        visited: false,
        children: [
          {
            id: "3",
            text: "Finance",
            diamond: false,
            pulse: false,
            visited: false,
            children: [],
          },
          {
            id: "5",
            text: "Math",
            diamond: false,
            pulse: false,
            visited: false,
            children: [],
          },
          {
            id: "8",
            text: "Research",
            diamond: false,
            pulse: false,
            visited: false,
            children: [],
          },
        ],
      },
    ],
  },
];

interface FlowProps {
  type: string;
  signal: number | null;
  chat: any[];
  onSignalProcessed: () => void;
}

type SequenceItem = {
    text: string;
    parent: string | null;
  };

const ReplayFlow: React.FC<FlowProps> = ({ type,signal,chat,onSignalProcessed }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialTreeData);
  const treeDataRef = useRef<TreeNode[]>(initialTreeData);
  const [sequence, setSequence] = useState<{ text: string; parent: string | null }[]>([]);

  const generateSequence = (): SequenceItem[] => {
    const sequence: SequenceItem[] = []; // Explicitly type the sequence array
  
    console.log("chatttttttt",chat);
    chat.forEach((item) => {
      if (item.isUser) {
        // If the chat item is from the user, add a Query node
        sequence.push({ text: "Query", parent: null });
      } else {
        // If the chat item is not from the user, add it to the sequence
        sequence.push({ text: item.username, parent: item.parentAgent });
      }
    });
  
    return sequence;
  };
  

  useEffect(() => {
    let isMounted = true;
    
    const runSequence = async () => {
      // Process each item in the sequence array
      const extractedSequence = generateSequence();

      console.log("extractedSequenceeeeeeeee",extractedSequence);
      setSequence(extractedSequence);
      for (const item of extractedSequence) {
        if (!isMounted){
          onSignalProcessed();
          return ;
        };

        // Clone the current treeData to avoid mutating state directly
        let newTreeData = JSON.parse(JSON.stringify(treeDataRef.current));

        // Find the node by text
        const node = findNode(newTreeData, item.text);

        if (node) {
          // Node exists, pulse it
          updateNodePulsing(newTreeData, item.text, true);
          treeDataRef.current = newTreeData;
          setTreeData(newTreeData);

          await delay(3000); // Wait for 3 seconds
          // Stop pulsing
          updateNodePulsing(newTreeData, item.text, false);
          node.visited = true;
          treeDataRef.current = JSON.parse(JSON.stringify(newTreeData));
          setTreeData(treeDataRef.current);
        } else {
          // Node doesn't exist, add it under its parent
          if (item.parent) {
            const parentNode = findNode(newTreeData, item.parent);
            if (parentNode) {
              const newNode: TreeNode = {
                id: Math.random().toString(),
                text: item.text,
                diamond: false,
                pulse: false,
                visited: false,
                pulsing: true,
                children: [],
              };
              parentNode.children = parentNode.children || [];
              parentNode.children.push(newNode);
              treeDataRef.current = newTreeData;
              setTreeData(newTreeData);

              await delay(3000); // Wait for 3 seconds

              // Stop pulsing
              newNode.pulsing = false;
              if (newNode) {
                newNode.visited = true;
              }
              treeDataRef.current = JSON.parse(JSON.stringify(newTreeData));
              setTreeData(treeDataRef.current);
            } else {
              console.warn(`Parent node "${item.parent}" not found.`);
            }
          } else {
            console.warn(`Parent not specified for node "${item.text}".`);
          }
        }
      }
    };

    if (signal !== null) {
    //   console.log(`Signal received in Flow! Signal ID: ${signal}`);

      // Process the signal here (e.g., display a message)
      // Simulate signal processing
      runSequence();
       // Notify parent that the signal has been processed
    }
    return () => {
      isMounted = false;
    };
  }, [signal, onSignalProcessed, chat]); // Empty dependency array to run only once on mount

  return <div className="tree overflow-x-auto">{treeRendering(treeData)}</div>;
};

// Helper function to find a node by text
const findNode = (nodes: TreeNode[], text: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.text === text) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, text);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to update a node's pulsing state
const updateNodePulsing = (
  nodes: TreeNode[],
  text: string,
  pulsing: boolean
) => {
  for (const node of nodes) {
    if (node.text === text) {
      node.pulsing = pulsing;
    }
    if (node.children) {
      updateNodePulsing(node.children, text, pulsing);
    }
  }
};

// Delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Recursive function to render the tree
const treeRendering = (treeData: TreeNode[]): JSX.Element => {
  return (
    <ul>
      {treeData.map((item) => (
        <li key={item.id} className={`${item.text}${item.id}`}>
          <div
            className={`${
              item.pulsing
                ? "shadow-inner border-8 border-purple-600 shadow-purple-400 animate-pulse bg-purple-100/15"
                : ""
            }${
              item.visited
                ? "bg-purple-400/40"
                : ""
            }`}
          >
            <HoverCard>
              <HoverCardTrigger>{item.text}</HoverCardTrigger>
              <HoverCardContent>
                Details about {item.text} node.
              </HoverCardContent>
            </HoverCard>
          </div>
          {/* Recursively render children if they exist */}
          {item.children && item.children.length > 0 && treeRendering(item.children)}
        </li>
      ))}
    </ul>
  );
};

export default ReplayFlow;
