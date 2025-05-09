import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '../common/Product';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class RecommendService {

  url = 'http://localhost:8080/api/recommendations';

  constructor(private httpClient: HttpClient) { }
  
  getRecommend(userId: number) {
    return this.httpClient.get(this.url+'/nopage/' + userId);
  }
}
