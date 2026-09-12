export interface GameItem {
  id: string;
  key: string;
  category: string;
}

export interface PlaceBin {
  id: string;
  category: string;
  capacity: number;
  items: GameItem[];
}

export type PlaceResult =
  | {
      success: true;
      completed: boolean;
      item: GameItem;
      bin: PlaceBin;
    }
  | {
      success: false;
      reason: "WRONG_CATEGORY" | "NOT_FOUND";
      item: GameItem | null;
      bin: PlaceBin | null;
    };
