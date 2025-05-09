import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {  contact } from 'src/app/common/Contact';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {

  constructor(private builder: FormBuilder, private toastr: ToastrService, private cartService: CartService,) { }
  _regform = this.builder.group({
    name: this.builder.control('', Validators.required),
    email: ['', [Validators.required, Validators.email]],
    subject: this.builder.control('', Validators.required),
    message: this.builder.control('', Validators.required),
  });
  ngOnInit(): void {
  }

  proceedContact() {
    if (this._regform.valid == false) {
      this.toastr.warning('warning', 'Invalid Value!');
      return;
    } 
    let _obj: contact = {
      contactID: 0,
      name: this._regform.value.name as string,
      email: this._regform.value.email as string,
      subject:  this._regform.value.subject as string,
      message:   this._regform.value.message as string,
      status:1
    }
    this.cartService.postContact(_obj).subscribe(data => {
      
      if(data != null){
        this.toastr.success('Thank you for contacting us!', 'System!');
        this._regform.reset(); 
      }else{
        this.toastr.error('Error!', 'System!');
      }
    }, error => {
      this.toastr.error('Error!', 'System!');
    })
    
  }
}

