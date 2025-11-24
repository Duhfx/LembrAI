import { Controller } from '@nestjs/common';

/**
 * Root controller - serves static files from public directory
 * The landing page (index.html) is served at / by ServeStaticModule
 * Admin panel is accessible at /admin/
 */
@Controller()
export class AppController {
  // No routes defined - static files are served by ServeStaticModule
}
