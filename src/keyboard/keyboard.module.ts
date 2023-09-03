import { Module } from '@nestjs/common';
import { KeyboardService } from './keyboard.service';

@Module({
  providers: [KeyboardService],
  exports: [KeyboardService],
})
export class KeyboardModule {}
