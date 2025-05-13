import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { ICreateOrderRequest, IPayPalConfig } from 'ngx-paypal';
import { ToastrService } from 'ngx-toastr';
import { Cart } from 'src/app/common/Cart';
import { CartDetail } from 'src/app/common/CartDetail';
import { ChatMessage } from 'src/app/common/ChatMessage';
import { District } from 'src/app/common/District';
import { Notification } from 'src/app/common/Notification';
import { Order } from 'src/app/common/Order';
import { Province } from 'src/app/common/Province';
import { Ward } from 'src/app/common/Ward';
import { CartService } from 'src/app/services/cart.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrderService } from 'src/app/services/order.service';
import { ProvinceService } from 'src/app/services/province.service';
import { SessionService } from 'src/app/services/session.service';
import { WebSocketService } from 'src/app/services/web-socket.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  cart!: Cart;
  cartDetail!: CartDetail;
  cartDetails!: CartDetail[];

  discount!: number;
  amount!: number;
  amountReal!: number;

  postForm: FormGroup;
  orderId!: number;
  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];


  province!: Province;
  district!: District;
  ward!: Ward;

  amountPaypal !:number;
  provinceCode!: number;
  districtCode!: number;
  wardCode!: number;
  public payPalConfig ? : IPayPalConfig;

  constructor(
    private cartService: CartService,
    private toastr: ToastrService,
    private router: Router,
    private sessionService: SessionService,
    private orderService: OrderService,
    private provinceService: ProvinceService,
    private webSocketService: WebSocketService,
    private notificationService: NotificationService) {
    this.postForm = new FormGroup({
      'phone': new FormControl(null, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
      'province': new FormControl(0, [Validators.required, Validators.min(1)]),
      'district': new FormControl(0, [Validators.required, Validators.min(1)]),
      'ward': new FormControl(0, [Validators.required, Validators.min(1)]),
      'number': new FormControl('', Validators.required),
    })
  }

  ngOnInit(): void {
    this.checkOutPaypal();
    this.webSocketService.openWebSocket();
    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
        return;
      }
      window.scrollTo(0, 0)
    });
    this.discount = 0;
    this.amount = 0;
    this.amountPaypal = 0;
    this.amountReal = 0;
    this.getAllItem();
    this.loadProvinces();
  }
loadProvinces(): void {
    this.provinceService.getProvinces().subscribe(data => {
      this.provinces = data;
    });
  }

  onProvinceChange(event: any): void {
    const provinceCode = event.target.value;
    this.provinceService.getDistricts(provinceCode).subscribe(data => {
      this.districts = data.districts; 
      this.wards = [];
      this.postForm.controls['district'].setValue('');
      this.postForm.controls['ward'].setValue('');
    });
  }

  onDistrictChange(event: any): void {
    const districtCode = event.target.value;
    this.provinceService.getWards(districtCode).subscribe(data => {
      this.wards = data.wards;
      this.postForm.controls['ward'].setValue('');
    });
  }
  getAllItem() {
    let email = this.sessionService.getUser();
    this.cartService.getCart(email).subscribe(data => {
      this.cart = data as Cart;
      this.postForm = new FormGroup({
        'phone': new FormControl(this.cart.phone, [Validators.required, Validators.pattern('(0)[0-9]{9}')]),
        'province': new FormControl(0, [Validators.required, Validators.min(1)]),
        'district': new FormControl(0, [Validators.required, Validators.min(1)]),
        'ward': new FormControl(0, [Validators.required, Validators.min(1)]),
        'number': new FormControl('', Validators.required),
      })
      this.cartService.getAllDetail(this.cart.cartId).subscribe(data => {
        this.cartDetails = data as CartDetail[];
        this.cartService.setLength(this.cartDetails.length);
        if (this.cartDetails.length == 0) {
          this.router.navigate(['/']);
          this.toastr.info('Select a few products and proceed to checkout', 'System!');
        }
        this.cartDetails.forEach(item => {
          this.amountReal += item.product.price * item.quantity;
          this.amount += item.price;
        })
        this.discount = this.amount - this.amountReal;

        this.amountPaypal = (this.amount/25989);
      });
    });
  }

  checkOut() {
  if (this.postForm.valid) {
    if (1==1) { // Kiểm tra xem các thuộc tính đã được gán giá trị chưa
      Swal.fire({
        title: 'Bạn có chắc muốn đặt hàng?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'Không',
        confirmButtonText: 'Có'
      }).then((result) => {
        if (result.isConfirmed) { // Kiểm tra nếu người dùng đã bấm nút "Yes"
          let email = this.sessionService.getUser();
          this.cartService.getCart(email).subscribe(data => {
            this.cart = data as Cart;

            this.cart.address = this.createFullAddress();
            this.cart.phone = this.postForm.value.phone;
            this.cartService.updateCart(email, this.cart).subscribe(data => {
              this.cart = data as Cart;
              this.orderService.post(email, this.cart).subscribe(data => {
                let order: Order = data as Order;
                this.sendMessage(order.ordersId);
                Swal.fire(
                  'Đặt hàng thành công!',
                  'Chúc mừng, bạn đã đặt hàng thành công.',
                  'success'
                );
                this.router.navigate(['/cart']);
              }, error => {
                this.toastr.error(`Trong giỏ hàng của bạn có sản phẩm hết hàng xin kiểm tra!`);
              });
            }, error => {
              this.toastr.error('Error!', 'System!');
            });
          }, error => {
            this.toastr.error('Error!', 'System!');
          });
        } else {
          // Hành động khi người dùng bấm "Cancel"
          Swal.fire(
            'Cancelled',
            'Your order was not placed.',
            'error'
          );
        }
      });
    } else {
      console.error('One or more of ward, district, or province is undefined.');
    }
  } else {
    this.toastr.error('Vui lòng điền đầy đủ thông tin', 'System!');
  }
}
checkOutpay() {
  if (this.postForm.valid) {
    // Kiểm tra nếu người dùng đã bấm nút "Yes"
          let email = this.sessionService.getUser();
          this.cartService.getCart(email).subscribe(data => {
            this.cart = data as Cart;

            this.cart.address = this.createFullAddress();
            this.cart.phone = this.postForm.value.phone;
            this.cartService.updateCart(email, this.cart).subscribe(data => {
              this.cart = data as Cart;
              this.orderService.postpaypal(email, this.cart).subscribe(data => {
                let order: Order = data as Order;
                this.orderId = order.ordersId;
                this.sendMessage(order.ordersId);
                Swal.fire(
                  'Đã thanh toán!',
                  'Chúc mừng, bạn đã thanh toán thành công đơn hàng.',
                  'success'
                );
                this.router.navigate(['/cart']);
              }, error => {
                this.toastr.error(`Trong giỏ hàng của bạn có sản phẩm hết hàng xin kiểm tra!`);
              });
            }, error => {
              this.toastr.error('Cập nhật thông tin giao hàng thất bại', 'System!');
            });
          }, error => {
            this.toastr.error('Lấy thông tin giỏ hàng thất bại!', 'System!');
          });
  } else {
    this.toastr.error('Vui lòng điền đầy đủ thông tin', 'System!');
  }
}
createFullAddress(): string {
    const number = this.postForm.value.number || '';
    const wardCode = this.postForm.value.ward;
    const districtCode = this.postForm.value.district;
    const provinceCode = this.postForm.value.province;

    // Kiểm tra nếu các danh sách đã được tải
    const wardName = this.wards.find(obj => obj.code == wardCode)?.name || '';
    const districtName = this.districts.find(obj => obj.code == districtCode)?.name || '';
    const provinceName = this.provinces.find(obj => obj.code == provinceCode)?.name || '';
    
    // Tạo địa chỉ đầy đủ
    return `${number}, ${wardName}, ${districtName}, ${provinceName}`.replace(/(^, |, $)/g, '');
   
}
  sendMessage(id:number) {
    let chatMessage = new ChatMessage(this.cart.user.name, ' has placed an order.');
    this.notificationService.post(new Notification(0, this.cart.user.name + ' has placed an order. ('+id+')')).subscribe(data => {
      this.webSocketService.sendMessage(chatMessage);
    })
  }

  
getWardByCode(code: any): string | null {
    const ward = this.wards.find(obj => obj.code === code);
    return ward ? ward.name : null;
}

getProvineByCode(code: any): string | null {
    const province = this.provinces.find(obj => obj.code === code);
    return province ? province.name : null;
}

getDistristByCode(code: any): string | null {
    const district = this.districts.find(obj => obj.code === code);
    return district ? district.name : null;
}
  // paidOrder(id: number) {
  //     if(id===-1) {
  //       return;
  //     }
  //     this.orderService.paid(id).subscribe(data => {
  //       // this.orderId = data as number;
  //       this.toastr.success('Success!', 'System!');
  //       Swal.fire(
  //           'Thanh toán thành công',
  //           'Đơn hàng của bạn đã được thanh toán thành công.',
  //           'success'
  //         );
  //       this.router.navigate(['/cart']);
  //     }, error => {
  //       this.toastr.error('Your cart has a product that is out of stock!', 'System!');
  //     });
  
  //   }
 

  private checkOutPaypal(): void {

    this.payPalConfig = {
        currency: 'USD',
        clientId: 'AUCgt1p-frA-P8xTYfeWqhcZPm_4i4kx0BAKAxcVpY1dHCIXjF44LA21ns2UhFYd6WmHJx2L9U817cPO',
        createOrderOnClient: (data) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value:String(this.amountPaypal.toFixed(2)),

                },

            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'vertical',
            color: 'blue',
            size: 'small',
            shape: 'rect',
        },
        onApprove: (data, actions) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.order.get().then((details: any) => {
                console.log('onApprove - you can get full order details inside onApprove: ', details);
            });

        },
        onClientAuthorization: (data) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
            this.checkOutpay();  
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);

        },
        onError: err => {
            console.log('OnError', err);  
        },
        onClick: (data, actions) => {
          console.log('onClick', data, actions);
            
        },
    };
}

}
