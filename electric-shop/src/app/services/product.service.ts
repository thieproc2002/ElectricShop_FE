import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '../common/Product';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  url = 'http://localhost:8080/api/products';

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Product[]> {
    return this.httpClient.get<Product[]>(this.url + '/status');
  }

  getLasted() {
    return this.httpClient.get(this.url+'/latest');
  }

  getBestSeller() {
    return this.httpClient.get(this.url+'/bestseller');
  }

  getRated() {
    return this.httpClient.get(this.url+'/rated');
  }

  getOne(id: number) {
    return this.httpClient.get(this.url+'/'+id);
  }

  getByCategory(id: number) {
    return this.httpClient.get(this.url+'/category/'+id);
  }

  getSuggest(categoryId: number, productId: number) {
    return this.httpClient.get(this.url+'/suggest/'+categoryId+"/"+productId);
  }
}
