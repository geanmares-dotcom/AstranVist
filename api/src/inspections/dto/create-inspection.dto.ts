import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateInspectionDto {
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  @IsString()
  placa: string;

  @IsOptional()
  @IsString()
  chassi?: string;

  @IsOptional()
  @IsString()
  renavam?: string;

  @IsOptional()
  @IsString()
  cliente?: string;

  @IsOptional()
  @IsString()
  seguradora?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsInt()
  ano?: number;

  @IsOptional()
  @IsString()
  tipoVeiculo?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
