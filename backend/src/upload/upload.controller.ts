import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import {
  Controller,
  HttpException,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { UploadResponse, type UploadResponseDto } from '../common/schemas'
import { Config } from '../config'

@ApiTags('upload')
@Controller('api')
export class UploadController {
  private s3 = new S3Client({
    region: Config.AWS_REGION,
    endpoint: Config.FLOCI_URL,
    credentials: Config.AWS_CREDS,
    forcePathStyle: true,
  })

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiOkResponse({ description: 'File caricato su S3' })
  async upload(@UploadedFile() file: Express.Multer.File): Promise<UploadResponseDto> {
    if (!file) throw new UnsupportedMediaTypeException('file richiesto')
    const ext = file.originalname.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      throw new UnsupportedMediaTypeException('solo file .csv accettati')
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new PayloadTooLargeException('dimensione massima 50MB')
    }
    const sicuro = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `incoming/${Date.now()}-${sicuro}`
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: 'sdcc-raw',
          Key: key,
          Body: file.buffer,
          ContentType: 'text/csv',
        }),
      )
    } catch {
      throw new HttpException('errore S3', HttpStatus.BAD_GATEWAY)
    }
    return UploadResponse.parse({ key })
  }
}
