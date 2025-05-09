import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ChatMessage } from 'src/app/common/ChatMessage';
import { Customer } from 'src/app/common/Customer';
import { Notification } from 'src/app/common/Notification';
import { Order } from 'src/app/common/Order';
import { CustomerService } from 'src/app/services/customer.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrderService } from 'src/app/services/order.service';
import { SessionService } from 'src/app/services/session.service';
import { UploadService } from 'src/app/services/upload.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  customer!: Customer;
  customerUpdate!: Customer;
  orders!: Order[];

  page: number = 1;

  done!: number;

  constructor(
    private customerService: CustomerService,
    private toastr: ToastrService,
    private sessionService: SessionService,
    private router: Router,
    private orderService: OrderService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService,
    private modalService: NgbModal,
    private builder: FormBuilder,
    private uploadService: UploadService) {

  }

  ngOnInit(): void {
    this.webSocketService.openWebSocket();
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.getCustomer();
    this.getOrder();
  }

  ngOnDestroy(): void {
    this.webSocketService.closeWebSocket();
  }

  getCustomer() {
    let email = this.sessionService.getUser();
    this.customerService.getByEmail(email).subscribe(data => {
      this.customer = data as Customer;
      this.customerUpdate =JSON.parse(JSON.stringify(this.customer));
      
    }, error => {
      this.toastr.error('Error!', 'System!')
      window.location.href = ('/');
    })
  }

  getOrder() {
    let email = this.sessionService.getUser();
    this.orderService.get(email).subscribe(data => {
      this.orders = data as Order[];
      this.done = 0;
      this.orders.forEach(o => {
        if (o.status === 2) {
          this.done += 1
        }
      })
    }, error => {
      this.toastr.error('Error!', 'System!');
    })
  }

  cancel(id: number) {
    if(id===-1) {
      return;
    }
    Swal.fire({
      title: 'Would you like to cancel this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'No',
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.orderService.cancel(id).subscribe(data => {
          this.getOrder();
          this.sendMessage(id);
          this.toastr.success('Cancelled Order!', 'System!');
        }, error => {
          this.toastr.error('Error!', 'System!');
        })
      }
    })

  }

  sendMessage(id:number) {
    let chatMessage = new ChatMessage(this.customer.name, ' has cancelled an order.');
    this.notificationService.post(new Notification(0, this.customer.name + ' has cancelled an order ('+id+')')).subscribe(data => {
      this.webSocketService.sendMessage(chatMessage);
    })
  }

  finish() {
    this.ngOnInit();
  }

  CompareProduct(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'l' });
    
	}
  
  ShowChangePass(content: TemplateRef<any>) {
		this.modalService.open(content, { size: 'l' });
    
	}
  updateUser(){
    if (this.customerUpdate.userId) {
      this.customerService.update(this.customerUpdate.userId, this.customerUpdate).subscribe(data => {
      this.toastr.success('Success!', 'System!');
      console.log(data)
      this.updateUI(data);
      this.modalService.dismissAll();
      
    }, error => {
      this.toastr.error('Error!', 'System!');
    })
    } else {
      console.error('User ID is required for update');
    }
  }
  updateUI(updatedData:any) {
     this.customer= updatedData
  }
  
  _regform = this.builder.group({
    oldPassword: this.builder.control('', [Validators.required, Validators.minLength(6)]),
    password: this.builder.control('',[Validators.required, Validators.minLength(6)]),
    confirmpassword:  this.builder.control('',[Validators.required, Validators.minLength(6)]),
  });
  proceedChangePass() {
    console.log(this._regform.valid);
    if (!this._regform.valid) {
      this.toastr.warning('Invalid Password!', 'System!');
      return;
    }
    if (this._regform.value.password !== this._regform.value.confirmpassword) {
      this.toastr.warning('The confirm password does not match!', 'System!');
      return;
    }
    // Kiểm tra mật khẩu cũ
    const oldPassword = this._regform.value.oldPassword;
    this.customerService.verifyOldPassword(this.customerUpdate.userId, oldPassword).subscribe(
      isPasswordCorrect => {
        if (!isPasswordCorrect) {
          this.toastr.warning('Old password is incorrect!', 'System!');
          return;
        }
        // Mật khẩu cũ đúng, tiếp tục cập nhật mật khẩu mới
        this.customerUpdate.password = this._regform.value.password;
        this.customerService.update(this.customerUpdate.userId, this.customerUpdate).subscribe(
          data => {
            this.toastr.success('Success!', 'System!');
            this.updateUI(data);
            this.modalService.dismissAll();
          },
          error => {
            this.toastr.error('Error!', 'System!');
          }
        );
      },
      error => {
        this.toastr.error('Error verifying old password!', 'System!');
      }
    );
}

  selectFile!: File;
  url: string = 'https://res.cloudinary.com/veggie-shop/image/upload/v1633795994/users/mnoryxp056ohm0b4gcrj.png';
  image: string = this.url;
  onFileSelect(event: any) {
    this.selectFile = event.target.files[0];
    this.uploadService.uploadCustomer(this.selectFile).subscribe(response => {
      if (response) {
        this.image = response.secure_url;
        this.customerUpdate.image = this.image
      }
    })
  }



}
