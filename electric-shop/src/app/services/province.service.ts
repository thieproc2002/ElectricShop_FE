// src/app/services/province.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Province, District, Ward } from '../common/Location';
@Injectable({
  providedIn: 'root'
})
export class ProvinceService {
  private apiUrl = 'https://provinces.open-api.vn/api';

  constructor(private http: HttpClient) {}

  getProvinces(): Observable<any[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/p`);
  }

  getDistricts(provinceCode: number): Observable<{ districts: District[] }> {
    return this.http.get<{ districts: District[] }>(`${this.apiUrl}/p/${provinceCode}?depth=2`);
  }

  getWards(districtCode: number): Observable<{ wards: Ward[] }> {
    return this.http.get<{ wards: Ward[] }>(`${this.apiUrl}/d/${districtCode}?depth=2`);
  }
}
