import {Injectable} from '@angular/core';
import {AuthConfigProvider} from '../auth-config/auth-config.provider';
import {AuthConfig, AuthConfigAdditional} from '../../';
import {HttpClient} from '@angular/common/http';
import {UserPermissions} from '../../types/user-permissions.type';

@Injectable()
export class PermissionProvider {
  private authConfig: AuthConfig & AuthConfigAdditional;
  private permissionDataSet: UserPermissions[];
  private permissions = {};

  constructor(private authConfigProvider: AuthConfigProvider, private http: HttpClient) {
    this.authConfig = this.authConfigProvider.getConfig();
  }

  public getPermissions(): any {
    if (this.authConfig.userPermissionsEnabled) {
      return this.permissions;
    } else {
      throw new Error('permissions not enabled');
    }
  }

  public async setPermissionByUserRoleId(userRoleId: number) {
    if (this.authConfig.userPermissionsEnabled) {
      await this.loadUserPermissionDataSet();

      const result = this.permissionDataSet.filter(up => up.userRoleId === userRoleId);
      if (result.length === 0) {
        throw new Error(`no matching permissions for ${this.authConfig.userRoleIdKey}: ${userRoleId}`);
      }
      Object.assign(this.permissions, result[0].permissions);
    } else {
      throw new Error('permissions not enabled');
    }
  }

  public resetPermissions(): boolean {
    const keys = Object.keys(this.permissions);
    for (const key of keys) {
      delete this.permissions[key];
    }

    return (Object.keys(this.permissions).length === 0);
  }

  private async loadUserPermissionDataSet(): Promise<boolean> {
    if (this.authConfig.userPermissionsEnabled) {
      if (this.permissionDataSet && this.permissionDataSet.length > 0) {
        return true;
      } else if (this.authConfig.permissionDataSet && this.authConfig.permissionDataSet.length > 0) {
        this.permissionDataSet = this.authConfig.permissionDataSet;
        return true;
      } else {
        this.permissionDataSet = await this.sendGetPermissionsRequest();
      }
    } else {
      throw new Error('permissions not enabled');
    }
  }

  private async sendGetPermissionsRequest(): Promise<UserPermissions[]> {
    const dataSet = await this.http.get<any[]>(this.authConfig.getPermissionUrl).toPromise();
    const permissionDataSet: UserPermissions[] = [];
    dataSet.forEach(data => permissionDataSet.push(this.authConfig.convertToUserPermissionType(data)));
    return permissionDataSet;
  }

}
