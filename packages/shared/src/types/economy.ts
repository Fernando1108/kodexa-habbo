export interface MarketplaceListing {
  id: number;
  itemId: number;
  userId: number;
  price: number;
  createdAt: Date;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

export interface AuctionData {
  id: number;
  itemId: number;
  startPrice: number;
  currentBid: number;
  bidderId?: number;
  endsAt: Date;
  status: 'active' | 'ended' | 'cancelled';
}

export interface CraftingRecipe {
  id: number;
  name: string;
  ingredients: Array<{ itemBaseId: number; amount: number }>;
  result: { itemBaseId: number; amount: number };
}
