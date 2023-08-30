export class UpdateOrderDto {
  uid: string;
  sourceUid: string;
  receptionDate: string;
  passportStatus: OrderPassportStatus;
  internalStatus: OrderInternalStatus;
}

export interface OrderPassportStatus {
  id?: string;
  passportStatusId: number;
  name: string;
  description: string;
  color: string;
  subscription: boolean;
}

export interface OrderInternalStatus {
  name: string;
  percent: number;
}
