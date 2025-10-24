import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Logger } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { ReminderStatus, PlanType } from '../../generated/prisma';
import { AdminAuthGuard } from '../guards/admin-auth.guard';

/**
 * Admin panel controller with HTTP Basic authentication
 * Credentials configured via ADMIN_USERNAME and ADMIN_PASSWORD env vars
 */
@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * Dashboard statistics
   * GET /admin/stats
   */
  @Get('stats')
  async getDashboardStats() {
    this.logger.log('📊 Fetching dashboard statistics');
    return await this.adminService.getDashboardStats();
  }

  /**
   * List all users
   * GET /admin/users?page=1&limit=20
   */
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    this.logger.log(`📋 Fetching users - Page: ${pageNum}, Limit: ${limitNum}`);
    return await this.adminService.getUsers(pageNum, limitNum);
  }

  /**
   * Get user details
   * GET /admin/users/:id
   */
  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    this.logger.log(`👤 Fetching user details: ${id}`);
    return await this.adminService.getUserDetails(id);
  }

  /**
   * Update user plan
   * POST /admin/users/:id/plan
   */
  @Post('users/:id/plan')
  async updateUserPlan(
    @Param('id') id: string,
    @Body('planType') planType: PlanType,
  ) {
    this.logger.log(`💳 Updating user ${id} plan to ${planType}`);
    return await this.adminService.updateUserPlan(id, planType);
  }

  /**
   * Delete user
   * DELETE /admin/users/:id
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    this.logger.log(`🗑️  Deleting user: ${id}`);
    return await this.adminService.deleteUser(id);
  }

  /**
   * List all reminders
   * GET /admin/reminders?page=1&limit=20&status=PENDING
   */
  @Get('reminders')
  async getReminders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReminderStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    this.logger.log(`📋 Fetching reminders - Page: ${pageNum}, Limit: ${limitNum}, Status: ${status || 'all'}`);
    return await this.adminService.getReminders(pageNum, limitNum, status);
  }

  /**
   * Cancel reminder
   * POST /admin/reminders/:id/cancel
   */
  @Post('reminders/:id/cancel')
  async cancelReminder(@Param('id') id: string) {
    this.logger.log(`❌ Cancelling reminder: ${id}`);
    return await this.adminService.cancelReminder(id);
  }

  /**
   * Send test chat message
   * POST /admin/chat/send
   */
  @Post('chat/send')
  async sendTestMessage(
    @Body('userId') userId: string,
    @Body('message') message: string,
  ) {
    this.logger.log(`💬 Test chat message from user ${userId}: "${message}"`);
    return await this.adminService.processTestChatMessage(userId, message);
  }

  /**
   * Clear test chat context
   * POST /admin/chat/clear
   */
  @Post('chat/clear')
  async clearTestChat(@Body('userId') userId: string) {
    this.logger.log(`🗑️  Clearing test chat context for user ${userId}`);
    return await this.adminService.clearTestChatContext(userId);
  }

  /**
   * Health check
   * GET /admin/health
   */
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'LembrAI Admin Panel',
    };
  }
}
