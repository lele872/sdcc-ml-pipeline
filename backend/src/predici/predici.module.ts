import { Module } from '@nestjs/common'
import { PrediciController } from './predici.controller'

@Module({
  controllers: [PrediciController],
})
export class PrediciModule {}
