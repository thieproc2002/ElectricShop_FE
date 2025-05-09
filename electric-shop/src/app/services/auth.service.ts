import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Login } from '../common/Login';
import { Register } from '../common/Register';
import { SessionService } from './session.service';
import { Customer } from '../common/Customer';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  url = 'http://localhost:8080/api/auth/';

  constructor(private sessionService: SessionService, private http: HttpClient) { }

  login(userData: Login): Observable<any> {
    return this.http.post(this.url + 'signin', userData);
  }
  register(user: Register): Observable<any> {
    return this.http.post(this.url + 'signup', user);
  }

  forgotPassword(email: string) {
    return this.http.post(this.url + 'send-mail-forgot-password-token', email);
  }
  
  updateUser(id: number, user: Customer): Observable<any> {
    const url = `${this.url}/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(url, user, { headers });
  }
}
