export type CardStatus = 'ACTIVA' | 'BLOQUEADA' | 'CANCELADA';

export interface VirtualCard {
  id: string;
  userId: string;
  accountId: string;
  cardHolderName: string;
  lastFour: string;
  expirationDate: string;
  cvvMasked: string;
  status: CardStatus;
  createdAt: string;
}

export interface RevealedVirtualCardDetails {
  cardNumber: string;
  cvv: string;
}

