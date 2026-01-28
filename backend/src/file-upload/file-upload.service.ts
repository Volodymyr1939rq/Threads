import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadService {
  // Базова папка, куди все буде падати
  private readonly localUploadPath = './uploads'; 

  async uploadFile(file: Express.Multer.File, folderName: string = 'images') {
    try {
      // 1. Генеруємо унікальне ім'я (Ваш код)
     
      const fileExt = path.extname(file.originalname);
      const uniqueName = this.generateFileName() + fileExt;

      // 2. Формуємо шлях 
      
      // Стало: використовуємо аргумент folderName
      const relativePath = `${folderName}/${uniqueName}`;

      // 3. Формуємо повний шлях на диску (Ваш код)
      const absolutePath = path.join(
        this.localUploadPath,
        relativePath
      );

      // 4. Створюємо папку, якщо немає (Ваш код)
      const folder = path.dirname(absolutePath);
      await fs.mkdir(folder, { recursive: true });

      // 5. Записуємо файл (Ваш код)
      await fs.writeFile(absolutePath, file.buffer);

      // 6. Генеруємо URL для фронтенду
      const publicUrl = this.generateLocalUrl(relativePath);

      return { 
        fileName: uniqueName, 
        path: relativePath,
        publicUrl 
      };

    } catch (error) {
      console.error('[Local Upload Error]', error);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  // Ваша приватна функція генерації імені
  private generateFileName(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  // Генерація посилання
  private generateLocalUrl(relativePath: string): string {
    // У Windows слеші можуть бути обернені, міняємо на правильні для URL
    const normalizedPath = relativePath.replace(/\\/g, '/');
    return `http://localhost:3000/uploads/${normalizedPath}`;
  }
}