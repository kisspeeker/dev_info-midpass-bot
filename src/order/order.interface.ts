export interface Order {
  uid: string;
  shortUid: string;
  sourceUid: string;
  receptionDate: string;
  updateTime: string;
  passportStatus: OrderPassportStatus;
  internalStatus: OrderInternalStatus;
}

interface OrderPassportStatus {
  id?: string;
  passportStatusId: string;
  name: string;
  description: string;
  color: string;
  subscription: string;
}

interface OrderInternalStatus {
  name: string;
  percent: number;
}
