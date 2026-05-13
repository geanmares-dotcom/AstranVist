import { IsNotEmpty, IsString, IsLowercase } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Slug é obrigatório' })
  @IsString()
  @IsLowercase({ message: 'Slug deve ser em letras minúsculas' })
  slug: string;
}
