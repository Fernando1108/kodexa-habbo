export interface CatalogPage {
  id: number;
  parentId: number;
  caption: string;
  iconImage: string;
  visible: boolean;
  enabled: boolean;
  minRank: number;
  orderNum: number;
  children: CatalogPage[];
}

export interface CatalogItem {
  id: number;
  pageId: number;
  itemId: number;
  catalogName: string;
  costCredits: number;
  costPixels: number;
  costPoints: number;
  amount: number;
}
