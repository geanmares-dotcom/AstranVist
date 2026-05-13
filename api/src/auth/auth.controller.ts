import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  register(
    @Body() dto: RegisterDto,
    @GetUser('tenantId') tenantId: string
  ) {
    // Força o novo usuário a pertencer ao mesmo tenant do administrador
    return this.authService.register({ ...dto, tenantId });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPERVISOR)
  async listUsers(@GetUser('tenantId') tenantId: string) {
    // Reutilizando lógica para listar usuários do tenant
    return this.authService.getUsersByTenant(tenantId);
  }
}
