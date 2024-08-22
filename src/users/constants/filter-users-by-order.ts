import { ORDER_FINAL_PERCENTS } from 'src/constants/order-final-percents';
import { ORDER_FINAL_STATUSES } from 'src/constants/order-final-statuses';
import { In, Not, Raw } from 'typeorm';

export const getFilterUserByOrder = () => ({
  orders: {
    isDeleted: false,
    statusPercent: Not(In(ORDER_FINAL_PERCENTS)),
    // TODO: чек вариант попроще
    // statusInternalName: Not(In(ORDER_FINAL_STATUSES)),
    statusInternalName: Raw(
      alias => `LOWER(${alias}) NOT IN (:...ORDER_FINAL_STATUSES)`,
      { ORDER_FINAL_STATUSES },
    ),
  },
});
