import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class EndUserGuard implements CanLoad, CanActivate {
  constructor(private router: Router) {}

  private check(): boolean | UrlTree {
    const isAdmin  = localStorage.getItem('is_admin')  === '1';
    const isTenant = localStorage.getItem('is_tenant') === '1';
    if (!isAdmin && !isTenant) {
      return this.router.parseUrl('/pages/my-account/my-account');
    }
    return true;
  }

  canLoad(): boolean | UrlTree { return this.check(); }
  canActivate(): boolean | UrlTree { return this.check(); }
}
