import { Controller, Get, Redirect } from '@nestjs/common';

/**
 * Root controller - redirects to admin panel
 */
@Controller()
export class AppController {
  /**
   * Redirect root path to admin panel
   * GET / → Redirect to /admin/
   */
  @Get()
  @Redirect('/admin/', 302)
  redirectToAdmin() {
    return;
  }
}
