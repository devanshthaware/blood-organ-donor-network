/**
 * Merkle Tree Engine for Scalable Batch Anchoring
 * Groups multiple audit proofs into a single cryptographic Merkle Root for blockchain anchoring.
 */

import { computeSha256 } from "./canonicalizer";

export interface MerkleProofStep {
  position: "left" | "right";
  hash: string;
}

export class MerkleTree {
  leaves: string[];
  layers: string[][];

  constructor(leaves: string[]) {
    if (!leaves || leaves.length === 0) {
      throw new Error("Cannot construct Merkle tree with empty leaves");
    }
    this.leaves = [...leaves];
    this.layers = [this.leaves];
    this.buildTree();
  }

  private buildTree() {
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left;
        nextLayer.push(computeSha256(`${left}:${right}`));
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(leafIndex: number): MerkleProofStep[] {
    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }

    const proof: MerkleProofStep[] = [];
    let currentIndex = leafIndex;

    for (let layerIndex = 0; layerIndex < this.layers.length - 1; layerIndex++) {
      const layer = this.layers[layerIndex];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRightNode ? "left" : "right",
          hash: layer[siblingIndex],
        });
      } else {
        // Paired with itself if odd
        proof.push({
          position: "right",
          hash: layer[currentIndex],
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  static verifyInclusion(leafHash: string, proof: MerkleProofStep[], rootHash: string): boolean {
    let current = leafHash;

    for (const step of proof) {
      if (step.position === "left") {
        current = computeSha256(`${step.hash}:${current}`);
      } else {
        current = computeSha256(`${current}:${step.hash}`);
      }
    }

    return current === rootHash;
  }
}
