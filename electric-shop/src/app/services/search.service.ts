import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SearchService {
private baseUrl = 'http://localhost:8080/api/products/search';

  constructor(private http: HttpClient) {}

  searchProducts(userid: number, keyword: string): Observable<any> {
    const url = `${this.baseUrl}/${userid}`;
    const headers = new HttpHeaders({
      'Content-Type': 'text/plain'
    });

    return this.http.post(url, keyword, { headers });
  }
}
