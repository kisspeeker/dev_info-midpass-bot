import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { API_MIDPASS_NETWORK_TIMEOUT } from 'src/api/constants/api-midpass-network-timeout';
import { API_ROUTE_MIDPASS } from 'src/api/constants/api-route-midpass';
import { FindOrderParams } from 'src/types/filter-types';
import { parseMidpassOrder } from 'src/orders/parsers/parse-midpass-order';

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {}

  async getStatusFromMidpass({ uid }: FindOrderParams) {
    return firstValueFrom(
      this.httpService
        .get(`${API_ROUTE_MIDPASS}/${uid}`)
        .pipe(timeout(API_MIDPASS_NETWORK_TIMEOUT)),
    ).then(({ data }) => parseMidpassOrder(data));
  }
}
