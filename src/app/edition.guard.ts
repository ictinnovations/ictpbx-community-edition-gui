import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router, UrlTree } from '@angular/router';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class EditionGuard implements CanLoad, CanActivate {
  constructor(private router: Router) {}

  private check(): boolean | UrlTree {
    if (environment.COMMUNITY_EDITION) {
      return this.router.parseUrl('/pages/dashboard');
    }
    return true;
  }

  canLoad(): boolean | UrlTree {
    return this.check();
  }

  canActivate(): boolean | UrlTree {
    return this.check();
  }
}
